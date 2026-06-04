"use client";

import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile, useUpdateAvatar } from "@/hooks/useProfile";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT:              { label: "Ag. pagamento",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  EXPIRED:                      { label: "Expirado",       color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  PENDING:                      { label: "Pendente",       color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  PAID:                         { label: "Pago",           color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CONFIRMED:                    { label: "Confirmado",     color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  IN_PROGRESS:                  { label: "Em andamento",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Ag. aprovação",  color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  COMPLETED:                    { label: "Concluído",      color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:                    { label: "Cancelado",      color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REFUNDED:                     { label: "Reembolsado",    color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  DISPUTED:                     { label: "Em disputa",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export default function ProfilePage() {
  const params       = useParams();
  const router       = useRouter();
  const id           = params?.id as string;
  const { logout }   = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading, isError, error, refetch } = useProfile(id);
  const updateAvatar = useUpdateAvatar();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateAvatar.mutate(file);
    e.target.value = "";
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d0d0d", flexDirection:"column", gap:16, fontFamily:"'Sora',sans-serif" }}>
      <style>{`@keyframes ppSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #333", borderTopColor:"#fd5b01", animation:"ppSpin 0.8s linear infinite" }} />
      <span style={{ color:"#555", fontSize:13 }}>Carregando perfil...</span>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError || !user) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d0d0d", flexDirection:"column", gap:16, fontFamily:"'Sora',sans-serif", padding:"1.5rem" }}>
      <span style={{ fontSize:40 }}>😕</span>
      <p style={{ color:"#f87171", fontSize:15, fontWeight:600, textAlign:"center" }}>
        {(error as any)?.response?.status === 404
          ? "Perfil não encontrado."
          : "Não foi possível carregar o perfil."}
      </p>
      <div style={{ display:"flex", gap:12 }}>
        <button
          onClick={() => refetch()}
          style={{ padding:"10px 20px", background:"#fd5b01", color:"#fff", border:"none", borderRadius:8, fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}
        >
          Tentar novamente
        </button>
        <Link href="/home" style={{ padding:"10px 20px", background:"rgba(255,255,255,0.08)", color:"#ccc", borderRadius:8, textDecoration:"none", fontFamily:"'Sora',sans-serif", fontSize:13 }}>
          ← Voltar
        </Link>
      </div>
    </div>
  );

  const walletBalance = (user.wallet?.balance ?? 0) / 100;
  const recentAppts   = (user.appointments ?? []).slice(0, 5);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes ppSpin   { to { transform: rotate(360deg); } }
        @keyframes ppFadeIn { from{opacity:0} to{opacity:1} }
        .pp * { font-family:'Sora',sans-serif; box-sizing:border-box; }
        .pp-card { background:#1a1a1a; border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:1.75rem; margin-bottom:1.25rem; }
        .pp-section-title { font-size:13px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem; display:flex; align-items:center; gap:10px; }
        .pp-section-title::before { content:''; display:block; width:3px; height:14px; background:#fd5b01; border-radius:2px; flex-shrink:0; }
        .pp-config-btn { width:100%; padding:13px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:500; color:#ccc; text-align:left; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.2s; margin-bottom:8px; }
        .pp-config-btn:hover { background:rgba(253,91,1,0.1); border-color:rgba(253,91,1,0.3); color:#fd5b01; }
        .pp-wallet { background:linear-gradient(135deg,#fd5b01,#ff8c42); border-radius:14px; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; transition:transform .2s,box-shadow .2s; box-shadow:0 4px 24px rgba(253,91,1,0.3); border:none; width:100%; font-family:'Sora',sans-serif; }
        .pp-wallet:hover { transform:scale(1.01); box-shadow:0 8px 32px rgba(253,91,1,0.45); }
        .pp-avatar-wrap { position:relative; width:88px; height:88px; flex-shrink:0; border-radius:50%; overflow:hidden; border:3px solid rgba(253,91,1,0.4); cursor:pointer; }
        .pp-avatar-wrap:hover .pp-avatar-overlay { opacity:1; }
        .pp-avatar-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; font-size:20px; }
        .pp-avatar-spinner { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); }
        .pp-avatar-spinner::after { content:''; width:24px; height:24px; border-radius:50%; border:2.5px solid rgba(255,255,255,0.2); border-top-color:#fff; animation:ppSpin 0.7s linear infinite; }
        .pp-appt { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; margin-bottom:10px; transition:background 0.2s; display:block; text-decoration:none; }
        .pp-appt:hover { background:rgba(253,91,1,0.06); border-color:rgba(253,91,1,0.2); }
        .pp-success-msg { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:#4ade80; font-weight:600; animation:ppFadeIn 0.3s ease; }
      `}</style>

      <div className="pp" style={{ background:"#0d0d0d", minHeight:"100vh", padding:"5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* HEADER */}
          <div className="pp-card">
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>

              {/* Avatar */}
              <div className="pp-avatar-wrap" onClick={() => fileInputRef.current?.click()} title="Alterar foto de perfil">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} fill alt="Avatar" style={{ objectFit:"cover" }} />
                ) : (
                  <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#fd5b01,#ff8c42)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:700, color:"#fff" }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {updateAvatar.isPending
                  ? <div className="pp-avatar-spinner" />
                  : <div className="pp-avatar-overlay">📷</div>
                }
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={handleAvatarChange} />

              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:4 }}>{user.name}</h1>
                <p style={{ fontSize:13, color:"#777", marginBottom: user.bio ? 8 : 0 }}>{user.email}</p>
                {user.bio && (
                  <span style={{ display:"inline-block", background:"rgba(253,91,1,0.1)", border:"1px solid rgba(253,91,1,0.2)", borderRadius:100, padding:"3px 12px", fontSize:12, color:"#fd5b01" }}>
                    {user.bio}
                  </span>
                )}
                {updateAvatar.isSuccess && (
                  <p className="pp-success-msg" style={{ marginTop:6 }}>✅ Foto atualizada!</p>
                )}
                {updateAvatar.error && (
                  <p style={{ fontSize:11, color:"#f87171", marginTop:6 }}>⚠️ {(updateAvatar.error as any).message}</p>
                )}
                <p style={{ fontSize:10, color:"#444", marginTop:6 }}>Clique na foto para alterar</p>
              </div>
            </div>

            {/* Carteira */}
            <button className="pp-wallet" onClick={() => router.push(`/users/${id}/wallet`)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:42, height:42, background:"rgba(255,255,255,0.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👛</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Minha Carteira</div>
                  <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>
                    R$ {walletBalance.toFixed(2).replace(".",",")}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", background:"rgba(255,255,255,0.15)", padding:"7px 14px", borderRadius:8, whiteSpace:"nowrap" }}>
                Ver carteira →
              </div>
            </button>
          </div>

          {/* AGENDAMENTOS RECENTES */}
          <div className="pp-card">
            <div className="pp-section-title">Agendamentos recentes</div>
            {recentAppts.length === 0 ? (
              <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
                <p style={{ fontSize:14, color:"#555", marginBottom:12 }}>Nenhum agendamento ainda.</p>
                <Link href="/home" style={{ color:"#fd5b01", textDecoration:"none", fontSize:13 }}>Explorar prestadores →</Link>
              </div>
            ) : (
              <>
                {recentAppts.map(a => {
                  const sc = STATUS_LABELS[a.status] ?? { label: a.status, color:"#aaa", bg:"rgba(255,255,255,0.06)" };
                  const date = new Date(a.scheduledAt).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" });
                  const time = new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
                  return (
                    <Link key={a.id} href={`/appointments/${a.id}`} className="pp-appt">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div>
                          <p style={{ fontWeight:700, fontSize:14, color:"#f0f0f0", marginBottom:2 }}>{a.service}</p>
                          <p style={{ fontSize:12, color:"#777" }}>com {a.provider}</p>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, color:sc.color, background:sc.bg, padding:"3px 9px", borderRadius:100, border:`1px solid ${sc.color}33`, whiteSpace:"nowrap" }}>
                          {sc.label}
                        </span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:11, color:"#555" }}>📅 {date} · {time}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#fd5b01" }}>R$ {(a.amount / 100).toFixed(2)}</span>
                      </div>
                    </Link>
                  );
                })}
                <Link href="/appointments" style={{ fontSize:12, color:"#fd5b01", textDecoration:"none", display:"block", textAlign:"center", marginTop:8 }}>
                  Ver todos os agendamentos →
                </Link>
              </>
            )}
          </div>

          {/* CONFIGURAÇÕES */}
          <div className="pp-card">
            <div className="pp-section-title">Configurações</div>
            <button className="pp-config-btn" onClick={() => fileInputRef.current?.click()}>📷 Alterar foto de perfil</button>
            <Link href="/notifications" style={{ textDecoration:"none" }}>
              <button className="pp-config-btn">🔔 Minhas notificações</button>
            </Link>
            <button className="pp-config-btn" onClick={async () => { await logout(); window.location.href = "/login"; }}>🚪 Sair da conta</button>
          </div>

        </div>
      </div>
    </>
  );
}
