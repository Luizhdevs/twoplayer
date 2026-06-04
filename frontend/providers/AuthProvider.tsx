"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { auth, onAuthStateChanged, signOut } from "@/lib/firebase";
import { api } from "@/lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type DbUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "USER" | "PROVIDER" | "ADMIN";
};

type AuthCtx = {
  firebaseUser: User | null;
  dbUser:       DbUser | null;
  loading:      boolean;
  logout:       () => Promise<void>;
};

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthCtx>({
  firebaseUser: null,
  dbUser:       null,
  loading:      true,
  logout:       async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uidCacheKey(firebaseUid: string) {
  return `_tp_uid_${firebaseUid}`;
}

async function syncUser(user: User): Promise<DbUser | null> {
  try {
    // Tenta criar o usuário (upsert não existe no backend, então tratamos o 409)
    const { data } = await api.post<{ data: DbUser }>("/users", {
      firebaseUid: user.uid,
      email:       user.email,
      name:        user.displayName ?? user.email?.split("@")[0] ?? "Usuário",
    });
    const dbUser = data.data;
    // Cacheia o mapeamento Firebase UID → DB id para recuperação em 409
    localStorage.setItem(uidCacheKey(user.uid), dbUser.id);
    return dbUser;
  } catch {
    // POST falhou (provavelmente 409 — usuário já existe)
    // Tenta recuperar pelo id em cache
    const cachedId = localStorage.getItem(uidCacheKey(user.uid));
    if (cachedId) {
      try {
        const { data } = await api.get<{ data: DbUser }>(`/users/${cachedId}`);
        return data.data;
      } catch {}
    }
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbUser,       setDbUser]       = useState<DbUser | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        setDbUser(await syncUser(user));
      } else {
        setDbUser(null);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  async function logout() {
    await signOut(auth);
    setFirebaseUser(null);
    setDbUser(null);
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, dbUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
