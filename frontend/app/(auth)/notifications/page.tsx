"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import type { Notification } from "@/services/notifications.service";

const TYPE_CONFIG: Record<Notification["type"], { icon: string; color: string }> = {
  APPOINTMENT: { icon: "📅", color: "#fd5b01" },
  REVIEW:      { icon: "⭐", color: "#f59e0b" },
  WALLET:      { icon: "👛", color: "#4ade80" },
  SYSTEM:      { icon: "🔔", color: "#a78bfa" },
};

function NotifCard({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const cfg  = TYPE_CONFIG[notif.type] ?? { icon: "🔔", color: "#aaa" };
  const isRead = !!notif.readAt;
  const date = new Date(notif.createdAt).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      onClick={() => !isRead && onRead(notif.id)}
      style={{
        display: "flex", gap: 14, padding: "1rem 1.25rem",
        background: isRead ? "rgba(255,255,255,0.02)" : "#1a1a1a",
        border: `1px solid ${isRead ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 14, marginBottom: 10,
        cursor: isRead ? "default" : "pointer",
        transition: "background 0.2s, border-color 0.2s",
        position: "relative",
      }}
    >
      {/* Dot não lido */}
      {!isRead && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.color,
        }} />
      )}

      {/* Ícone */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${cfg.color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>
        {cfg.icon}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: isRead ? 500 : 700, color: isRead ? "#888" : "#f0f0f0", marginBottom: 4, lineHeight: 1.4 }}>
          {notif.title}
        </p>
        {notif.body && (
          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, marginBottom: 4 }}>{notif.body}</p>
        )}
        <p style={{ fontSize: 11, color: "#444" }}>{date}</p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { data: notifications, isLoading, isError, refetch } = useNotifications(dbUser?.id ?? "");
  const markAsRead    = useMarkAsRead(dbUser?.id ?? "");
  const markAllAsRead = useMarkAllAsRead(dbUser?.id ?? "");

  if (authLoading || isLoading) return (
    <div style={{ background:"#0d0d0d", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'Sora',sans-serif" }}>
      <style>{`@keyframes nf-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #333", borderTopColor:"#fd5b01", animation:"nf-spin 0.8s linear infinite" }} />
      <span style={{ color:"#555", fontSize:13 }}>Carregando notificações...</span>
    </div>
  );

  if (!dbUser) return (
    <div style={{ background:"#0d0d0d", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora',sans-serif" }}>
      <p style={{ color:"#aaa" }}>Faça login para ver suas notificações.</p>
    </div>
  );

  if (isError) return (
    <div style={{ background:"#0d0d0d", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, fontFamily:"'Sora',sans-serif" }}>
      <p style={{ color:"#f87171" }}>Erro ao carregar notificações.</p>
      <button onClick={() => refetch()} style={{ padding:"10px 20px", background:"#fd5b01", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'Sora',sans-serif", fontWeight:700 }}>
        Tentar novamente
      </button>
    </div>
  );

  const list   = notifications ?? [];
  const unread = list.filter(n => !n.readAt).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .nf * { font-family:'Sora',sans-serif; box-sizing:border-box; }
      `}</style>
      <div className="nf" style={{ background:"#0d0d0d", minHeight:"100vh", padding:"5rem 1.5rem 3rem" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:12 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:4 }}>
                Notificações
              </h1>
              <p style={{ fontSize:13, color:"#555" }}>
                {unread > 0 ? `${unread} não lida${unread > 1 ? "s" : ""}` : "Tudo lido"}
              </p>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {unread > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  style={{ padding:"9px 16px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#aaa", fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                >
                  {markAllAsRead.isPending ? "Marcando..." : "✓ Marcar todas como lidas"}
                </button>
              )}
              <Link href={`/users/${dbUser.id}/profile`} style={{ padding:"9px 16px", background:"rgba(253,91,1,0.1)", border:"1px solid rgba(253,91,1,0.2)", borderRadius:9, color:"#fd5b01", textDecoration:"none", fontSize:12, fontWeight:600 }}>
                ← Perfil
              </Link>
            </div>
          </div>

          {/* Lista */}
          {list.length === 0 ? (
            <div style={{ textAlign:"center", padding:"5rem 0" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🔔</div>
              <p style={{ fontSize:16, color:"#555", fontWeight:600, marginBottom:8 }}>Nenhuma notificação ainda</p>
              <p style={{ fontSize:13, color:"#444", marginBottom:24 }}>As notificações aparecem quando há atividade nos seus agendamentos.</p>
              <Link href="/home" style={{ color:"#fd5b01", textDecoration:"none", fontSize:13, fontWeight:600 }}>
                Explorar prestadores →
              </Link>
            </div>
          ) : (
            <>
              {/* Não lidas */}
              {unread > 0 && (
                <div style={{ marginBottom:24 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#666", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                    Não lidas ({unread})
                  </p>
                  {list.filter(n => !n.readAt).map(n => (
                    <NotifCard key={n.id} notif={n} onRead={id => markAsRead.mutate(id)} />
                  ))}
                </div>
              )}

              {/* Lidas */}
              {list.filter(n => !!n.readAt).length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"#444", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                    Lidas
                  </p>
                  {list.filter(n => !!n.readAt).map(n => (
                    <NotifCard key={n.id} notif={n} onRead={() => {}} />
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
