"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useAppointmentsByUser } from "@/hooks/useAppointments";
import type { Appointment, AppointmentStatus } from "@/services/appointments.service";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT:              { label: "Aguardando pagamento",              color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  EXPIRED:                      { label: "Agendamento expirado",              color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  PENDING:                      { label: "Pendente",                          color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  PAID:                         { label: "Aguardando confirmação",            color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CONFIRMED:                    { label: "Reunião confirmada",                color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  IN_PROGRESS:                  { label: "Atendimento em andamento",          color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Aguardando sua aprovação",          color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  COMPLETED:                    { label: "Atendimento concluído",             color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:                    { label: "Cancelado",                         color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REFUNDED:                     { label: "Reembolsado",                       color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  DISPUTED:                     { label: "Em disputa",                        color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#aaa", bg: "rgba(255,255,255,0.08)" };
  return (
    <span style={{ display:"inline-block", background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:100, border:`1px solid ${cfg.color}33`, whiteSpace:"nowrap" }}>
      {cfg.label}
    </span>
  );
}

// Verifica se o link da reunião deve aparecer (15min antes até 2h após o fim)
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

function AppointmentCard({ appt }: { appt: Appointment }) {
  const providerName = appt.provider?.user?.name ?? "Prestador";
  const avatarUrl    = appt.provider?.user?.avatarUrl ?? null;
  const meetingStatus = getMeetingStatus(appt);

  const dateStr = new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const timeStr = new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <Link href={`/appointments/${appt.id}`} className="ap-card">
      <div className="ap-card-top">
        <div className="ap-avatar">
          {avatarUrl
            ? <Image src={avatarUrl} fill alt={providerName} style={{ objectFit:"cover" }} />
            : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#fd5b01,#ff8c42)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:700 }}>
                {providerName[0]?.toUpperCase()}
              </div>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p className="ap-provider">{providerName}</p>
          <p className="ap-service">{appt.service?.title ?? "Serviço"}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="ap-card-bottom">
        <span className="ap-datetime">📅 {dateStr} · {timeStr}</span>
        <span className="ap-price">R$ {(appt.amount / 100).toFixed(2)}</span>
      </div>

      {appt.status === "PENDING_PAYMENT" && (
        <div className="ap-action-hint">💳 Clique para completar o pagamento</div>
      )}
      {appt.status === "AWAITING_CLIENT_CONFIRMATION" && (
        <div className="ap-action-hint" style={{ color:"#fd5b01" }}>✅ Clique para aprovar o atendimento</div>
      )}
      {meetingStatus === "active" && (
        <div className="ap-action-hint" style={{ color:"#4ade80" }}>🎥 Reunião disponível agora!</div>
      )}
      {meetingStatus === "soon" && (
        <div className="ap-action-hint" style={{ color:"#a78bfa" }}>⏰ Reunião disponível em breve</div>
      )}
    </Link>
  );
}

const SECTIONS: { title: string; statuses: AppointmentStatus[]; emptyMsg: string }[] = [
  {
    title: "Aguardando pagamento",
    statuses: ["PENDING_PAYMENT"],
    emptyMsg: "",
  },
  {
    title: "Próximos atendimentos",
    statuses: ["PAID", "CONFIRMED"],
    emptyMsg: "Nenhum atendimento agendado.",
  },
  {
    title: "Em andamento",
    statuses: ["IN_PROGRESS"],
    emptyMsg: "",
  },
  {
    title: "Aguardando sua aprovação",
    statuses: ["AWAITING_CLIENT_CONFIRMATION"],
    emptyMsg: "",
  },
  {
    title: "Concluídos",
    statuses: ["COMPLETED"],
    emptyMsg: "Nenhum atendimento concluído ainda.",
  },
  {
    title: "Cancelados / Expirados",
    statuses: ["CANCELLED", "EXPIRED", "REFUNDED", "DISPUTED"],
    emptyMsg: "",
  },
];

export default function AppointmentsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { data: appointments, isLoading, isError } = useAppointmentsByUser(dbUser?.id ?? "");

  if (authLoading || isLoading) {
    return (
      <div style={{ background:"#0d0d0d", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes ap-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #333", borderTopColor:"#fd5b01", animation:"ap-spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div style={{ background:"#0d0d0d", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"'Sora',sans-serif" }}>
        <p style={{ color:"#aaa", fontSize:16 }}>Faça login para ver seus agendamentos.</p>
        <Link href="/login" style={{ color:"#fd5b01", textDecoration:"none", fontSize:14 }}>Entrar →</Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ background:"#0d0d0d", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"'Sora',sans-serif" }}>
        <p style={{ color:"#f87171", fontSize:16 }}>Erro ao carregar agendamentos.</p>
        <Link href="/home" style={{ color:"#fd5b01", textDecoration:"none", fontSize:14 }}>← Voltar para Home</Link>
      </div>
    );
  }

  const list = appointments ?? [];
  const byStatus = (statuses: AppointmentStatus[]) =>
    list.filter(a => statuses.includes(a.status));

  const hasAnyContent = SECTIONS.some(s => byStatus(s.statuses).length > 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .ap * { font-family:'Sora',sans-serif; box-sizing:border-box; }
        .ap-page { background:#0d0d0d; min-height:100vh; padding:5rem 1.5rem 3rem; }
        .ap-inner { max-width:720px; margin:0 auto; }
        .ap-title { font-size:24px; font-weight:800; color:#fff; letter-spacing:-0.03em; margin-bottom:6px; }
        .ap-sub   { font-size:13px; color:#555; margin-bottom:2.5rem; }

        .ap-section { margin-bottom:2rem; }
        .ap-section-title {
          font-size:11px; font-weight:700; color:#666;
          text-transform:uppercase; letter-spacing:0.08em;
          margin-bottom:10px;
          display:flex; align-items:center; gap:8px;
        }
        .ap-section-title::before { content:''; width:3px; height:12px; background:#fd5b01; border-radius:2px; }

        .ap-card {
          display:block; text-decoration:none;
          background:#1a1a1a;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:14px; padding:1.1rem 1.25rem;
          margin-bottom:10px;
          transition:border-color 0.2s, background 0.2s;
        }
        .ap-card:hover { border-color:rgba(253,91,1,0.3); background:rgba(253,91,1,0.03); }
        .ap-card-top { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
        .ap-avatar { width:40px; height:40px; border-radius:50%; overflow:hidden; position:relative; flex-shrink:0; border:2px solid rgba(253,91,1,0.3); background:#111; }
        .ap-provider { font-size:14px; font-weight:700; color:#f0f0f0; }
        .ap-service  { font-size:12px; color:#666; margin-top:2px; }
        .ap-card-bottom { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; }
        .ap-datetime { font-size:12px; color:#666; }
        .ap-price    { font-size:13px; font-weight:700; color:#fd5b01; }
        .ap-action-hint { font-size:11px; color:#888; margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); }

        .ap-empty-global { text-align:center; padding:4rem 0; color:#555; }
        .ap-empty-global p { font-size:15px; margin-bottom:12px; }
        @media (max-width: 480px) {
          .ap-page { padding: 4.5rem 1rem 2rem; }
          .ap-card-top { flex-wrap: wrap; }
        }
      `}</style>

      <div className="ap ap-page">
        <div className="ap-inner">
          <h1 className="ap-title">Meus Agendamentos</h1>
          <p className="ap-sub">{list.length} agendamento{list.length !== 1 ? "s" : ""} encontrado{list.length !== 1 ? "s" : ""}</p>

          {!hasAnyContent ? (
            <div className="ap-empty-global">
              <p>Você ainda não tem agendamentos.</p>
              <Link href="/home" style={{ color:"#fd5b01", textDecoration:"none", fontSize:14 }}>
                Explorar prestadores →
              </Link>
            </div>
          ) : (
            SECTIONS.map(section => {
              const items = byStatus(section.statuses);
              if (items.length === 0 && !section.emptyMsg) return null;
              return (
                <div key={section.title} className="ap-section">
                  <div className="ap-section-title">{section.title}</div>
                  {items.length === 0
                    ? <p style={{ fontSize:13, color:"#444", padding:"0.5rem 0" }}>{section.emptyMsg}</p>
                    : items.map(appt => <AppointmentCard key={appt.id} appt={appt} />)
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
