"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

type UserInfo = { id: number; tipo: "user" | "colab" } | null;

function getUserInfo(): UserInfo {
  if (typeof window === "undefined") return null;
  try {
    const colab = localStorage.getItem("tp_colab");
    if (colab) { const d = JSON.parse(colab); if (d.id) return { id: d.id, tipo: "colab" }; }
    const user = localStorage.getItem("tp_user");
    if (user) { const d = JSON.parse(user); if (d.id) return { id: d.id, tipo: "user" }; }
  } catch {}
  return null;
}

export default function Navbar() {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUserInfo(getUserInfo());
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // checar posição inicial
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const profileHref = userInfo
    ? userInfo.tipo === "colab"
      ? `/colaborador/${userInfo.id}/perfil`
      : `/users/${userInfo.id}/profile`
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        .tp-navbar * { font-family: 'Sora', sans-serif; box-sizing: border-box; }
        .tp-nav-link {
          font-size: 13px; font-weight: 500;
          text-decoration: none; padding: 7px 14px; border-radius: 8px;
          color: rgba(255,255,255,0.8);
          transition: background 0.2s, color 0.2s;
        }
        .tp-nav-link:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .tp-nav-disabled {
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.3);
          padding: 7px 14px; border-radius: 8px; cursor: not-allowed;
        }
      `}</style>

      <div
        className="tp-navbar"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? "rgba(13,13,13,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.5)" : "none",
          transition: "background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
        }}>
          {/* LOGO */}
          <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/logo.png" width={36} height={36} alt="TwoPlayers" />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
              Two<span style={{ color: "#fd5b01" }}>Players</span>
            </span>
          </Link>

          {/* LINKS */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/home" className="tp-nav-link">Home</Link>
            {profileHref
              ? <Link href={profileHref} className="tp-nav-link">Meu Perfil</Link>
              : <span className="tp-nav-disabled">Meu Perfil</span>
            }
          </div>
        </div>
      </div>
    </>
  );
}
