"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useAppointmentsByUser } from "@/hooks/useAppointments";
import type { Appointment, AppointmentStatus } from "@/services/appointments.service";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING_PAYMENT:              { label: "Aguardando pagamento",     color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
  EXPIRED:                      { label: "Expirado",                 color: "#6b7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.20)" },
  PENDING:                      { label: "Pendente",                 color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)" },
  PAID:                         { label: "Aguardando confirmação",   color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  CONFIRMED:                    { label: "Reunião confirmada",        color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  IN_PROGRESS:                  { label: "Em andamento",             color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Aguardando sua aprovação", color: "#fd5b01", bg: "rgba(253,91,1,0.10)", border: "rgba(253,91,1,0.25)" },
  COMPLETED:                    { label: "Concluído",                color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)" },
  CANCELLED:                    { label: "Cancelado",                color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.22)" },
  REFUNDED:                     { label: "Reembolsado",              color: "#9ca3af", bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.20)" },
  DISPUTED:                     { label: "Em disputa",               color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.22)" },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#aaa", bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.12)" };
  return (
    <span className="ap-badge" style={{
      color: cfg.color,
      background: cfg.bg,
      borderColor: cfg.border,
    }}>
      {cfg.label}
    </span>
  );
}

function getMeetingStatus(appt: Appointment): "soon" | "active" | "hidden" {
  if (!appt.meetingUrl) return "hidden";
  if (["PENDING_PAYMENT","EXPIRED","CANCELLED","REFUNDED","DISPUTED"].includes(appt.status)) return "hidden";
  const now = Date.now();
  const start = new Date(appt.scheduledAt).getTime();
  const duration = (appt.service?.duration ?? 60) * 60 * 1000;
  const end = start + duration;
  const fifteenMin = 15 * 60 * 1000;
  if (now >= start - fifteenMin && now <= end + 2 * 60 * 60 * 1000) return "active";
  if (now < start - fifteenMin) return "soon";
  return "hidden";
}

// ── Appointment Card ───────────────────────────────────────────────────────────

function AppointmentCard({ appt, index }: { appt: Appointment; index: number }) {
  const providerName  = appt.provider?.user?.name ?? "Prestador";
  const avatarUrl     = appt.provider?.user?.avatarUrl ?? null;
  const meetingStatus = getMeetingStatus(appt);

  const dateStr = new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const timeStr = new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <Link
      href={`/appointments/${appt.id}`}
      className="ap-card anim-fadeUp"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="ap-card-main">
        {/* Avatar */}
        <div className="ap-avatar">
          {avatarUrl
            ? <Image src={avatarUrl} fill alt={providerName} style={{ objectFit: "cover" }} />
            : <span style={{ fontSize: 16, fontWeight: 700 }}>{providerName[0]?.toUpperCase()}</span>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <div style={{ minWidth: 0 }}>
              <p className="ap-provider">{providerName}</p>
              <p className="ap-service">{appt.service?.title ?? "Serviço"}</p>
            </div>
            <StatusBadge status={appt.status} />
          </div>

          <div className="ap-footer">
            <span className="ap-datetime">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {dateStr} · {timeStr}
            </span>
            <span className="ap-price">R$ {(appt.amount / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action hints */}
      {appt.status === "PENDING_PAYMENT" && (
        <div className="ap-hint ap-hint--warn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Clique para completar o pagamento
        </div>
      )}
      {appt.status === "AWAITING_CLIENT_CONFIRMATION" && (
        <div className="ap-hint ap-hint--brand">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Clique para aprovar o atendimento
        </div>
      )}
      {meetingStatus === "active" && (
        <div className="ap-hint ap-hint--green">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          Reunião disponível agora!
        </div>
      )}
      {meetingStatus === "soon" && (
        <div className="ap-hint ap-hint--purple">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Reunião disponível em breve
        </div>
      )}
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function AppointmentsSkeleton() {
  return (
    <div className="ap ap-page">
      <div className="ap-inner">
        <div className="sk sk-h28" style={{ width: 210, marginBottom: 8, borderRadius: 6 }} />
        <div className="sk sk-h13" style={{ width: 150, marginBottom: "2.5rem", borderRadius: 6 }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="sk sk-r-lg" style={{ height: 90, marginBottom: 10 }} />
        ))}
      </div>
    </div>
  );
}

// ── Sections ───────────────────────────────────────────────────────────────────

const SECTIONS: { title: string; statuses: AppointmentStatus[]; emptyMsg: string }[] = [
  { title: "Aguardando pagamento",   statuses: ["PENDING_PAYMENT"],                                            emptyMsg: "" },
  { title: "Próximos atendimentos",  statuses: ["PAID", "CONFIRMED"],                                          emptyMsg: "Nenhum atendimento agendado." },
  { title: "Em andamento",           statuses: ["IN_PROGRESS"],                                                emptyMsg: "" },
  { title: "Aguardando sua aprovação", statuses: ["AWAITING_CLIENT_CONFIRMATION"],                             emptyMsg: "" },
  { title: "Concluídos",             statuses: ["COMPLETED"],                                                  emptyMsg: "Nenhum atendimento concluído ainda." },
  { title: "Cancelados / Expirados", statuses: ["CANCELLED", "EXPIRED", "REFUNDED", "DISPUTED"],              emptyMsg: "" },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: appointments, isLoading, isError } = useAppointmentsByUser(dbUser?.id ?? "");

  useEffect(() => {
    if (!authLoading && dbUser?.role === "PROVIDER") {
      router.replace(`/colaborador/${dbUser.id}/perfil`);
    }
  }, [authLoading, dbUser, router]);

  if (authLoading || isLoading) return <AppointmentsSkeleton />;

  if (!dbUser) {
    return (
      <div className="page-loader">
        <p style={{ color: "#aaa", fontSize: 15, fontFamily: "var(--font)" }}>Faça login para ver seus agendamentos.</p>
        <Link href="/login" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14, fontFamily: "var(--font)" }}>Entrar →</Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-loader">
        <span style={{ fontSize: 40 }}>😕</span>
        <p style={{ color: "#f87171", fontSize: 15, fontFamily: "var(--font)" }}>Erro ao carregar agendamentos.</p>
        <Link href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14, fontFamily: "var(--font)" }}>← Voltar para Home</Link>
      </div>
    );
  }

  const list     = appointments ?? [];
  const byStatus = (statuses: AppointmentStatus[]) => list.filter(a => statuses.includes(a.status));
  const hasAny   = SECTIONS.some(s => byStatus(s.statuses).length > 0);

  return (
    <>
      <style>{`
        .ap * { font-family: var(--font, 'Sora', sans-serif); box-sizing: border-box; }
        .ap-page {
          background: var(--bg, #0d0d0d);
          min-height: 100vh;
          padding: 5.5rem 1.5rem 4rem;
        }
        .ap-inner { max-width: 720px; margin: 0 auto; }

        /* ── SECTION ── */
        .ap-section { margin-bottom: 2.25rem; }
        .ap-section-title {
          font-size: 11px; font-weight: 700; color: var(--t3, #666);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .ap-section-title::before {
          content: ''; width: 3px; height: 12px;
          background: var(--brand, #fd5b01); border-radius: 2px;
        }
        .ap-section-count {
          background: rgba(255,255,255,0.08);
          color: var(--t2, #aaa);
          font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        /* ── CARD ── */
        .ap-card {
          display: block; text-decoration: none;
          background: var(--surface, #1a1a1a);
          border: 1px solid var(--border, rgba(255,255,255,0.07));
          border-radius: 16px;
          padding: 1rem 1.25rem;
          margin-bottom: 10px;
          transition: border-color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .ap-card:hover {
          border-color: rgba(253,91,1,0.25);
          background: rgba(253,91,1,0.025);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        }
        .ap-card-main {
          display: flex; align-items: flex-start; gap: 13px;
        }

        /* Avatar */
        .ap-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          overflow: hidden; position: relative; flex-shrink: 0;
          border: 2px solid rgba(253,91,1,0.30);
          background: linear-gradient(135deg, #fd5b01, #ff8c42);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }

        /* Text */
        .ap-provider { font-size: 14px; font-weight: 700; color: #f0f0f0; margin: 0 0 3px; }
        .ap-service  { font-size: 12px; color: var(--t3, #666); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

        /* Footer */
        .ap-footer  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .ap-datetime { font-size: 11.5px; color: var(--t3, #666); display: flex; align-items: center; gap: 5px; }
        .ap-price    { font-size: 13px; font-weight: 800; color: var(--brand, #fd5b01); }

        /* Badge */
        .ap-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 700;
          padding: 3px 10px; border-radius: 100px;
          white-space: nowrap; border-width: 1px; border-style: solid;
          flex-shrink: 0;
        }
        .ap-badge::before {
          content: ''; width: 4px; height: 4px;
          border-radius: 50%; background: currentColor; flex-shrink: 0;
        }

        /* Action hints */
        .ap-hint {
          display: flex; align-items: center; gap: 7px;
          font-size: 11.5px; font-weight: 600;
          margin-top: 10px; padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .ap-hint--warn   { color: var(--yellow, #f59e0b); }
        .ap-hint--brand  { color: var(--brand, #fd5b01); }
        .ap-hint--green  { color: var(--green, #4ade80); }
        .ap-hint--purple { color: var(--purple, #a78bfa); }

        /* Empty global */
        .ap-empty-global {
          text-align: center; padding: 5rem 1rem;
          animation: tp-fadeUp 0.4s ease both;
        }
        .ap-empty-icon  { font-size: 56px; margin-bottom: 16px; opacity: 0.5; }
        .ap-empty-title { font-size: 17px; font-weight: 700; color: var(--t2, #aaa); margin-bottom: 8px; }
        .ap-empty-desc  { font-size: 13px; color: var(--t3, #666); line-height: 1.6; margin-bottom: 20px; }

        @media (max-width: 480px) {
          .ap-page { padding: 5rem 1rem 3rem; }
          .ap-service { max-width: 140px; }
        }
      `}</style>

      <div className="ap ap-page">
        <div className="ap-inner">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", margin: "0 0 4px" }}>
            Meus Agendamentos
          </h1>
          <p style={{ fontSize: 13, color: "var(--t3)", margin: "0 0 2.5rem" }}>
            {list.length} agendamento{list.length !== 1 ? "s" : ""} encontrado{list.length !== 1 ? "s" : ""}
          </p>

          {!hasAny ? (
            <div className="ap-empty-global">
              <div className="ap-empty-icon">📅</div>
              <p className="ap-empty-title">Nenhum agendamento ainda</p>
              <p className="ap-empty-desc">
                Explore os prestadores disponíveis e agende sua<br />primeira sessão.
              </p>
              <Link href="/home" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fd5b01", color: "#fff", textDecoration: "none",
                padding: "11px 22px", borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 20px rgba(253,91,1,0.35)",
              }}>
                Explorar prestadores →
              </Link>
            </div>
          ) : (
            SECTIONS.map(section => {
              const items = byStatus(section.statuses);
              if (items.length === 0 && !section.emptyMsg) return null;
              return (
                <div key={section.title} className="ap-section">
                  <div className="ap-section-title">
                    {section.title}
                    {items.length > 0 && (
                      <span className="ap-section-count">{items.length}</span>
                    )}
                  </div>
                  {items.length === 0
                    ? <p style={{ fontSize: 13, color: "var(--t4)", padding: "0.5rem 0" }}>{section.emptyMsg}</p>
                    : items.map((appt, idx) => <AppointmentCard key={appt.id} appt={appt} index={idx} />)
                  }
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
