"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Appointment = { id: number; service: string; provider: string; date: string; status: string };
type UserProfile = { id: number; name: string; email: string; avatarUrl?: string; bio?: string; appointments?: Appointment[] };

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  "Concluído": { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  "Agendado":  { color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  "Cancelado": { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const MOCK_SALDO = 150.00;

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [showIndisponivel, setShowIndisponivel] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:3001/users/${id}/profile`, { cache: "no-store" });
        if (res.ok) { setUser(await res.json()); setLoading(false); return; }
      } catch {}
      try {
        const stored = localStorage.getItem("tp_user");
        if (stored) {
          const local = JSON.parse(stored);
          if (String(local.id) === String(id)) { setUser({ id: local.id, name: local.name, email: local.email }); setLoading(false); return; }
        }
      } catch {}
      setError("Não foi possível carregar o perfil."); setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d0d0d", color:"#aaa", fontFamily:"'Sora',sans-serif" }}>Carregando...</div>;
  if (error)   return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d0d0d", color:"#f87171", fontFamily:"'Sora',sans-serif" }}>{error}</div>;
  if (!user)   return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .pp * { font-family:'Sora',sans-serif; box-sizing:border-box; }

        .pp-card {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
        }

        .pp-section-title {
          font-size: 13px; font-weight: 700; color: #aaa;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;
        }
        .pp-section-title::before {
          content: ''; display: block; width: 3px; height: 14px;
          background: #fd5b01; border-radius: 2px; flex-shrink: 0;
        }

        .pp-appoint {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 1rem 1.25rem;
          margin-bottom: 10px; transition: background 0.2s;
        }
        .pp-appoint:hover { background: rgba(253,91,1,0.06); }

        .pp-config-btn {
          width: 100%; padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 500;
          color: #ccc; text-align: left; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: all 0.2s; margin-bottom: 8px;
        }
        .pp-config-btn:hover { background: rgba(253,91,1,0.1); border-color: rgba(253,91,1,0.3); color: #fd5b01; }

        .pp-wallet {
          background: linear-gradient(135deg, #fd5b01, #ff8c42);
          border-radius: 14px; padding: 16px 18px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; cursor: pointer; border: none; width: 100%;
          font-family: 'Sora', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(253,91,1,0.3);
        }
        .pp-wallet:hover { transform: scale(1.01); box-shadow: 0 8px 32px rgba(253,91,1,0.45); }

        /* MODAL */
        .pp-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: ppFadeIn 0.2s ease;
        }
        @keyframes ppFadeIn { from{opacity:0} to{opacity:1} }
        .pp-modal {
          background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 2rem; width: 100%; max-width: 400px;
          position: relative; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          animation: ppPopIn 0.25s ease; font-family: 'Sora', sans-serif;
        }
        @keyframes ppPopIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .pp-modal-close {
          position: absolute; top: 14px; right: 14px;
          background: rgba(255,255,255,0.08); border: none; border-radius: 6px;
          padding: 6px 10px; cursor: pointer; font-size: 14px;
          color: #aaa; transition: all 0.15s;
        }
        .pp-modal-close:hover { background: #fd5b01; color: #fff; }
        .pp-modal-btn {
          margin-top: 1.25rem; width: 100%; padding: 12px;
          background: #fd5b01; color: #fff; border: none; border-radius: 8px;
          font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px;
          cursor: pointer; box-shadow: 0 4px 12px rgba(253,91,1,0.35);
          transition: background 0.2s;
        }
        .pp-modal-btn:hover { background: #d94d00; }
      `}</style>

      <div className="pp" style={{ background:"#0d0d0d", minHeight:"100vh", padding:"5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* HEADER */}
          <div className="pp-card">
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
              <div style={{
                width:88, height:88, borderRadius:"50%",
                background:"linear-gradient(135deg,#fd5b01,#ff8c42)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:32, fontWeight:700, color:"#fff", flexShrink:0,
                boxShadow:"0 4px 24px rgba(253,91,1,0.35)",
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:4 }}>
                  {user.name}
                </h1>
                <p style={{ fontSize:13, color:"#777", marginBottom:user.bio ? 8 : 0 }}>{user.email}</p>
                {user.bio && (
                  <span style={{
                    display:"inline-block",
                    background:"rgba(253,91,1,0.1)", border:"1px solid rgba(253,91,1,0.2)",
                    borderRadius:100, padding:"3px 12px", fontSize:12, color:"#fd5b01",
                  }}>
                    {user.bio}
                  </span>
                )}
              </div>
            </div>

            {/* CARTEIRA */}
            <button className="pp-wallet" onClick={() => router.push(`/users/${id}/wallet`)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:42, height:42, background:"rgba(255,255,255,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👛</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Minha Carteira</div>
                  <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>
                    R$ {MOCK_SALDO.toFixed(2).replace(".",",")}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", background:"rgba(255,255,255,0.15)", padding:"7px 14px", borderRadius:8, whiteSpace:"nowrap" }}>
                Ver carteira →
              </div>
            </button>
          </div>

          {/* AGENDAMENTOS */}
          {user.appointments && user.appointments.length > 0 && (
            <div className="pp-card">
              <div className="pp-section-title">Meus Agendamentos</div>
              {user.appointments.map(a => {
                const sc = STATUS_CONFIG[a.status] ?? { color:"#aaa", bg:"rgba(255,255,255,0.06)" };
                return (
                  <div key={a.id} className="pp-appoint">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:14, color:"#f0f0f0", marginBottom:2 }}>{a.service}</p>
                        <p style={{ fontSize:12, color:"#777" }}>com {a.provider}</p>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:sc.color, background:sc.bg, padding:"3px 10px", borderRadius:100, whiteSpace:"nowrap" }}>
                        {a.status}
                      </span>
                    </div>
                    <p style={{ fontSize:11, color:"#555", marginTop:8 }}>📅 {a.date}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONFIGURAÇÕES */}
          <div className="pp-card">
            <div className="pp-section-title">Configurações</div>
            <button className="pp-config-btn" onClick={() => setShowIndisponivel(true)}>✏️ Editar perfil</button>
            <button className="pp-config-btn" onClick={() => setShowIndisponivel(true)}>🔒 Alterar senha</button>
            <button className="pp-config-btn" onClick={() => {
              localStorage.removeItem("tp_user");
              localStorage.removeItem("tp_colab");
              localStorage.removeItem("tp_remember");
              window.location.href = "/login";
            }}>🚪 Sair da conta</button>
          </div>

        </div>
      </div>

      {showIndisponivel && (
        <div className="pp-overlay" onClick={() => setShowIndisponivel(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <button className="pp-modal-close" onClick={() => setShowIndisponivel(false)}>✕</button>
            <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"#fff", letterSpacing:"-0.02em" }}>Serviço indisponível</h3>
            <p style={{ fontSize:13, color:"#888", lineHeight:1.6 }}>Este serviço está atualmente indisponível. Em breve estará disponível!</p>
            <button className="pp-modal-btn" onClick={() => setShowIndisponivel(false)}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
