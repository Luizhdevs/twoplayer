"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/providers/AuthProvider";
import { auth, sendPasswordResetEmail } from "@/lib/firebase";
import { useMyProviderDirect, useProvider, useAddGalleryImage, useRemoveGalleryImage } from "@/hooks/useProviders";
import { useAppointmentsByProvider, useConfirmAppointment, useStartAppointment, useFinishAppointment } from "@/hooks/useAppointments";
import { useWallet } from "@/hooks/useWallet";
import { useServicesByProvider, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServices";
import { useReviewsByProvider } from "@/hooks/useReviews";
import { usersService } from "@/services/users.service";
import type { Service } from "@/services/services.service";
import type { Appointment, AppointmentStatus } from "@/services/appointments.service";

// ── Tipos locais ──────────────────────────────────────────────────────────────

type Colaborador = { id: string | number; name: string; email: string; bio?: string; avatarUrl?: string };

// ── Status config (para dashboard de appointments) ────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT:              { label: "Aguardando pagamento",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  EXPIRED:                      { label: "Agendamento expirado",      color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  PENDING:                      { label: "Pendente",                  color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  PAID:                         { label: "Pago — confirmar",          color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CONFIRMED:                    { label: "Reunião confirmada",        color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  IN_PROGRESS:                  { label: "Atendimento em andamento",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  AWAITING_CLIENT_CONFIRMATION: { label: "Aguardando aprovação",      color: "#fd5b01", bg: "rgba(253,91,1,0.12)" },
  COMPLETED:                    { label: "Atendimento concluído",     color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED:                    { label: "Cancelado",                 color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  REFUNDED:                     { label: "Reembolsado",               color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  DISPUTED:                     { label: "Em disputa",                color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#aaa", bg: "rgba(255,255,255,0.08)" };
  return (
    <span style={{
      display: "inline-block",
      background: cfg.bg, color: cfg.color,
      fontSize: 10, fontWeight: 700,
      padding: "3px 8px", borderRadius: 100,
      border: `1px solid ${cfg.color}33`,
      whiteSpace: "nowrap",
    }}>{cfg.label}</span>
  );
}

// ── Card de appointment do prestador ─────────────────────────────────────────

function AppointmentCard({ appt }: { appt: Appointment }) {
  const confirm = useConfirmAppointment();
  const start   = useStartAppointment();
  const finish  = useFinishAppointment();

  const clientName = appt.user?.name ?? "Cliente";
  const date = new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const actionLoading = confirm.isPending || start.isPending || finish.isPending;
  const actionErr     = confirm.error?.message ?? start.error?.message ?? finish.error?.message;

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "1rem 1.25rem",
      marginBottom: 10,
    }}>
      {/* Header: cliente + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>{clientName}</p>
          <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>{appt.service?.title ?? "Serviço"}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* Detalhes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: actionErr ? 8 : 0 }}>
        <span style={{ fontSize: 12, color: "#777" }}>📅 {date}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fd5b01" }}>
          R$ {(appt.amount / 100).toFixed(2)}
        </span>
      </div>

      {/* Ações baseadas no status */}
      {appt.status === "PAID" && (
        <button
          className="cp-action-btn cp-action-confirm"
          disabled={actionLoading}
          onClick={() => confirm.mutate(appt.id)}
        >
          {confirm.isPending ? "Confirmando..." : "✅ Confirmar Serviço"}
        </button>
      )}

      {appt.status === "CONFIRMED" && (
        <button
          className="cp-action-btn cp-action-start"
          disabled={actionLoading}
          onClick={() => start.mutate(appt.id)}
        >
          {start.isPending ? "Iniciando..." : "▶️ Iniciar Atendimento"}
        </button>
      )}

      {appt.status === "IN_PROGRESS" && (
        <button
          className="cp-action-btn cp-action-finish"
          disabled={actionLoading}
          onClick={() => finish.mutate(appt.id)}
        >
          {finish.isPending ? "Finalizando..." : "🏁 Finalizar Atendimento"}
        </button>
      )}

      {/* Link da reunião (para statuses ativos) */}
      {appt.meetingUrl && !["PENDING_PAYMENT", "CANCELLED", "REFUNDED", "DISPUTED"].includes(appt.status) && (
        <a
          href={appt.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 10, padding: "9px 0",
            background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
            borderRadius: 8, color: "#4ade80",
            fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          🎥 Entrar na Reunião
        </a>
      )}

      {/* Link para detalhes */}
      <Link
        href={`/appointments/${appt.id}`}
        style={{ display: "block", marginTop: 8, fontSize: 11, color: "#555", textDecoration: "none" }}
      >
        Ver detalhes →
      </Link>

      {actionErr && (
        <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>⚠️ {actionErr}</p>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Stars({ nota }: { nota: number }) {
  return <span>{Array.from({ length: 5 }).map((_, i) => (
    <span key={i} style={{ fontSize: 14 }}>{i < nota ? "⭐" : "☆"}</span>
  ))}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ColaboradorPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { dbUser, loading: authLoading, logout, updateDbUser } = useAuth();

  // Saldo real da wallet
  const { data: walletData } = useWallet(dbUser?.id ?? "");
  const walletBalance = walletData?.balance ?? 0;

  // Lookup do Provider entity via GET /providers/me
  const { data: myProvider, isLoading: providerLoading } = useMyProviderDirect();
  const providerId = myProvider?.id ?? "";

  // Appointments do provider
  const { data: appointments, isLoading: apptLoading } = useAppointmentsByProvider(providerId);

  // Galeria real do provider
  const { data: providerProfile } = useProvider(providerId);
  const addGallery    = useAddGalleryImage();
  const removeGallery = useRemoveGalleryImage();
  // Imagens recém-adicionadas nesta sessão (com ID para remoção)
  const [addedImages, setAddedImages] = useState<{ id: string; url: string }[]>([]);
  const [uploadErr, setUploadErr]     = useState("");
  const [avatarMenu, setAvatarMenu]   = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [colab, setColab]               = useState<Colaborador | null>(null);
  const [pwResetMsg, setPwResetMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showIndisponivel, setShowIndisp] = useState(false);
  const [showAddServico, setShowAddServico] = useState(false);
  const [showEditServico, setShowEditServico] = useState<Service | null>(null);

  const [sTitulo, setSTitulo]   = useState("");
  const [sDesc,   setSDesc]     = useState("");
  const [sPreco,  setSPreco]    = useState("");
  const [sDur,    setSDur]      = useState("");
  const [sCats,   setSCats]     = useState<string[]>([]);
  const [sOk,     setSOk]       = useState(false);
  const [sErr,    setSErr]      = useState("");

  // Serviços e reviews reais via API
  const { data: servicos = [], isLoading: servicosLoading } = useServicesByProvider(providerId);
  const { data: reviews = [] } = useReviewsByProvider(providerId);
  const createService = useCreateService();
  const updateService = useUpdateService(providerId);
  const deleteService = useDeleteService(providerId);

  useEffect(() => {
    if (dbUser) {
      // Funciona tanto para login Firebase (UUID) quanto para mock (id numérico)
      setColab({
        id:       dbUser.id,
        name:     dbUser.name,
        email:    dbUser.email,
        bio:      dbUser.bio ?? undefined,
        avatarUrl: dbUser.avatarUrl ?? undefined,
      });
    } else if (!authLoading) {
      // Firebase resolveu mas não há usuário autenticado
      // Fallback: usa dados do URL + placeholder para não travar em "Carregando..."
      setColab({
        id,
        name:  "Prestador",
        email: "",
      });
    }
  }, [dbUser, id, authLoading]);

  function abrirEdit(s: Service) {
    setShowEditServico(s);
    setSTitulo(s.title);
    setSDesc(s.description);
    setSPreco((s.price / 100).toFixed(2));
    setSDur(String(s.duration));
    setSCats(s.categories ?? []);
    setSOk(false); setSErr("");
  }
  function abrirAdd() {
    setShowAddServico(true); setSTitulo(""); setSDesc(""); setSPreco(""); setSDur(""); setSCats([]); setSOk(false); setSErr("");
  }
  function toggleCat(cat: string) {
    setSCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }
  function salvarServico() {
    if (!sTitulo || !sDesc || !sPreco || !sDur) return;
    setSErr("");
    const precoReais = parseFloat(sPreco.replace(",", "."));
    if (isNaN(precoReais) || precoReais <= 0) { setSErr("Preço inválido."); return; }
    if (showEditServico) {
      updateService.mutate(
        { id: showEditServico.id, input: { title: sTitulo, description: sDesc, price: precoReais, duration: parseInt(sDur), categories: sCats } },
        { onSuccess: () => setSOk(true), onError: (e) => setSErr(e.message) },
      );
    } else {
      createService.mutate(
        { providerId, title: sTitulo, description: sDesc, price: precoReais, duration: parseInt(sDur), categories: sCats },
        { onSuccess: () => setSOk(true), onError: (e) => setSErr(e.message) },
      );
    }
  }
  function fecharServico() {
    setShowAddServico(false); setShowEditServico(null); setSOk(false); setSErr("");
    setSTitulo(""); setSDesc(""); setSPreco(""); setSDur(""); setSCats([]);
  }
  function handleDeleteServico(serviceId: string) {
    if (!confirm("Remover este serviço?")) return;
    deleteService.mutate(serviceId);
  }
  function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    addGallery.mutate(file, {
      onSuccess: (result) => {
        setAddedImages(prev => [...prev, { id: result.id, url: result.url }]);
      },
      onError: (err) => setUploadErr(err.message),
    });
    // Reset input so same file can be re-selected if needed
    e.target.value = "";
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarMenu(false);
    setAvatarUploading(true);
    try {
      const avatarUrl = await usersService.updateAvatar(file);
      setColab(prev => prev ? { ...prev, avatarUrl } : prev);
      updateDbUser({ avatarUrl });
    } catch {
      // silently ignore — UI stays as-is
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarMenu(false);
    setColab(prev => prev ? { ...prev, avatarUrl: undefined } : prev);
  }

  function handleRemoveGalleryImage(imageId: string) {
    removeGallery.mutate(imageId, {
      onSuccess: () => setAddedImages(prev => prev.filter(i => i.id !== imageId)),
    });
  }

  // Redireciona clientes para home — esta rota é exclusiva de prestadores
  useEffect(() => {
    if (!authLoading && dbUser && dbUser.role !== "PROVIDER") {
      router.replace("/home");
    }
  }, [authLoading, dbUser, router]);

  if (authLoading || !colab || (dbUser && dbUser.role !== "PROVIDER")) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0d0d0d", fontFamily: "'Sora',sans-serif", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes cp-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fd5b01", animation: "cp-spin 0.8s linear infinite" }} />
      <span style={{ color: "#555", fontSize: 13 }}>Carregando...</span>
    </div>
  );

  // Dashboard sections
  const apptList          = appointments ?? [];
  const needsActionAppts  = apptList.filter(a => a.status === "PAID"); // aguarda confirmação
  const confirmedAppts    = apptList.filter(a => a.status === "CONFIRMED");
  const inProgressAppts   = apptList.filter(a => a.status === "IN_PROGRESS");
  const awaitingAppts     = apptList.filter(a => a.status === "AWAITING_CLIENT_CONFIRMATION");
  const pendingAppts      = apptList.filter(a => ["PENDING_PAYMENT", "PENDING"].includes(a.status));
  const pastAppts         = apptList.filter(a => ["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED", "EXPIRED"].includes(a.status));
  const activeAppts       = [...needsActionAppts, ...confirmedAppts, ...inProgressAppts, ...awaitingAppts];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .cp * { font-family:'Sora',sans-serif; box-sizing:border-box; }

        .cp-card { background:#1a1a1a; border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:1.75rem; margin-bottom:1.25rem; }

        .cp-section-title { font-size:13px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem; display:flex; align-items:center; gap:10px; }
        .cp-section-title::before { content:''; display:block; width:3px; height:14px; background:#fd5b01; border-radius:2px; flex-shrink:0; }

        .cp-btn-primary { padding:10px 18px; background:#fd5b01; color:#fff; border:none; border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:inline-flex; align-items:center; gap:6px; }
        .cp-btn-primary:hover { background:#d94d00; }
        .cp-btn-primary:active { transform:scale(.97); }

        .cp-btn-secondary { padding:10px 18px; background:transparent; color:#fd5b01; border:1.5px solid rgba(253,91,1,0.4); border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:6px; }
        .cp-btn-secondary:hover { background:rgba(253,91,1,0.1); border-color:#fd5b01; }

        .cp-btn-ghost { width:100%; padding:13px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:500; color:#ccc; text-align:left; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all .2s; margin-bottom:8px; }
        .cp-btn-ghost:hover { background:rgba(253,91,1,0.1); border-color:rgba(253,91,1,0.3); color:#fd5b01; }

        .cp-servico { background:rgba(255,255,255,0.04); border-radius:14px; padding:1.25rem; margin-bottom:10px; border:1px solid rgba(255,255,255,0.06); transition:border-color .2s; }
        .cp-servico:hover { border-color:rgba(253,91,1,0.2); }
        .cp-servico-titulo { font-size:14px; font-weight:700; color:#f0f0f0; margin-bottom:3px; }
        .cp-servico-desc   { font-size:12px; color:#666; margin-bottom:8px; }
        .cp-preco { font-size:16px; font-weight:700; color:#fd5b01; }
        .cp-dur   { font-size:11px; color:#666; background:rgba(255,255,255,0.07); padding:3px 10px; border-radius:100px; }

        .cp-gallery { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .cp-gallery-item { border-radius:12px; overflow:hidden; aspect-ratio:1/1; position:relative; background:#111; }
        .cp-foto-add { border-radius:12px; aspect-ratio:1/1; background:rgba(255,255,255,0.03); border:2px dashed rgba(253,91,1,0.25); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; gap:4px; }
        .cp-foto-add:hover { border-color:#fd5b01; background:rgba(253,91,1,0.06); }
        button:hover .cp-avatar-overlay, button:focus .cp-avatar-overlay { opacity:1 !important; }
        .cp-menu-item:hover { background:rgba(255,255,255,0.06); }
        .cp-foto-add span { font-size:22px; }
        .cp-foto-add p { font-size:10px; font-weight:600; color:#fd5b01; }

        .cp-comment { background:rgba(255,255,255,0.04); border-radius:12px; padding:1.25rem; margin-bottom:10px; border:1px solid rgba(255,255,255,0.06); }
        .cp-comment-user    { font-size:13px; font-weight:700; color:#f0f0f0; }
        .cp-comment-service { font-size:11px; font-weight:700; color:#fd5b01; background:rgba(253,91,1,0.1); padding:2px 10px; border-radius:100px; border:1px solid rgba(253,91,1,0.2); }
        .cp-comment-text    { font-size:13px; color:#aaa; line-height:1.6; margin:6px 0; }
        .cp-comment-date    { font-size:11px; color:#555; }

        .cp-wallet { background:linear-gradient(135deg,#fd5b01,#ff8c42); border-radius:14px; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; transition:transform .2s,box-shadow .2s; box-shadow:0 4px 16px rgba(253,91,1,0.3); border:none; width:100%; font-family:'Sora',sans-serif; }
        .cp-wallet:hover { transform:scale(1.01); box-shadow:0 8px 32px rgba(253,91,1,0.45); }

        .cp-label { font-size:11px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; display:block; }
        .cp-input { width:100%; padding:11px 14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; color:#fff; outline:none; margin-bottom:.75rem; transition:border-color .2s,box-shadow .2s; }
        .cp-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .cp-input::placeholder { color:#444; }
        .cp-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn .2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box { background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:2rem; width:100%; max-width:440px; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.6); animation:popIn .25s ease; }
        @keyframes popIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .modal-close { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-size:14px; color:#aaa; transition:all .15s; }
        .modal-close:hover { background:#fd5b01; color:#fff; }
        .modal-confirm { width:100%; padding:12px; background:#fd5b01; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s; margin-top:.5rem; }
        .modal-confirm:hover:not(:disabled) { background:#d94d00; }
        .modal-confirm:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }

        .cp-success { text-align:center; padding:1rem 0; }
        .cp-success-icon { font-size:48px; margin-bottom:12px; }
        .cp-success h3 { font-size:18px; font-weight:700; color:#fff; margin-bottom:8px; }
        .cp-success p  { font-size:13px; color:#888; margin-bottom:1.25rem; line-height:1.6; }

        /* Botões de ação do appointment */
        .cp-action-btn {
          width:100%; margin-top:10px; padding:10px;
          border:none; border-radius:8px;
          font-family:'Sora',sans-serif; font-size:13px; font-weight:700;
          cursor:pointer; transition:opacity .2s,transform .1s;
        }
        .cp-action-btn:hover:not(:disabled) { opacity:.85; }
        .cp-action-btn:active:not(:disabled) { transform:scale(.98); }
        .cp-action-btn:disabled { opacity:.4; cursor:not-allowed; }
        .cp-action-confirm { background:rgba(74,222,128,0.12); color:#4ade80; border:1px solid rgba(74,222,128,0.3); }
        .cp-action-start   { background:rgba(167,139,250,0.12); color:#a78bfa; border:1px solid rgba(167,139,250,0.3); }
        .cp-action-finish  { background:rgba(253,91,1,0.12);   color:#fd5b01; border:1px solid rgba(253,91,1,0.3); }

        .cp-appt-spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,0.1); border-top-color:#fd5b01; border-radius:50%; animation:cpSpin .7s linear infinite; margin:0 auto; }
        @keyframes cpSpin { to{transform:rotate(360deg)} }
        .cp-tabs { display:flex; gap:4px; margin-bottom:1rem; }
        .cp-tab { padding:7px 14px; border-radius:8px; border:none; font-family:'Sora',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; }
        .cp-tab.active { background:#fd5b01; color:#fff; }
        .cp-tab:not(.active) { background:rgba(255,255,255,0.05); color:#666; }
        .cp-tab:not(.active):hover { background:rgba(255,255,255,0.08); color:#aaa; }
      `}</style>

      <Navbar />
      <div className="cp" style={{ background: "#0d0d0d", minHeight: "100vh", padding: "5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* HEADER */}
          <div className="cp-card">
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              {/* Avatar clicável */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  onClick={() => setAvatarMenu(v => !v)}
                  style={{ width: 88, height: 88, borderRadius: "50%", border: "none", padding: 0, cursor: avatarUploading ? "wait" : "pointer", background: "linear-gradient(135deg,#fd5b01,#ff8c42)", overflow: "hidden", position: "relative", boxShadow: "0 4px 24px rgba(253,91,1,0.35)" }}
                  aria-label="Alterar foto de perfil"
                >
                  {colab.avatarUrl ? (
                    <Image src={colab.avatarUrl} alt={colab.name} fill style={{ objectFit: "cover" }} sizes="88px" />
                  ) : (
                    <span style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{colab.name.charAt(0)}</span>
                  )}
                  {/* overlay câmera */}
                  <span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: avatarUploading ? 1 : 0, transition: "opacity .2s" }} className="cp-avatar-overlay">
                    {avatarUploading
                      ? <span style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "cpSpin .7s linear infinite" }} />
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    }
                  </span>
                </button>

                {/* Menu dropdown */}
                {avatarMenu && !avatarUploading && (
                  <>
                    <div onClick={() => setAvatarMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div style={{ position: "absolute", top: 96, left: 0, zIndex: 100, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f0f0f0", transition: "background .15s" }} className="cp-menu-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        Trocar foto
                        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarUpload} />
                      </label>
                      {colab.avatarUrl && (
                        <button onClick={handleRemoveAvatar} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", width: "100%", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#f87171", textAlign: "left", transition: "background .15s" }} className="cp-menu-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          Remover foto
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* input oculto — necessário para "Trocar foto" via label */}
                <input id="avatar-upload-hidden" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarUpload} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-.03em" }}>{colab.name}</h1>
                  <span style={{ background: "rgba(253,91,1,0.12)", color: "#fd5b01", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(253,91,1,0.25)" }}>Prestador</span>
                </div>
                <p style={{ fontSize: 13, color: "#666" }}>{colab.email}</p>
              </div>
            </div>

            {/* CARTEIRA */}
            <button className="cp-wallet" onClick={() => router.push(`/users/${id}/wallet`)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👛</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.8)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Minha Carteira</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>R$ {Number(walletBalance).toFixed(2).replace(".", ",")}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.9)", background: "rgba(255,255,255,.15)", padding: "7px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>Ver carteira →</div>
            </button>
          </div>

          {/* ── DASHBOARD DE AGENDAMENTOS ── */}
          <div className="cp-card">
            <div className="cp-section-title">Agendamentos</div>

            {(providerLoading || apptLoading) && (
              <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
                <div className="cp-appt-spinner" />
                <p style={{ fontSize:12, color:"#555", marginTop:8 }}>Carregando...</p>
              </div>
            )}

            {!providerLoading && !apptLoading && apptList.length === 0 && (
              <p style={{ fontSize:13, color:"#555", textAlign:"center", padding:"1.5rem 0" }}>
                Nenhum agendamento recebido ainda.
              </p>
            )}

            {/* AÇÃO NECESSÁRIA — cliente pagou, aguarda confirmação */}
            {needsActionAppts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#fd5b01", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ background:"#fd5b01", color:"#fff", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{needsActionAppts.length}</span>
                  Confirmar agendamento
                </p>
                {needsActionAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            )}

            {/* EM ANDAMENTO */}
            {inProgressAppts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#a78bfa", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                  Em andamento ({inProgressAppts.length})
                </p>
                {inProgressAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            )}

            {/* PRÓXIMOS CONFIRMADOS */}
            {confirmedAppts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#4ade80", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                  Próximos confirmados ({confirmedAppts.length})
                </p>
                {confirmedAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            )}

            {/* AGUARDANDO APROVAÇÃO DO CLIENTE */}
            {awaitingAppts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                  Aguardando aprovação do cliente ({awaitingAppts.length})
                </p>
                {awaitingAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            )}

            {/* AGUARDANDO PAGAMENTO */}
            {pendingAppts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#3b82f6", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                  Aguardando pagamento ({pendingAppts.length})
                </p>
                {pendingAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            )}

            {/* HISTÓRICO */}
            {pastAppts.length > 0 && (
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8, marginTop: activeAppts.length || pendingAppts.length ? 8 : 0 }}>
                  Histórico ({pastAppts.length})
                </p>
                {pastAppts.map(a => <AppointmentCard key={a.id} appt={a} />)}
              </div>
            )}
          </div>

          {/* SERVIÇOS */}
          <div className="cp-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div className="cp-section-title" style={{ marginBottom: 0 }}>Meus Serviços</div>
              <button className="cp-btn-primary" onClick={abrirAdd}>+ Adicionar serviço</button>
            </div>
            {servicosLoading && <p style={{ fontSize: 13, color: "#666" }}>Carregando serviços...</p>}
            {!servicosLoading && servicos.length === 0 && (
              <p style={{ fontSize: 13, color: "#555", textAlign: "center", padding: "1rem 0" }}>
                Nenhum serviço cadastrado. Adicione seu primeiro serviço!
              </p>
            )}
            {servicos.map(s => (
              <div key={s.id} className="cp-servico">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p className="cp-servico-titulo">{s.title}</p>
                    <p className="cp-servico-desc">{s.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className="cp-preco">R$ {(s.price / 100).toFixed(2)}</span>
                      <span className="cp-dur">⏱ {s.duration} min</span>
                    </div>
                    {(s.categories ?? []).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {s.categories.map(c => (
                          <span key={c} style={{ fontSize: 10, fontWeight: 600, color: "#fd5b01", background: "rgba(253,91,1,0.1)", border: "1px solid rgba(253,91,1,0.2)", padding: "2px 8px", borderRadius: 10 }}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="cp-btn-secondary" onClick={() => abrirEdit(s)} title="Editar serviço" aria-label={`Editar serviço: ${s.title}`}>✏️ Alterar</button>
                    <button className="cp-btn-secondary" style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }} onClick={() => handleDeleteServico(s.id)} title="Remover serviço" aria-label={`Remover serviço: ${s.title}`}>🗑 Remover</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FOTOS */}
          <div className="cp-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
              <div className="cp-section-title" style={{ marginBottom: 0 }}>Galeria</div>
              {addGallery.isPending && (
                <span style={{ fontSize: 12, color: "#fd5b01", fontFamily: "'Sora',sans-serif" }}>Enviando...</span>
              )}
            </div>

            {uploadErr && (
              <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
                ⚠️ {uploadErr}
              </p>
            )}

            <div className="cp-gallery">
              {/* Imagens existentes (sem ID disponível → sem botão de remoção) */}
              {(providerProfile?.images ?? []).map((url, i) => {
                if (!url) return null;
                const isAdded = addedImages.some(a => a.url === url);
                if (isAdded) return null;
                return (
                  <div key={`existing-${i}`} className="cp-gallery-item">
                    <Image src={url} alt="Foto" fill style={{ objectFit: "cover" }} />
                  </div>
                );
              })}

              {/* Imagens adicionadas nesta sessão (com botão de remoção) */}
              {addedImages.map(img => img.url ? (
                <div key={img.id} className="cp-gallery-item" style={{ position: "relative" }}>
                  <Image src={img.url} alt="Foto" fill style={{ objectFit: "cover" }} />
                  <button
                    onClick={() => handleRemoveGalleryImage(img.id)}
                    disabled={removeGallery.isPending}
                    style={{
                      position: "absolute", top: 4, right: 4, zIndex: 2,
                      background: "rgba(0,0,0,0.7)", border: "none",
                      borderRadius: "50%", width: 22, height: 22,
                      color: "#f87171", fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                    title="Remover imagem"
                    aria-label="Remover imagem da galeria"
                  >
                    ✕
                  </button>
                </div>
              ) : null)}

              {/* Adicionar nova foto */}
              <label className="cp-foto-add" htmlFor="foto-upload" style={{ opacity: addGallery.isPending ? 0.5 : 1, cursor: addGallery.isPending ? "not-allowed" : "pointer" }}>
                <span>{addGallery.isPending ? "⏳" : "+"}</span>
                <p>Adicionar foto</p>
              </label>
              <input
                id="foto-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFotoUpload}
                disabled={addGallery.isPending}
              />
            </div>
          </div>

          {/* AVALIAÇÕES RECEBIDAS */}
          <div className="cp-card">
            <div className="cp-section-title">Avaliações recebidas</div>
            {reviews.length === 0 ? (
              <p style={{ fontSize:13, color:"#555", textAlign:"center", padding:"1rem 0" }}>
                Nenhuma avaliação recebida ainda.
              </p>
            ) : reviews.map((r: any) => (
              <div key={r.id} className="cp-comment">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span className="cp-comment-user">{r.user?.name ?? "Cliente"}</span>
                  <span className="cp-comment-service">{r.service?.title ?? "Serviço"}</span>
                </div>
                <Stars nota={r.rating} />
                {r.comment && <p className="cp-comment-text">"{r.comment}"</p>}
                <p className="cp-comment-date">{new Date(r.createdAt).toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}</p>
              </div>
            ))}
          </div>

          {/* CONFIGURAÇÕES */}
          <div className="cp-card">
            <div className="cp-section-title">Configurações</div>
            <Link href="/providers/me/availability" className="cp-btn-ghost" style={{ textDecoration: "none" }}>
              📅 Minha Disponibilidade
            </Link>
            <button className="cp-btn-ghost" onClick={() => setShowIndisp(true)}>✏️ Editar perfil</button>
            <button className="cp-btn-ghost" onClick={async () => {
              setPwResetMsg(null);
              const email = auth.currentUser?.email;
              if (!email) return;
              try {
                await sendPasswordResetEmail(auth, email);
                setPwResetMsg({ type: "success", text: "Link enviado! Verifique seu e-mail." });
              } catch {
                setPwResetMsg({ type: "error", text: "Não foi possível enviar o e-mail. Tente novamente." });
              }
            }}>🔒 Alterar senha</button>
            {pwResetMsg && (
              <p style={{ fontSize: 12, marginTop: -4, marginBottom: 8, paddingLeft: 4,
                color: pwResetMsg.type === "success" ? "#4ade80" : "#f87171" }}>
                {pwResetMsg.text}
              </p>
            )}
            <button className="cp-btn-ghost" onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}>🚪 Sair da conta</button>
          </div>

        </div>
      </div>

      {/* MODAL ADD/EDIT SERVIÇO */}
      {(showAddServico || showEditServico) && (
        <div className="overlay" onClick={fecharServico}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={fecharServico}>✕</button>
            {sOk ? (
              <div className="cp-success">
                <div className="cp-success-icon">✅</div>
                <h3>{showEditServico ? "Serviço atualizado!" : "Serviço adicionado!"}</h3>
                <p>As alterações foram salvas com sucesso.</p>
                <button className="modal-confirm" onClick={fecharServico}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-.02em", marginBottom: 4 }}>
                  {showEditServico ? "✏️ Alterar serviço" : "➕ Adicionar serviço"}
                </p>
                <p style={{ fontSize: 13, color: "#777", marginBottom: "1.25rem" }}>
                  {showEditServico ? "Edite as informações do serviço" : "Preencha os dados do novo serviço"}
                </p>
                <label className="cp-label">Título</label>
                <input className="cp-input" placeholder="Ex: Bate-papo" value={sTitulo} onChange={e => setSTitulo(e.target.value)} />
                <label className="cp-label">Descrição</label>
                <input className="cp-input" placeholder="Ex: Sessão de 30min" value={sDesc} onChange={e => setSDesc(e.target.value)} />
                <div className="cp-row">
                  <div><label className="cp-label">Preço (R$)</label><input className="cp-input" type="number" placeholder="50.00" step="0.01" value={sPreco} onChange={e => setSPreco(e.target.value)} /></div>
                  <div><label className="cp-label">Duração (min)</label><input className="cp-input" type="number" placeholder="30" value={sDur} onChange={e => setSDur(e.target.value)} /></div>
                </div>
                <label className="cp-label">Categorias</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 4 }}>
                  {["Games","Esports","Futebol","Basquete","Tênis","Vôlei","Streaming","YouTube","TikTok","Coaching","Mentoria","Bate-papo","Autógrafo","Lives","Música","Fitness"].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCat(cat)}
                      style={{
                        padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        background: sCats.includes(cat) ? "rgba(253,91,1,0.15)" : "rgba(255,255,255,0.05)",
                        border: sCats.includes(cat) ? "1.5px solid rgba(253,91,1,0.5)" : "1.5px solid rgba(255,255,255,0.1)",
                        color: sCats.includes(cat) ? "#fd5b01" : "#888",
                        transition: "all .15s",
                      }}
                    >{cat}</button>
                  ))}
                </div>
                {sCats.length > 0 && (
                  <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{sCats.length} categoria{sCats.length > 1 ? "s" : ""} selecionada{sCats.length > 1 ? "s" : ""}</p>
                )}
                {sErr && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{sErr}</p>}
                <button className="modal-confirm" disabled={!sTitulo || !sDesc || !sPreco || !sDur || createService.isPending || updateService.isPending} onClick={salvarServico}>
                  {(createService.isPending || updateService.isPending) ? "Salvando..." : showEditServico ? "Salvar alterações →" : "Adicionar serviço →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL INDISPONÍVEL */}
      {showIndisponivel && (
        <div className="overlay" onClick={() => setShowIndisp(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowIndisp(false)}>✕</button>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Serviço indisponível</h3>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Este serviço está atualmente indisponível. Em breve estará disponível!</p>
            <button className="modal-confirm" onClick={() => setShowIndisp(false)}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
