"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMyProviderDirect } from "@/hooks/useProviders";
import { useAppointment, useCancelAppointment, useApproveAppointment } from "@/hooks/useAppointments";
import type { AppointmentStatus } from "@/services/appointments.service";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING_PAYMENT:              { label: "Aguardando pagamento",              color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
  EXPIRED:                      { label: "Agendamento expirado",              color: "#6b7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.20)" },
  PENDING:                      { label: "Pendente",                          color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)"  },
  PAID:                         { label: "Aguardando confirmação",            color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  CONFIRMED:                    { label: "Reunião confirmada",                color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  IN_PROGRESS:                  { label: "Atendimento em andamento",          color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Aguardando sua aprovação",          color: "#fd5b01", bg: "rgba(253,91,1,0.10)",  border: "rgba(253,91,1,0.25)"  },
  COMPLETED:                    { label: "Atendimento concluído",             color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  CANCELLED:                    { label: "Cancelado",                         color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.22)" },
  REFUNDED:                     { label: "Reembolsado",                       color: "#9ca3af", bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.20)" },
  DISPUTED:                     { label: "Em disputa",                        color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.22)" },
};

function useMeetingCountdown(scheduledAt: string, durationMin = 60) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!scheduledAt) return;
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  if (!scheduledAt) return { state: "ended" as const };
  const start  = new Date(scheduledAt).getTime();
  const end    = start + durationMin * 60 * 1000;
  const openAt = start - 15 * 60 * 1000;
  if (now >= openAt && now <= end + 2 * 60 * 60 * 1000) return { state: "active" as const };
  if (now < openAt) {
    const diffMs = openAt - now;
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    return { state: "soon" as const, label: h > 0 ? `${h}h ${m}min` : `${m} min` };
  }
  return { state: "ended" as const };
}

const CANCELLABLE: AppointmentStatus[] = ["PENDING_PAYMENT", "PENDING", "PAID", "CONFIRMED"];
const APPROVABLE:  AppointmentStatus[] = ["AWAITING_CLIENT_CONFIRMATION"];

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { dbUser } = useAuth();
  const { data: myProvider } = useMyProviderDirect();
  const { data: appt, isLoading, isError } = useAppointment(id);
  const cancel  = useCancelAppointment();
  const approve = useApproveAppointment();

  const isProvider            = dbUser?.role === "PROVIDER";
  const isAppointmentProvider = isProvider && !!myProvider?.id && appt?.provider?.id === myProvider.id;

  // Must be called before any early returns — Rules of Hooks
  const meetingCountdown = useMeetingCountdown(appt?.scheduledAt ?? "", appt?.service?.duration ?? 60);

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="tp-spinner tp-spinner-lg" />
      </div>
    );
  }

  if (isError || !appt) {
    const backHref  = isProvider && dbUser ? `/colaborador/${dbUser.id}/perfil` : "/appointments";
    const backLabel = isProvider ? "← Meu dashboard" : "← Meus agendamentos";
    return (
      <div className="page-loader">
        <span style={{ fontSize: 40 }}>😕</span>
        <p style={{ color: "#f87171", fontSize: 15, fontFamily: "var(--font)" }}>Agendamento não encontrado.</p>
        <Link href={backHref} style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14, fontFamily: "var(--font)" }}>{backLabel}</Link>
      </div>
    );
  }

  const statusCfg    = STATUS_CONFIG[appt.status] ?? { label: appt.status, color: "#aaa", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.12)" };
  const providerName = appt.provider?.user?.name ?? "Prestador";
  const avatarUrl    = appt.provider?.user?.avatarUrl ?? null;
  const canCancel    = CANCELLABLE.includes(appt.status);
  const canApprove   = APPROVABLE.includes(appt.status);
  const showMeetingSection = !!appt.meetingUrl && !["PENDING_PAYMENT","EXPIRED","CANCELLED","REFUNDED","DISPUTED"].includes(appt.status);

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
        .ad * { font-family: var(--font,'Sora',sans-serif); box-sizing: border-box; }
        .ad-page { background: var(--bg,#0d0d0d); min-height: 100vh; padding: 5.5rem 1.5rem 3rem; }
        .ad-inner { max-width: 620px; margin: 0 auto; }

        .ad-card {
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border,rgba(255,255,255,0.07));
          border-radius: 18px; padding: 1.5rem;
          margin-bottom: 1rem;
          animation: tp-fadeUp 0.3s ease both;
        }
        .ad-sec-label {
          font-size: 11px; font-weight: 700; color: var(--t3,#666);
          text-transform: uppercase; letter-spacing: 0.08em;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 1rem;
        }
        .ad-sec-label::before { content:''; width:3px; height:12px; background:#fd5b01; border-radius:2px; }

        .ad-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .ad-row:last-child { border-bottom:none; padding-bottom:0; }
        .ad-row-label { font-size:12px; color:var(--t3,#666); }
        .ad-row-value { font-size:13px; color:var(--t2,#aaa); font-weight:500; text-align:right; max-width:62%; }
        .ad-price { font-size:22px; font-weight:800; color:var(--brand,#fd5b01); }

        .ad-status-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700;
          padding: 4px 12px; border-radius: 100px;
          border-width: 1px; border-style: solid;
        }
        .ad-status-chip::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }

        /* Cancel / Approve buttons */
        .ad-action-btn {
          width: 100%; padding: 13px 16px;
          border-radius: 10px;
          font-family: var(--font,'Sora',sans-serif); font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.2s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          border: 1px solid;
        }
        .ad-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ad-btn-approve {
          background: rgba(74,222,128,0.1); color: #4ade80; border-color: rgba(74,222,128,0.3);
          margin-bottom: 10px;
        }
        .ad-btn-approve:hover:not(:disabled) { background: rgba(74,222,128,0.18); }
        .ad-btn-cancel {
          background: rgba(248,113,113,0.08); color: #f87171; border-color: rgba(248,113,113,0.25);
        }
        .ad-btn-cancel:hover:not(:disabled) { background: rgba(248,113,113,0.16); }

        /* Pay now */
        .ad-pay-btn {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; padding: 15px 20px;
          background: var(--brand,#fd5b01); color: #fff;
          text-decoration: none; border-radius: 12px;
          font-family: var(--font,'Sora',sans-serif); font-size: 15px; font-weight: 800;
          box-shadow: 0 6px 24px rgba(253,91,1,0.4);
          transition: background 0.2s, transform 0.15s;
        }
        .ad-pay-btn:hover { background: #e04e00; transform: translateY(-1px); }

        /* Meeting */
        .ad-meet-btn {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; padding: 14px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.3);
          border-radius: 12px; color: #4ade80;
          font-family: var(--font,'Sora',sans-serif); font-size: 14px; font-weight: 700;
          text-decoration: none; transition: background 0.2s;
        }
        .ad-meet-btn:hover { background: rgba(74,222,128,0.16); }

        /* Status message */
        .ad-msg { font-size: 13px; color: var(--t2,#aaa); line-height: 1.6; margin-bottom: 16px; }
        .ad-err { font-size: 12px; color: #f87171; text-align: center; margin-top: 8px; }
        .ad-ok  { font-size: 12px; color: #4ade80; text-align: center; margin-top: 8px; }

        @media (max-width: 480px) {
          .ad-page { padding: 5rem 1rem 2.5rem; }
        }
      `}</style>

      <div className="ad ad-page">
        <div className="ad-inner">

          <Link
            href={isAppointmentProvider ? `/colaborador/${dbUser?.id}/perfil` : "/appointments"}
            className="ds-back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {isAppointmentProvider ? "Meu dashboard" : "Meus agendamentos"}
          </Link>

          {/* STATUS HEADER */}
          <div className="ad-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 6 }}>Status do agendamento</p>
              <span className="ad-status-chip" style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}>
                {statusCfg.label}
              </span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#fd5b01", letterSpacing: "-.03em" }}>
              R$ {(appt.amount / 100).toFixed(2)}
            </p>
          </div>

          {/* PRESTADOR */}
          <div className="ad-card">
            <div className="ad-sec-label">Prestador</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="ds-av ds-av-circle ds-av-56" style={{ border: "2.5px solid rgba(253,91,1,0.4)" }}>
                {avatarUrl
                  ? <Image src={avatarUrl} fill alt={providerName} style={{ objectFit: "cover" }} />
                  : providerName[0]?.toUpperCase()
                }
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{providerName}</p>
                <Link href={`/providers/${appt.provider?.id}`} style={{ fontSize: 12, color: "#fd5b01", textDecoration: "none" }}>
                  Ver perfil público →
                </Link>
              </div>
            </div>
          </div>

          {/* DETALHES */}
          <div className="ad-card">
            <div className="ad-sec-label">Detalhes</div>

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
            {appt.service?.duration && (
              <div className="ad-row">
                <span className="ad-row-label">Duração</span>
                <span className="ad-row-value">{appt.service.duration} min</span>
              </div>
            )}
          </div>

          {/* REUNIÃO */}
          {showMeetingSection && (
            <div className="ad-card" style={{ animationDelay: "0.1s" }}>
              <div className="ad-sec-label">Reunião online</div>
              {meetingCountdown.state === "active" && (
                <>
                  <div className="ds-alert ds-alert-success" style={{ marginBottom: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    A reunião está disponível agora! Clique para entrar.
                  </div>
                  <a href={appt.meetingUrl!} target="_blank" rel="noopener noreferrer" className="ad-meet-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                    Entrar na Reunião
                  </a>
                </>
              )}
              {meetingCountdown.state === "soon" && (
                <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>⏰</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                    Disponível em {meetingCountdown.label}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--t3)" }}>
                    O botão de acesso aparece 15 minutos antes do horário.
                  </p>
                </div>
              )}
              {meetingCountdown.state === "ended" && (
                <p style={{ fontSize: 13, color: "var(--t3)", textAlign: "center", padding: "0.5rem 0" }}>
                  A janela de acesso à reunião foi encerrada.
                </p>
              )}
            </div>
          )}

          {/* PAGAR — cliente */}
          {appt.status === "PENDING_PAYMENT" && !isAppointmentProvider && (
            <div className="ad-card" style={{ animationDelay: "0.1s" }}>
              <div className="ad-sec-label">Pagamento pendente</div>
              <p className="ad-msg">
                Este agendamento aguarda o pagamento. Complete o pagamento para garantir sua reserva.
              </p>
              <Link href={`/checkout/${appt.id}`} className="ad-pay-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Pagar agora · R$ {(appt.amount / 100).toFixed(2)}
              </Link>
            </div>
          )}

          {/* INFO — prestador */}
          {appt.status === "PENDING_PAYMENT" && isAppointmentProvider && (
            <div className="ad-card" style={{ animationDelay: "0.1s" }}>
              <div className="ad-sec-label">Aguardando pagamento</div>
              <div className="ds-alert ds-alert-warn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                O cliente ainda não realizou o pagamento. O agendamento será cancelado automaticamente se o prazo expirar.
              </div>
            </div>
          )}

          {/* AÇÕES */}
          {(canApprove || canCancel) && (
            <div className="ad-card" style={{ animationDelay: "0.15s" }}>
              <div className="ad-sec-label">Ações</div>

              {canApprove && (
                <>
                  <p className="ad-msg">
                    O prestador finalizou o atendimento. Confirme se o serviço foi realizado para liberar o pagamento.
                  </p>
                  <button
                    className="ad-action-btn ad-btn-approve"
                    onClick={() => approve.mutate(appt.id)}
                    disabled={approve.isPending}
                  >
                    {approve.isPending ? (
                      <><div className="tp-spinner tp-spinner-sm" /> Aprovando...</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Aprovar execução do serviço
                      </>
                    )}
                  </button>
                  {approve.error   && <p className="ad-err">⚠️ {approve.error.message}</p>}
                  {approve.isSuccess && <p className="ad-ok">✓ Execução aprovada. Pagamento liberado.</p>}
                </>
              )}

              {canCancel && (
                <>
                  <button
                    className="ad-action-btn ad-btn-cancel"
                    onClick={handleCancel}
                    disabled={cancel.isPending}
                  >
                    {cancel.isPending ? (
                      <><div className="tp-spinner tp-spinner-sm" /> Cancelando...</>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Cancelar agendamento
                      </>
                    )}
                  </button>
                  {cancel.error   && <p className="ad-err">⚠️ {cancel.error.message}</p>}
                  {cancel.isSuccess && <p className="ad-ok">Agendamento cancelado.</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
