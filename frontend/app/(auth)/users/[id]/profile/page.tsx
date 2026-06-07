"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile, useUpdateAvatar } from "@/hooks/useProfile";
import { auth, sendPasswordResetEmail } from "@/lib/firebase";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT:              { label: "Ag. pagamento",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  EXPIRED:                      { label: "Expirado",       color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  PENDING:                      { label: "Pendente",       color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  PAID:                         { label: "Pago",           color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CONFIRMED:                    { label: "Confirmado",     color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  IN_PROGRESS:                  { label: "Em andamento",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Ag. aprovação",  color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  COMPLETED:                    { label: "Concluído",      color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:                    { label: "Cancelado",      color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REFUNDED:                     { label: "Reembolsado",    color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  DISPUTED:                     { label: "Em disputa",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

function ProfileSkeleton() {
  return (
    <div style={{ background: "var(--bg,#0d0d0d)", minHeight: "100vh", padding: "5.5rem 1.5rem 3rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ background: "#1a1a1a", borderRadius: 18, padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
            <div className="sk sk-circle" style={{ width: 88, height: 88, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk sk-h28" style={{ width: 180, marginBottom: 10, borderRadius: 6 }} />
              <div className="sk sk-h13" style={{ width: "60%", marginBottom: 8, borderRadius: 5 }} />
            </div>
          </div>
          <div className="sk sk-r-lg" style={{ height: 72, borderRadius: 14 }} />
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 18, padding: "1.5rem", marginBottom: "1rem" }}>
          <div className="sk sk-h16" style={{ width: 160, marginBottom: "1rem", borderRadius: 6 }} />
          {[1, 2].map(i => (
            <div key={i} className="sk sk-r-md" style={{ height: 68, marginBottom: 10 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params       = useParams();
  const router       = useRouter();
  const id           = params?.id as string;
  const { logout, updateDbUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pwResetMsg, setPwResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: user, isLoading, isError, error, refetch } = useProfile(id);
  const updateAvatar = useUpdateAvatar(id);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateAvatar.mutate(file, {
      onSuccess: (avatarUrl) => updateDbUser({ avatarUrl }),
    });
    e.target.value = "";
  }

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !user) return (
    <div className="page-loader">
      <span style={{ fontSize: 40 }}>😕</span>
      <p style={{ color: "#f87171", fontSize: 15, fontFamily: "var(--font)" }}>
        {(error as any)?.response?.status === 404 ? "Perfil não encontrado." : "Erro ao carregar perfil."}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => refetch()}
          style={{ padding: "10px 22px", background: "#fd5b01", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Tentar novamente
        </button>
        <Link href="/home" style={{ padding: "10px 22px", background: "rgba(255,255,255,0.07)", color: "#ccc", borderRadius: 8, textDecoration: "none", fontFamily: "var(--font)", fontSize: 13 }}>
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
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        @keyframes pp-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pp * { font-family: var(--font,'Sora',sans-serif); box-sizing: border-box; }
        .pp-page { background: var(--bg,#0d0d0d); min-height: 100vh; padding: 5.5rem 1.5rem 3rem; }
        .pp-inner { max-width: 720px; margin: 0 auto; }

        .pp-card {
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border,rgba(255,255,255,0.07));
          border-radius: 18px; padding: 1.5rem;
          margin-bottom: 1rem;
          animation: pp-in 0.3s ease both;
        }
        .pp-sec-title {
          font-size: 11px; font-weight: 700; color: var(--t3,#666);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;
        }
        .pp-sec-title::before { content:''; display:block; width:3px; height:12px; background:#fd5b01; border-radius:2px; flex-shrink:0; }

        /* Avatar */
        .pp-avatar-wrap {
          position: relative; width: 88px; height: 88px; flex-shrink: 0;
          border-radius: 50%; overflow: hidden;
          border: 3px solid rgba(253,91,1,0.40); cursor: pointer;
          background: linear-gradient(135deg,#fd5b01,#ff8c42);
        }
        .pp-avatar-wrap:hover .pp-overlay { opacity: 1; }
        .pp-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.58);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
          font-size: 22px;
        }
        .pp-avatar-loading {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.5);
        }
        .pp-avatar-loading::after {
          content: ''; width: 24px; height: 24px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.2); border-top-color: #fff;
          animation: pp-spin 0.7s linear infinite;
        }

        /* Wallet card */
        .pp-wallet {
          background: linear-gradient(135deg, #fd5b01 0%, #ff7a35 50%, #ff9a5c 100%);
          border-radius: 16px; padding: 18px 20px;
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          cursor: pointer; transition: transform .2s, box-shadow .2s;
          box-shadow: 0 6px 28px rgba(253,91,1,0.35);
          border: none; width: 100%; font-family: var(--font,'Sora',sans-serif);
          text-decoration: none;
        }
        .pp-wallet:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(253,91,1,0.50); }
        .pp-wallet:active { transform: scale(0.99); }
        .pp-wallet-left { display: flex; align-items: center; gap: 14px; }
        .pp-wallet-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center; font-size: 22px;
          flex-shrink: 0;
        }
        .pp-wallet-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
        .pp-wallet-value { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -.025em; }
        .pp-wallet-cta {
          font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.18); padding: 8px 15px; border-radius: 10px;
          white-space: nowrap;
        }

        /* Recent appointments */
        .pp-appt {
          display: block; text-decoration: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 1rem 1.25rem;
          margin-bottom: 10px;
          transition: background 0.2s, border-color 0.2s;
        }
        .pp-appt:hover { background: rgba(253,91,1,0.05); border-color: rgba(253,91,1,0.18); }
        .pp-appt-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 7px; gap: 8px;
        }
        .pp-appt-service { font-size: 14px; font-weight: 700; color: #f0f0f0; margin: 0 0 3px; }
        .pp-appt-provider { font-size: 12px; color: var(--t3,#666); }
        .pp-appt-badge {
          display: inline-flex; align-items: center;
          font-size: 10px; font-weight: 700;
          padding: 3px 9px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .pp-appt-footer {
          display: flex; justify-content: space-between; align-items: center;
        }
        .pp-appt-date  { font-size: 11px; color: var(--t4,#444); }
        .pp-appt-price { font-size: 12px; font-weight: 700; color: var(--brand,#fd5b01); }

        /* Config buttons */
        .pp-cfg-btn {
          width: 100%; padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px;
          font-family: var(--font,'Sora',sans-serif); font-size: 13px; font-weight: 500;
          color: #ccc; text-align: left; cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          transition: all 0.18s; margin-bottom: 8px;
        }
        .pp-cfg-btn:hover { background: rgba(253,91,1,0.08); border-color: rgba(253,91,1,0.25); color: #fd5b01; }
        .pp-cfg-btn:last-child { margin-bottom: 0; }
        .pp-cfg-btn-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
          transition: background 0.18s;
        }
        .pp-cfg-btn:hover .pp-cfg-btn-icon { background: rgba(253,91,1,0.15); }

        .pp-success { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #4ade80; font-weight: 600; animation: pp-in 0.3s ease; }

        @media (max-width: 480px) {
          .pp-page { padding: 5rem 1rem 2.5rem; }
          .pp-wallet-cta { display: none; }
        }
      `}</style>

      <div className="pp pp-page">
        <div className="pp-inner">

          {/* HEADER CARD */}
          <div className="pp-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
              {/* Avatar */}
              <div className="pp-avatar-wrap" onClick={() => fileInputRef.current?.click()} title="Alterar foto">
                {user.avatarUrl
                  ? <Image src={user.avatarUrl} fill alt="Avatar" style={{ objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#fd5b01,#ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff" }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                }
                {updateAvatar.isPending
                  ? <div className="pp-avatar-loading" />
                  : <div className="pp-overlay">📷</div>
                }
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarChange} />

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", margin: "0 0 4px" }}>{user.name}</h1>
                <p style={{ fontSize: 13, color: "var(--t3)", margin: "0 0 8px" }}>{user.email}</p>
                {user.bio && (
                  <span style={{ display: "inline-block", background: "rgba(253,91,1,0.10)", border: "1px solid rgba(253,91,1,0.20)", borderRadius: 100, padding: "3px 12px", fontSize: 12, color: "#fd5b01" }}>
                    {user.bio}
                  </span>
                )}
                {updateAvatar.isSuccess && <p className="pp-success" style={{ marginTop: 6 }}>✓ Foto atualizada!</p>}
                {updateAvatar.error && (
                  <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>⚠️ {(updateAvatar.error as any).message}</p>
                )}
                <p style={{ fontSize: 10, color: "var(--t4)", marginTop: 6 }}>Clique na foto para alterar</p>
              </div>
            </div>

            {/* Wallet shortcut */}
            <button className="pp-wallet" onClick={() => router.push(`/users/${id}/wallet`)}>
              <div className="pp-wallet-left">
                <div className="pp-wallet-icon">👛</div>
                <div>
                  <div className="pp-wallet-label">Minha Carteira</div>
                  <div className="pp-wallet-value">R$ {walletBalance.toFixed(2).replace(".", ",")}</div>
                </div>
              </div>
              <span className="pp-wallet-cta">Ver carteira →</span>
            </button>
          </div>

          {/* AGENDAMENTOS RECENTES */}
          <div className="pp-card" style={{ animationDelay: "0.07s" }}>
            <div className="pp-sec-title">Agendamentos recentes</div>
            {recentAppts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>📅</div>
                <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 12 }}>Nenhum agendamento ainda.</p>
                <Link href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  Explorar prestadores →
                </Link>
              </div>
            ) : (
              <>
                {recentAppts.map(a => {
                  const sc = STATUS_LABELS[a.status] ?? { label: a.status, color: "#aaa", bg: "rgba(255,255,255,0.06)" };
                  const date = new Date(a.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                  const time = new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <Link key={a.id} href={`/appointments/${a.id}`} className="pp-appt">
                      <div className="pp-appt-top">
                        <div>
                          <p className="pp-appt-service">{a.service}</p>
                          <p className="pp-appt-provider">com {a.provider}</p>
                        </div>
                        <span className="pp-appt-badge" style={{ color: sc.color, background: sc.bg, borderColor: `${sc.color}33` }}>
                          {sc.label}
                        </span>
                      </div>
                      <div className="pp-appt-footer">
                        <span className="pp-appt-date">📅 {date} · {time}</span>
                        <span className="pp-appt-price">R$ {(a.amount / 100).toFixed(2)}</span>
                      </div>
                    </Link>
                  );
                })}
                <Link href="/appointments" style={{ fontSize: 12, color: "#fd5b01", textDecoration: "none", display: "block", textAlign: "center", marginTop: 8, fontWeight: 600 }}>
                  Ver todos os agendamentos →
                </Link>
              </>
            )}
          </div>

          {/* CONFIGURAÇÕES */}
          <div className="pp-card" style={{ animationDelay: "0.12s" }}>
            <div className="pp-sec-title">Configurações</div>

            <button className="pp-cfg-btn" onClick={() => fileInputRef.current?.click()}>
              <div className="pp-cfg-btn-icon">📷</div>
              Alterar foto de perfil
            </button>

            <button className="pp-cfg-btn" onClick={async () => {
              setPwResetMsg(null);
              const email = auth.currentUser?.email;
              if (!email) return;
              try {
                await sendPasswordResetEmail(auth, email);
                setPwResetMsg({ type: "success", text: "Link enviado! Verifique seu e-mail." });
              } catch {
                setPwResetMsg({ type: "error", text: "Não foi possível enviar o e-mail. Tente novamente." });
              }
            }}>
              <div className="pp-cfg-btn-icon">🔒</div>
              Redefinir senha
            </button>
            {pwResetMsg && (
              <p style={{ fontSize: 12, marginBottom: 6, paddingLeft: 4,
                color: pwResetMsg.type === "success" ? "#4ade80" : "#f87171" }}>
                {pwResetMsg.text}
              </p>
            )}

            <Link href="/notifications" style={{ textDecoration: "none" }}>
              <button className="pp-cfg-btn">
                <div className="pp-cfg-btn-icon">🔔</div>
                Minhas notificações
              </button>
            </Link>

            <button className="pp-cfg-btn" onClick={async () => { await logout(); window.location.href = "/login"; }} style={{ color: "#f87171" }}>
              <div className="pp-cfg-btn-icon" style={{ background: "rgba(248,113,113,0.12)" }}>🚪</div>
              Sair da conta
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
