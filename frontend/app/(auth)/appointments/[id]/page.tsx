"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAppointment, useCancelAppointment, useApproveAppointment } from "@/hooks/useAppointments";
import type { AppointmentStatus } from "@/services/appointments.service";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT:              { label: "Aguardando pagamento", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  PENDING:                      { label: "Pendente",            color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  PAID:                         { label: "Pago",                color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CONFIRMED:                    { label: "Confirmado",          color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  IN_PROGRESS:                  { label: "Em andamento",        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Aguardando sua confirmação", color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  COMPLETED:                    { label: "Concluído",           color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:                    { label: "Cancelado",           color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REFUNDED:                     { label: "Reembolsado",         color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  DISPUTED:                     { label: "Em disputa",          color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const CANCELLABLE: AppointmentStatus[] = ["PENDING_PAYMENT", "PENDING", "PAID", "CONFIRMED"];
const APPROVABLE: AppointmentStatus[]  = ["AWAITING_CLIENT_CONFIRMATION"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: appt, isLoading, isError } = useAppointment(id);
  const cancel  = useCancelAppointment();
  const approve = useApproveAppointment();

  if (isLoading) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes ad-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fd5b01", animation: "ad-spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (isError || !appt) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Sora', sans-serif" }}>
        <p style={{ color: "#f87171", fontSize: 16 }}>Agendamento não encontrado.</p>
        <Link href="/appointments" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>← Meus agendamentos</Link>
      </div>
    );
  }

  const statusCfg     = STATUS_CONFIG[appt.status] ?? { label: appt.status, color: "#aaa", bg: "rgba(255,255,255,0.08)" };
  const providerName  = appt.provider?.user?.name ?? "Prestador";
  const avatarUrl     = appt.provider?.user?.avatarUrl ?? null;
  const canCancel     = CANCELLABLE.includes(appt.status);
  const canApprove    = APPROVABLE.includes(appt.status);
  const showMeeting   = !!appt.meetingUrl && !["PENDING_PAYMENT", "CANCELLED", "REFUNDED", "DISPUTED"].includes(appt.status);

  const scheduledDate = new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const scheduledTime = new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });

  function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    cancel.mutate(appt.id);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .ad * { font-family:'Sora',sans-serif; box-sizing:border-box; }
        .ad-page { background:#0d0d0d; min-height:100vh; padding:5rem 1.5rem 2rem; }
        .ad-inner { max-width:600px; margin:0 auto; }
        .ad-back { display:inline-flex; align-items:center; gap:6px; color:#555; font-size:13px; text-decoration:none; margin-bottom:1.5rem; transition:color 0.2s; }
        .ad-back:hover { color:#fd5b01; }
        .ad-card {
          background:#1a1a1a;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:18px; padding:1.75rem;
          margin-bottom:1rem;
        }
        .ad-section-label {
          font-size:11px; font-weight:700; color:#555;
          text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;
          display:flex; align-items:center; gap:8px;
        }
        .ad-section-label::before { content:''; width:3px; height:12px; background:#fd5b01; border-radius:2px; }
        .ad-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .ad-row:last-child { border-bottom:none; padding-bottom:0; }
        .ad-row-label { font-size:12px; color:#666; }
        .ad-row-value { font-size:13px; color:#e0e0e0; font-weight:500; text-align:right; max-width:60%; }
        .ad-price     { font-size:20px; font-weight:800; color:#fd5b01; }
        .ad-cancel-btn {
          width:100%; padding:13px; background:rgba(248,113,113,0.08);
          border:1px solid rgba(248,113,113,0.25);
          border-radius:10px; color:#f87171;
          font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
          cursor:pointer; transition:background 0.2s, border-color 0.2s;
        }
        .ad-cancel-btn:hover:not(:disabled) { background:rgba(248,113,113,0.15); border-color:rgba(248,113,113,0.4); }
        .ad-cancel-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .ad-cancel-err { font-size:12px; color:#f87171; text-align:center; margin-top:8px; }
      `}</style>

      <div className="ad ad-page">
        <div className="ad-inner">
          <Link href="/appointments" className="ad-back">← Meus agendamentos</Link>

          {/* PRESTADOR */}
          <div className="ad-card">
            <div className="ad-section-label">Prestador</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0, border: "2px solid rgba(253,91,1,0.4)", background: "#111" }}>
                {avatarUrl
                  ? <Image src={avatarUrl} fill alt={providerName} style={{ objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#fd5b01,#ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>
                      {providerName[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{providerName}</p>
                <Link
                  href={`/providers/${appt.provider?.id}`}
                  style={{ fontSize: 12, color: "#fd5b01", textDecoration: "none" }}
                >
                  Ver perfil →
                </Link>
              </div>
            </div>
          </div>

          {/* DETALHES */}
          <div className="ad-card">
            <div className="ad-section-label">Detalhes do agendamento</div>

            <div className="ad-row">
              <span className="ad-row-label">Serviço</span>
              <span className="ad-row-value">{appt.service?.title ?? "—"}</span>
            </div>

            <div className="ad-row">
              <span className="ad-row-label">Data</span>
              <span className="ad-row-value" style={{ textTransform: "capitalize" }}>{scheduledDate}</span>
            </div>

            <div className="ad-row">
              <span className="ad-row-label">Horário</span>
              <span className="ad-row-value">{scheduledTime}</span>
            </div>

            <div className="ad-row">
              <span className="ad-row-label">Status</span>
              <span style={{
                display: "inline-block",
                background: statusCfg.bg,
                color: statusCfg.color,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 100,
                border: `1px solid ${statusCfg.color}33`,
              }}>
                {statusCfg.label}
              </span>
            </div>

            <div className="ad-row">
              <span className="ad-row-label">Valor</span>
              <span className="ad-price">R$ {(appt.amount / 100).toFixed(2)}</span>
            </div>

            {appt.service?.duration && (
              <div className="ad-row">
                <span className="ad-row-label">Duração</span>
                <span className="ad-row-value">{appt.service.duration} min</span>
              </div>
            )}
          </div>

          {/* LINK DA REUNIÃO */}
          {showMeeting && (
            <div className="ad-card">
              <div className="ad-section-label">Reunião</div>
              <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14, lineHeight: 1.6 }}>
                Este link será utilizado para realização do atendimento online.
              </p>
              <a
                href={appt.meetingUrl!}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: 13,
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 10, color: "#4ade80",
                  fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700,
                  textDecoration: "none", transition: "opacity 0.2s",
                }}
              >
                🎥 Entrar na Reunião
              </a>
              <p style={{ fontSize: 10, color: "#444", textAlign: "center", marginTop: 8, fontFamily: "'Sora',sans-serif", wordBreak: "break-all" }}>
                {appt.meetingUrl}
              </p>
            </div>
          )}

          {/* PAGAR (PENDING_PAYMENT) */}
          {appt.status === "PENDING_PAYMENT" && (
            <div className="ad-card">
              <div className="ad-section-label">Pagamento</div>
              <p style={{ fontSize: 13, color: "#aaa", marginBottom: 16, lineHeight: 1.6 }}>
                Este agendamento aguarda confirmação do pagamento. Finalize o pagamento para garantir sua reserva.
              </p>
              <Link
                href={`/checkout/${appt.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: 14,
                  background: "#fd5b01", color: "#fff", textDecoration: "none",
                  borderRadius: 10,
                  fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700,
                  boxShadow: "0 4px 20px rgba(253,91,1,0.4)",
                  transition: "background 0.2s",
                }}
              >
                🔒 Pagar agora · R$ {(appt.amount / 100).toFixed(2)}
              </Link>
            </div>
          )}

          {/* AÇÕES */}
          {(canApprove || canCancel) && (
            <div className="ad-card">
              <div className="ad-section-label">Ações</div>

              {/* Aprovar execução (cliente confirma que o serviço foi realizado) */}
              {canApprove && (
                <>
                  <p style={{ fontSize: 12, color: "#aaa", marginBottom: 10, lineHeight: 1.5 }}>
                    O prestador finalizou o atendimento. Confirme se o serviço foi realizado para liberar o pagamento.
                  </p>
                  <button
                    style={{
                      width: "100%", padding: 13, marginBottom: 10,
                      background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                      borderRadius: 10, color: "#4ade80",
                      fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700,
                      cursor: approve.isPending ? "not-allowed" : "pointer",
                      opacity: approve.isPending ? 0.5 : 1,
                      transition: "opacity 0.2s",
                    }}
                    onClick={() => approve.mutate(appt.id)}
                    disabled={approve.isPending}
                  >
                    {approve.isPending ? "Aprovando..." : "✅ Aprovar Execução"}
                  </button>
                  {approve.error && (
                    <p className="ad-cancel-err">⚠️ {approve.error.message}</p>
                  )}
                  {approve.isSuccess && (
                    <p style={{ fontSize: 12, color: "#4ade80", textAlign: "center", marginBottom: 10 }}>
                      Execução aprovada. Pagamento liberado ao prestador.
                    </p>
                  )}
                </>
              )}

              {/* Cancelar */}
              {canCancel && (
                <>
                  <button
                    className="ad-cancel-btn"
                    onClick={handleCancel}
                    disabled={cancel.isPending}
                  >
                    {cancel.isPending ? "Cancelando..." : "Cancelar agendamento"}
                  </button>
                  {cancel.error && (
                    <p className="ad-cancel-err">⚠️ {cancel.error.message}</p>
                  )}
                  {cancel.isSuccess && (
                    <p style={{ fontSize: 12, color: "#4ade80", textAlign: "center", marginTop: 8 }}>
                      Agendamento cancelado.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
