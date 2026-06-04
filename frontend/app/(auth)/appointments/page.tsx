"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useAppointmentsByUser } from "@/hooks/useAppointments";
import type { AppointmentStatus } from "@/services/appointments.service";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT:              { label: "Aguardando pagamento", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  PENDING:                      { label: "Pendente",            color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  PAID:                         { label: "Pago",                color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CONFIRMED:                    { label: "Confirmado",          color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  IN_PROGRESS:                  { label: "Em andamento",        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Ag. confirmação",    color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  COMPLETED:                    { label: "Concluído",           color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:                    { label: "Cancelado",           color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REFUNDED:                     { label: "Reembolsado",         color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  DISPUTED:                     { label: "Em disputa",          color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#aaa", bg: "rgba(255,255,255,0.08)" };
  return (
    <span style={{
      display: "inline-block",
      background: cfg.bg,
      color: cfg.color,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 100,
      border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { data: appointments, isLoading, isError } = useAppointmentsByUser(dbUser?.id ?? "");

  if (authLoading || isLoading) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes ap-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fd5b01", animation: "ap-spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Sora', sans-serif" }}>
        <p style={{ color: "#aaa", fontSize: 16 }}>Faça login para ver seus agendamentos.</p>
        <Link href="/login" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>Entrar →</Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Sora', sans-serif" }}>
        <p style={{ color: "#f87171", fontSize: 16 }}>Erro ao carregar agendamentos.</p>
        <Link href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>← Voltar para Home</Link>
      </div>
    );
  }

  const list = appointments ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .ap * { font-family:'Sora',sans-serif; box-sizing:border-box; }
        .ap-page { background:#0d0d0d; min-height:100vh; padding:5rem 1.5rem 2rem; }
        .ap-inner { max-width:720px; margin:0 auto; }
        .ap-title { font-size:24px; font-weight:800; color:#fff; letter-spacing:-0.03em; margin-bottom:6px; }
        .ap-sub   { font-size:13px; color:#555; margin-bottom:2rem; }
        .ap-empty { text-align:center; padding:4rem 0; color:#555; }
        .ap-empty p { font-size:15px; margin-bottom:12px; }
        .ap-item {
          display:block; text-decoration:none;
          background:#1a1a1a;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:14px; padding:1.25rem;
          margin-bottom:12px;
          transition:border-color 0.2s, background 0.2s;
        }
        .ap-item:hover {
          border-color:rgba(253,91,1,0.3);
          background:rgba(253,91,1,0.04);
        }
        .ap-item-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .ap-avatar { width:42px; height:42px; border-radius:50%; overflow:hidden; position:relative; flex-shrink:0; border:2px solid rgba(253,91,1,0.3); background:#111; }
        .ap-provider-name { font-size:15px; font-weight:700; color:#f0f0f0; }
        .ap-service-name  { font-size:12px; color:#666; margin-top:2px; }
        .ap-item-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .ap-date  { font-size:12px; color:#777; }
        .ap-price { font-size:13px; font-weight:700; color:#fd5b01; }
        .ap-arrow { color:#555; font-size:16px; }
      `}</style>

      <div className="ap ap-page">
        <div className="ap-inner">
          <h1 className="ap-title">Meus Agendamentos</h1>
          <p className="ap-sub">{list.length} agendamento{list.length !== 1 ? "s" : ""} encontrado{list.length !== 1 ? "s" : ""}</p>

          {list.length === 0 ? (
            <div className="ap-empty">
              <p>Você ainda não tem agendamentos.</p>
              <Link href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>
                Explorar prestadores →
              </Link>
            </div>
          ) : (
            list.map(appt => {
              const providerName = appt.provider?.user?.name ?? "Prestador";
              const avatarUrl    = appt.provider?.user?.avatarUrl ?? null;
              const date = new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              });

              return (
                <Link key={appt.id} href={`/appointments/${appt.id}`} className="ap-item">
                  <div className="ap-item-header">
                    <div className="ap-avatar">
                      {avatarUrl
                        ? <Image src={avatarUrl} fill alt={providerName} style={{ objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#fd5b01,#ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>
                            {providerName[0]?.toUpperCase()}
                          </div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="ap-provider-name">{providerName}</p>
                      <p className="ap-service-name">{appt.service?.title ?? "Serviço"}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                  <div className="ap-item-footer">
                    <span className="ap-date">📅 {date}</span>
                    <span className="ap-price">R$ {(appt.amount / 100).toFixed(2)}</span>
                    <span className="ap-arrow">›</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
