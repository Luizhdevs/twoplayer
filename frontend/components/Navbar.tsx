"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function Navbar() {
  const { dbUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setProviderId(localStorage.getItem("tp_provider_id"));
  }, [dbUser]);

  const profileHref = dbUser
    ? providerId
      ? `/colaborador/${providerId}/perfil`
      : `/users/${dbUser.id}/profile`
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        .tp-navbar * { font-family: 'Sora', sans-serif; box-sizing: border-box; }
        .tp-nav-link {
          font-size: 13px; font-weight: 500;
          text-decoration: none; padding: 7px 14px; border-radius: 8px;
          color: rgba(255,255,255,0.8);
          transition: background 0.2s, color 0.2s;
        }
        .tp-nav-link:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .tp-nav-disabled {
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.3);
          padding: 7px 14px; border-radius: 8px; cursor: not-allowed;
        }
      `}</style>

      <div
        className="tp-navbar"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? "rgba(13,13,13,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.5)" : "none",
          transition: "background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
        }}>
          {/* LOGO */}
          <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/logo.png" width={36} height={36} alt="TwoPlayers" />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
              Two<span style={{ color: "#fd5b01" }}>Players</span>
            </span>
          </Link>

          {/* LINKS */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/home" className="tp-nav-link">Home</Link>
            {dbUser && (
              <Link href="/appointments" className="tp-nav-link">Agendamentos</Link>
            )}
            {profileHref
              ? <Link href={profileHref} className="tp-nav-link">Meu Perfil</Link>
              : <span className="tp-nav-disabled">Meu Perfil</span>
            }
          </div>
        </div>
      </div>
    </>
  );
}
