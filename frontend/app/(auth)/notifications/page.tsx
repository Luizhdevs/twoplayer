"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { getNotificationUrl } from "@/services/notifications.service";
import type { Notification } from "@/services/notifications.service";

// ── Config ─────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<Notification["type"], { icon: string; color: string }> = {
  APPOINTMENT: { icon: "📅", color: "#fd5b01" },
  REVIEW:      { icon: "⭐", color: "#f59e0b" },
  WALLET:      { icon: "👛", color: "#4ade80" },
  SYSTEM:      { icon: "🔔", color: "#a78bfa" },
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div style={{ background: "var(--bg,#0d0d0d)", minHeight: "100vh", padding: "5.5rem 1.5rem 3rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="sk sk-h28" style={{ width: 180, marginBottom: 8, borderRadius: 6 }} />
        <div className="sk sk-h13" style={{ width: 120, marginBottom: "2rem", borderRadius: 6 }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "1rem 1.25rem", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, marginBottom: 10 }}>
            <div className="sk sk-circle" style={{ width: 42, height: 42, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk sk-h13" style={{ width: "65%", marginBottom: 8, borderRadius: 5 }} />
              <div className="sk sk-h10" style={{ width: "80%", marginBottom: 8, borderRadius: 5 }} />
              <div className="sk sk-h10" style={{ width: "35%", borderRadius: 5 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notification Card ──────────────────────────────────────────────────────────

function NotifCard({ notif, onRead, index }: { notif: Notification; onRead: (id: string) => void; index: number }) {
  const router    = useRouter();
  const cfg       = TYPE_CONFIG[notif.type] ?? { icon: "🔔", color: "#aaa" };
  const isRead    = !!notif.readAt;
  const targetUrl = getNotificationUrl(notif);
  const isClickable = !isRead || !!targetUrl;

  const date = new Date(notif.createdAt).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  function handleClick() {
    if (!isRead) onRead(notif.id);
    if (targetUrl) router.push(targetUrl);
  }

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && handleClick() : undefined}
      className="nf-card anim-fadeUp"
      style={{
        animationDelay: `${index * 0.04}s`,
        opacity: isRead ? 0.7 : 1,
      }}
      data-read={isRead}
      data-clickable={isClickable}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="nf-unread-dot" style={{ background: cfg.color }} />
      )}

      {/* Icon */}
      <div className="nf-icon" style={{ background: `${cfg.color}18` }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.icon}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="nf-title" style={{ fontWeight: isRead ? 500 : 700, color: isRead ? "#888" : "#f0f0f0" }}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="nf-body">{notif.body}</p>
        )}
        <div className="nf-meta">
          <span className="nf-date">{date}</span>
          {targetUrl && (
            <span className="nf-cta" style={{ color: cfg.color }}>
              Ver detalhes →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { data: notifications, isLoading, isError, refetch } = useNotifications(dbUser?.id ?? "");
  const markAsRead    = useMarkAsRead(dbUser?.id ?? "");
  const markAllAsRead = useMarkAllAsRead(dbUser?.id ?? "");

  if (authLoading || isLoading) return <NotifSkeleton />;

  if (!dbUser) return (
    <div className="page-loader">
      <p style={{ color: "#aaa", fontSize: 15, fontFamily: "var(--font)" }}>Faça login para ver suas notificações.</p>
    </div>
  );

  if (isError) return (
    <div className="page-loader">
      <span style={{ fontSize: 40 }}>😕</span>
      <p style={{ color: "#f87171", fontSize: 15, fontFamily: "var(--font)" }}>Erro ao carregar notificações.</p>
      <button
        onClick={() => refetch()}
        style={{ padding: "10px 22px", background: "#fd5b01", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font)", fontWeight: 700, fontSize: 14 }}
      >
        Tentar novamente
      </button>
    </div>
  );

  const list   = notifications ?? [];
  const unread = list.filter(n => !n.readAt).length;
  const read   = list.filter(n => !!n.readAt);
  const unreadList = list.filter(n => !n.readAt);

  return (
    <>
      <style>{`
        .nf * { font-family: var(--font,'Sora',sans-serif); box-sizing: border-box; }
        .nf-page {
          background: var(--bg,#0d0d0d);
          min-height: 100vh;
          padding: 5.5rem 1.5rem 4rem;
        }
        .nf-inner { max-width: 680px; margin: 0 auto; }

        /* ── HEADER ── */
        .nf-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-bottom: 2rem;
        }
        .nf-header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

        .nf-mark-all-btn {
          padding: 9px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 9px; color: var(--t2,#aaa);
          font-family: var(--font,'Sora',sans-serif);
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s;
          display: flex; align-items: center; gap: 6px;
        }
        .nf-mark-all-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.20); color: #fff; }
        .nf-mark-all-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .nf-back-btn {
          padding: 9px 16px;
          background: rgba(253,91,1,0.10);
          border: 1px solid rgba(253,91,1,0.20);
          border-radius: 9px; color: var(--brand,#fd5b01);
          text-decoration: none; font-size: 12px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background .15s;
        }
        .nf-back-btn:hover { background: rgba(253,91,1,0.17); }

        /* ── GROUP LABEL ── */
        .nf-group-label {
          font-size: 11px; font-weight: 700; color: var(--t3,#666);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .nf-group-label::before { content:''; width:3px; height:12px; background:#fd5b01; border-radius:2px; }
        .nf-group-count {
          background: rgba(255,255,255,0.08); color: var(--t2,#aaa);
          font-size: 10px; font-weight: 700; padding: 2px 8px;
          border-radius: 100px; border: 1px solid rgba(255,255,255,0.1);
        }

        /* ── CARD ── */
        .nf-card {
          display: flex; gap: 14px; padding: 1rem 1.25rem;
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border,rgba(255,255,255,0.07));
          border-radius: 14px; margin-bottom: 8px;
          position: relative;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .nf-card[data-read="false"] {
          border-color: rgba(255,255,255,0.10);
          background: #1d1d1d;
        }
        .nf-card[data-clickable="true"] { cursor: pointer; }
        .nf-card[data-clickable="true"]:hover {
          border-color: rgba(253,91,1,0.22);
          background: rgba(253,91,1,0.025);
          transform: translateY(-1px);
        }
        .nf-card:focus-visible {
          outline: 2px solid rgba(253,91,1,0.5);
          outline-offset: 2px;
        }

        .nf-unread-dot {
          position: absolute; top: 12px; right: 14px;
          width: 8px; height: 8px; border-radius: 50%;
          animation: tp-pulse 2.5s ease infinite;
        }
        @keyframes tp-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.55; transform:scale(1.2); }
        }

        .nf-icon {
          width: 44px; height: 44px; border-radius: 12px;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .nf-title {
          font-size: 14px; line-height: 1.45;
          margin: 0 0 4px; padding-right: 16px;
        }
        .nf-body {
          font-size: 12px; color: var(--t3,#666); line-height: 1.5; margin: 0 0 5px;
        }
        .nf-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .nf-date { font-size: 11px; color: var(--t4,#444); }
        .nf-cta  { font-size: 11px; font-weight: 700; }

        /* ── EMPTY ── */
        .nf-empty {
          text-align: center; padding: 5rem 1rem;
          animation: tp-fadeUp 0.4s ease both;
        }
        .nf-empty-icon  { font-size: 60px; margin-bottom: 16px; opacity: 0.45; }
        .nf-empty-title { font-size: 17px; font-weight: 700; color: var(--t2,#aaa); margin-bottom: 8px; }
        .nf-empty-desc  { font-size: 13px; color: var(--t3,#666); line-height: 1.65; margin-bottom: 22px; }

        @media (max-width: 480px) {
          .nf-page { padding: 5rem 1rem 3rem; }
          .nf-header { flex-direction: column; }
        }
      `}</style>

      <div className="nf nf-page">
        <div className="nf-inner">

          {/* HEADER */}
          <div className="nf-header">
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", margin: "0 0 4px" }}>
                Notificações
              </h1>
              <p style={{ fontSize: 13, color: "var(--t3)", margin: 0 }}>
                {unread > 0 ? `${unread} não lida${unread > 1 ? "s" : ""}` : "Tudo em dia ✓"}
              </p>
            </div>
            <div className="nf-header-actions">
              {unread > 0 && (
                <button
                  className="nf-mark-all-btn"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  {markAllAsRead.isPending ? (
                    <><div className="tp-spinner tp-spinner-sm" /> Marcando...</>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Marcar todas como lidas
                    </>
                  )}
                </button>
              )}
              <Link
                href={dbUser.role === "PROVIDER" ? `/colaborador/${dbUser.id}/perfil` : `/users/${dbUser.id}/profile`}
                className="nf-back-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                {dbUser.role === "PROVIDER" ? "Dashboard" : "Perfil"}
              </Link>
            </div>
          </div>

          {/* LISTA */}
          {list.length === 0 ? (
            <div className="nf-empty">
              <div className="nf-empty-icon">🔕</div>
              <p className="nf-empty-title">Nenhuma notificação</p>
              <p className="nf-empty-desc">
                As notificações aparecem quando há<br />atividade nos seus agendamentos.
              </p>
              <Link href="/home" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fd5b01", color: "#fff", textDecoration: "none",
                padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 20px rgba(253,91,1,0.35)",
              }}>
                Explorar prestadores →
              </Link>
            </div>
          ) : (
            <>
              {/* Não lidas */}
              {unreadList.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div className="nf-group-label">
                    Não lidas
                    <span className="nf-group-count">{unreadList.length}</span>
                  </div>
                  {unreadList.map((n, i) => (
                    <NotifCard key={n.id} notif={n} onRead={id => markAsRead.mutate(id)} index={i} />
                  ))}
                </div>
              )}

              {/* Lidas */}
              {read.length > 0 && (
                <div>
                  <div className="nf-group-label" style={{ color: "var(--t4)" }}>
                    Lidas
                    <span className="nf-group-count">{read.length}</span>
                  </div>
                  {read.map((n, i) => (
                    <NotifCard key={n.id} notif={n} onRead={() => {}} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
