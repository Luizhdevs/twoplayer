"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useUnreadCount } from "@/hooks/useNotifications";

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6" y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { dbUser } = useAuth();
  const pathname   = usePathname();
  const [scrolled,    setScrolled]    = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const { data: unreadData } = useUnreadCount(dbUser?.id ?? "");
  const unread = unreadData?.unread ?? 0;

  const isProvider   = dbUser?.role === "PROVIDER";
  const profileHref  = dbUser
    ? isProvider
      ? `/colaborador/${dbUser.id}/perfil`
      : `/users/${dbUser.id}/profile`
    : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  }

  return (
    <>
      <style>{`
        .nb * { font-family: var(--font, 'Sora', sans-serif); box-sizing: border-box; }

        /* ── NAV BAR ── */
        .nb-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease;
        }
        .nb-bar.scrolled {
          background: rgba(13,13,13,0.94);
          backdrop-filter: blur(16px) saturate(1.4);
          -webkit-backdrop-filter: blur(16px) saturate(1.4);
          box-shadow: 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5);
        }
        .nb-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 64px;
        }

        /* ── LOGO ── */
        .nb-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nb-logo-text {
          font-size: 16px; font-weight: 800;
          letter-spacing: -0.04em; color: #fff;
        }
        .nb-logo-accent { color: #fd5b01; }

        /* ── DESKTOP LINKS ── */
        .nb-links {
          display: flex; align-items: center; gap: 2px;
        }
        .nb-link {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 500;
          text-decoration: none; padding: 8px 12px; border-radius: 10px;
          color: rgba(255,255,255,0.6);
          transition: background 0.18s, color 0.18s;
          position: relative; white-space: nowrap;
        }
        .nb-link:hover  { background: rgba(255,255,255,0.09); color: #fff; }
        .nb-link.active { background: rgba(253,91,1,0.12);    color: #fd5b01; }
        .nb-link.active svg { stroke: #fd5b01; }

        /* Badge de notificação */
        .nb-badge {
          position: absolute; top: 4px; right: 4px;
          background: #fd5b01; color: #fff;
          font-size: 9px; font-weight: 800; line-height: 1;
          min-width: 15px; height: 15px;
          border-radius: 8px; padding: 0 4px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #0d0d0d;
        }

        /* ── HAMBURGER (mobile only) ── */
        .nb-hamburger {
          display: none;
          align-items: center; justify-content: center;
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          cursor: pointer; color: #fff;
          transition: background 0.2s;
          position: relative;
        }
        .nb-hamburger:hover { background: rgba(255,255,255,0.12); }
        .nb-hamburger-badge {
          position: absolute; top: 2px; right: 2px;
          width: 9px; height: 9px; border-radius: 50%;
          background: #fd5b01; border: 1.5px solid #0d0d0d;
        }

        /* ── MOBILE DRAWER OVERLAY ── */
        .nb-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.70);
          z-index: 90;
          animation: tp-fadeIn 0.2s ease;
        }
        .nb-overlay.open { display: block; }

        /* ── MOBILE DRAWER ── */
        .nb-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw);
          background: #111;
          border-left: 1px solid rgba(255,255,255,0.08);
          z-index: 110;
          display: flex; flex-direction: column;
          padding: 20px 16px 32px;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: -8px 0 40px rgba(0,0,0,0.6);
        }
        .nb-drawer.open { transform: translateX(0); }

        .nb-drawer-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px;
        }
        .nb-drawer-close {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff;
          transition: background 0.2s;
        }
        .nb-drawer-close:hover { background: rgba(253,91,1,0.2); color: #fd5b01; }

        .nb-drawer-link {
          display: flex; align-items: center; gap: 14px;
          font-size: 15px; font-weight: 600;
          text-decoration: none;
          padding: 14px 16px;
          border-radius: 12px;
          color: rgba(255,255,255,0.7);
          transition: background 0.18s, color 0.18s;
          margin-bottom: 4px;
          position: relative;
        }
        .nb-drawer-link:hover  { background: rgba(255,255,255,0.07); color: #fff; }
        .nb-drawer-link.active { background: rgba(253,91,1,0.12); color: #fd5b01; }
        .nb-drawer-link.active svg { stroke: #fd5b01; }
        .nb-drawer-link-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.18s;
        }
        .nb-drawer-link.active .nb-drawer-link-icon { background: rgba(253,91,1,0.15); }
        .nb-drawer-notif-badge {
          margin-left: auto;
          background: #fd5b01; color: #fff;
          font-size: 10px; font-weight: 800;
          min-width: 18px; height: 18px;
          border-radius: 9px; padding: 0 5px;
          display: flex; align-items: center; justify-content: center;
        }

        .nb-drawer-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 8px 0 12px; }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .nb-links { display: none; }
          .nb-hamburger { display: flex; }
        }
        @media (min-width: 601px) {
          .nb-logo-text { display: block; }
        }

        /* pulse animation for unread dot */
        @keyframes nb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.15); }
        }
        .nb-pulse { animation: nb-pulse 2s ease infinite; }
      `}</style>

      {/* BACKDROP for drawer */}
      <div
        className={`nb-overlay${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* NAVBAR */}
      <nav className={`nb nb-bar${scrolled ? " scrolled" : ""}`}>
        <div className="nb-inner">
          {/* LOGO */}
          <Link href="/home" className="nb-logo">
            <Image src="/logo.png" width={34} height={34} alt="TwoPlayers" />
            <span className="nb-logo-text">
              Two<span className="nb-logo-accent">Players</span>
            </span>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="nb-links">
            <Link href="/home" className={`nb-link${isActive("/home") ? " active" : ""}`} aria-label="Home">
              <IconHome /><span>Home</span>
            </Link>

            {dbUser && isProvider && (
              <Link href={`/colaborador/${dbUser.id}/perfil`} className={`nb-link${isActive("/colaborador") ? " active" : ""}`} aria-label="Dashboard">
                <IconDashboard /><span>Dashboard</span>
              </Link>
            )}

            {dbUser && !isProvider && (
              <Link href="/appointments" className={`nb-link${isActive("/appointments") ? " active" : ""}`} aria-label="Agendamentos">
                <IconCalendar /><span>Agendamentos</span>
              </Link>
            )}

            {dbUser && (
              <Link href="/notifications" className={`nb-link${isActive("/notifications") ? " active" : ""}`} aria-label={unread > 0 ? `${unread} notificações` : "Notificações"}>
                <IconBell />
                <span>Notificações</span>
                {unread > 0 && (
                  <span className="nb-badge nb-pulse">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
            )}

            {profileHref
              ? <Link href={profileHref} className={`nb-link${isActive(profileHref) ? " active" : ""}`} aria-label="Perfil">
                  <IconUser /><span>Perfil</span>
                </Link>
              : <span className="nb-link" style={{ opacity: 0.3, cursor: "not-allowed" }} aria-label="Perfil">
                  <IconUser /><span>Perfil</span>
                </span>
            }
          </div>

          {/* MOBILE HAMBURGER */}
          <button
            className="nb-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <IconMenu />
            {unread > 0 && <span className="nb-hamburger-badge nb-pulse" />}
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`nb nb-drawer${drawerOpen ? " open" : ""}`}>
        <div className="nb-drawer-top">
          <Link href="/home" className="nb-logo" onClick={() => setDrawerOpen(false)}>
            <Image src="/logo.png" width={30} height={30} alt="TwoPlayers" />
            <span className="nb-logo-text">Two<span className="nb-logo-accent">Players</span></span>
          </Link>
          <button className="nb-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu">
            <IconX />
          </button>
        </div>

        {/* Drawer nav items */}
        <Link href="/home" className={`nb-drawer-link${isActive("/home") ? " active" : ""}`}>
          <div className="nb-drawer-link-icon"><IconHome /></div>
          Home
        </Link>

        {dbUser && isProvider && (
          <Link href={`/colaborador/${dbUser.id}/perfil`} className={`nb-drawer-link${isActive("/colaborador") ? " active" : ""}`}>
            <div className="nb-drawer-link-icon"><IconDashboard /></div>
            Dashboard
          </Link>
        )}

        {dbUser && !isProvider && (
          <Link href="/appointments" className={`nb-drawer-link${isActive("/appointments") ? " active" : ""}`}>
            <div className="nb-drawer-link-icon"><IconCalendar /></div>
            Agendamentos
          </Link>
        )}

        {dbUser && (
          <Link href="/notifications" className={`nb-drawer-link${isActive("/notifications") ? " active" : ""}`}>
            <div className="nb-drawer-link-icon"><IconBell /></div>
            Notificações
            {unread > 0 && <span className="nb-drawer-notif-badge">{unread > 9 ? "9+" : unread}</span>}
          </Link>
        )}

        <div className="nb-drawer-divider" />

        {profileHref
          ? <Link href={profileHref} className={`nb-drawer-link${isActive(profileHref) ? " active" : ""}`}>
              <div className="nb-drawer-link-icon"><IconUser /></div>
              {isProvider ? "Meu Perfil" : "Meu Perfil"}
            </Link>
          : null
        }
      </div>
    </>
  );
}
