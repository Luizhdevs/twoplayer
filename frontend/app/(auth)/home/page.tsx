"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useHomeProviders } from "@/hooks/useProviders";
import type { ProviderCard } from "@/services/providers.service";

// ── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 10 10"
          fill={i <= Math.round(rating) ? "#fd5b01" : "#2e2e2e"}>
          <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
        </svg>
      ))}
      <span style={{ color: "#777", fontSize: size - 1, marginLeft: 3 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Provider Card (grid) ───────────────────────────────────────────────────────

function ProviderCard({ provider, rank }: { provider: ProviderCard; rank?: number }) {
  return (
    <Link href={`/providers/${provider.id}`} className="hm-card">
      <div className="hm-card__thumb">
        <Image src={provider.avatarUrl} fill alt={provider.name}
          className="hm-card__img" sizes="(max-width:600px) 200px, 260px" />
        <div className="hm-card__overlay" />
        <span className="hm-card__price">R$ {Number(provider.price).toFixed(2)}</span>
        {rank != null && <span className="hm-card__rank">{rank}</span>}
      </div>
      <div className="hm-card__info">
        <p className="hm-card__name">{provider.name}</p>
        <StarRating rating={provider.rating} />
      </div>
    </Link>
  );
}

// ── Section Row ────────────────────────────────────────────────────────────────

function Section({ title, providers, accent = "#fd5b01" }:
  { title: string; providers: ProviderCard[]; accent?: string }) {
  return (
    <section className="hm-section anim-fadeUp">
      <div className="hm-section__head">
        <span className="hm-section__bar" style={{ background: accent }} />
        <h2 className="hm-section__title">{title}</h2>
        <span className="hm-section__line" />
      </div>
      <div className="hm-scroll">
        {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
      </div>
    </section>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function HomeSkeleton() {
  return (
    <div className="hm-page">
      {/* hero skeleton */}
      <div style={{ width: "100%", background: "#111", borderBottom: "1px solid #1f1f1f" }}>
        <div className="hm-container" style={{ display: "flex", alignItems: "center",
          gap: 40, padding: "80px max(20px,4%) 56px" }}>
          <div style={{ flex: 1 }}>
            <div className="sk sk-pill" style={{ width: 140, height: 24, marginBottom: 20 }} />
            <div className="sk sk-h28" style={{ width: "70%", marginBottom: 12, borderRadius: 8 }} />
            <div className="sk sk-h16" style={{ width: "40%", marginBottom: 28, borderRadius: 6 }} />
            <div className="sk" style={{ width: 130, height: 44, borderRadius: 10 }} />
          </div>
          <div className="sk" style={{ width: 300, height: 300, borderRadius: 20, flexShrink: 0 }} />
        </div>
      </div>
      {/* sections skeleton */}
      <div className="hm-body">
        <div className="hm-container">
          {[1, 2].map((s) => (
            <div key={s} style={{ marginBottom: 44 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div className="sk" style={{ width: 4, height: 22, borderRadius: 2, flexShrink: 0 }} />
                <div className="sk sk-h16" style={{ width: 160, borderRadius: 6 }} />
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[1, 2, 3, 4].map((c) => (
                  <div key={c} style={{ flexShrink: 0, width: 220, borderRadius: 12, overflow: "hidden" }}>
                    <div className="sk" style={{ width: "100%", height: 132, borderRadius: "12px 12px 0 0" }} />
                    <div style={{ padding: "10px 12px 13px", background: "#1a1a1a", borderRadius: "0 0 12px 12px" }}>
                      <div className="sk sk-h13" style={{ width: "75%", marginBottom: 8, borderRadius: 5 }} />
                      <div className="sk sk-h10" style={{ width: "55%", borderRadius: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useHomeProviders();
  const [heroIndex,  setHeroIndex]  = useState(0);
  const [heroFading, setHeroFading] = useState(false);

  useEffect(() => {
    if (!authLoading && dbUser?.role === "PROVIDER") {
      router.replace(`/colaborador/${dbUser.id}/perfil`);
    }
  }, [authLoading, dbUser, router]);

  const topProviders = data?.topProviders ?? [];
  const categories   = data?.categories   ?? [];

  const advance = useCallback(() => {
    if (!topProviders.length) return;
    setHeroFading(true);
    setTimeout(() => {
      setHeroIndex((i) => (i + 1) % topProviders.length);
      setHeroFading(false);
    }, 400);
  }, [topProviders.length]);

  useEffect(() => {
    if (!topProviders.length) return;
    const id = setInterval(advance, 5500);
    return () => clearInterval(id);
  }, [advance, topProviders.length]);

  const hero = topProviders[heroIndex] ?? null;

  if (authLoading) return <HomeSkeleton />;
  if (dbUser?.role === "PROVIDER") return null;
  if (isLoading) return <HomeSkeleton />;

  return (
    <>
      <style>{`
        /* ═══════════ RESET & PAGE ═══════════ */
        .hm-page {
          width: 100%;
          background: var(--bg, #0d0d0d);
          min-height: 100vh;
          font-family: var(--font, 'Sora', sans-serif);
          color: #fff;
          padding-bottom: 64px;
        }

        /* ═══════════ SHARED CONTAINER ═══════════ */
        .hm-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: max(20px, 4%);
          padding-right: max(20px, 4%);
          box-sizing: border-box;
        }

        /* ═══════════ HERO SECTION ═══════════ */
        .hm-hero {
          position: relative;
          width: 100%;
          background: #0d0d0d;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }

        /* Ambient glow — subtle brand color in background */
        .hm-hero::before {
          content: '';
          position: absolute;
          top: -40%; right: -10%;
          width: 70%; height: 160%;
          background: radial-gradient(ellipse,
            rgba(253,91,1,0.11) 0%,
            rgba(253,91,1,0.04) 40%,
            transparent 65%);
          pointer-events: none;
        }
        .hm-hero::after {
          content: '';
          position: absolute;
          top: 20%; left: -5%;
          width: 40%; height: 100%;
          background: radial-gradient(ellipse,
            rgba(167,139,250,0.06) 0%, transparent 60%);
          pointer-events: none;
        }

        /* inner split layout */
        .hm-hero__inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          padding: 80px 0 56px;
        }

        /* ── LEFT: text content ── */
        .hm-hero__left {
          flex: 1;
          min-width: 0;
        }

        .hm-hero__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(253,91,1,0.12);
          border: 1px solid rgba(253,91,1,0.30);
          color: #fd5b01;
          font-size: 11px; font-weight: 700;
          padding: 5px 14px; border-radius: 100px;
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: 20px;
        }
        .hm-hero__eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fd5b01;
          animation: hm-pulse 2s ease infinite;
        }
        @keyframes hm-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        .hm-hero__name {
          font-size: clamp(32px, 3.8vw, 56px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -0.04em; color: #fff;
          margin: 0 0 16px;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .hm-hero__name--fading {
          opacity: 0; transform: translateY(6px);
        }

        .hm-hero__meta {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .hm-hero__rating {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(253,91,1,0.10);
          border: 1px solid rgba(253,91,1,0.20);
          color: #fd5b01; font-weight: 800; font-size: 13px;
          padding: 5px 12px; border-radius: 8px;
        }
        .hm-hero__price {
          color: #ccc; font-size: 13px; font-weight: 500;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          padding: 5px 13px; border-radius: 8px;
        }

        .hm-hero__cta {
          display: inline-flex; align-items: center; gap: 9px;
          background: #fd5b01; color: #fff;
          font-family: var(--font, 'Sora', sans-serif);
          font-size: 14px; font-weight: 700;
          padding: 13px 28px; border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(253,91,1,0.40);
        }
        .hm-hero__cta:hover {
          background: #e04e00;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(253,91,1,0.50);
        }

        /* Carousel dots — inside left content, below CTA */
        .hm-hero__dots {
          display: flex; gap: 8px; align-items: center;
          margin-top: 24px;
        }
        .hm-hero__dot {
          border: none; padding: 0; cursor: pointer;
          border-radius: 4px; height: 4px;
          transition: background 0.3s, width 0.3s;
        }
        .hm-hero__dot          { width: 20px; background: rgba(255,255,255,0.18); }
        .hm-hero__dot--active  { width: 32px; background: #fd5b01; }

        /* ── RIGHT: provider card ── */
        .hm-hero__right {
          flex-shrink: 0;
          width: clamp(240px, 26vw, 320px);
        }

        /* ── Hero provider profile card ── */
        .hm-hero__pcard-link { text-decoration: none; display: block; }

        /* wrapper que define o contexto de posicionamento */
        .hm-hero__pcard-outer {
          position: relative;
          padding-top: 48px; /* espaço para a metade superior do avatar */
        }

        /* faixa de cover borrada no topo do outer */
        .hm-hero__pcard__cover {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 80px;
          border-radius: 20px 20px 0 0;
          overflow: hidden;
          z-index: 0;
        }
        .hm-hero__pcard__cover-img {
          object-fit: cover;
          object-position: center 30%;
          filter: brightness(0.38) blur(3px) saturate(1.2);
        }
        .hm-hero__pcard__cover-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom,
            rgba(20,20,20,0) 0%,
            rgba(20,20,20,0.85) 100%);
        }

        /* avatar circular — centralizado, metade acima do card */
        .hm-hero__pcard__avatar-wrap {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          width: 96px; height: 96px;
          border-radius: 50%;
          border: 3px solid #fd5b01;
          box-shadow: 0 0 0 4px rgba(20,20,20,0.95),
                      0 8px 24px rgba(0,0,0,0.6),
                      0 0 20px rgba(253,91,1,0.25);
          overflow: hidden;
          background: #111;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hm-hero__pcard-link:hover .hm-hero__pcard__avatar-wrap {
          transform: translateX(-50%) scale(1.07);
          box-shadow: 0 0 0 4px rgba(20,20,20,0.95),
                      0 12px 32px rgba(0,0,0,0.7),
                      0 0 28px rgba(253,91,1,0.40);
        }
        .hm-hero__pcard__avatar-img {
          object-fit: cover;
          object-position: center top;
        }

        /* card principal */
        .hm-hero__pcard {
          position: relative; z-index: 1;
          background: #141414;
          border: 1px solid rgba(253,91,1,0.18);
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04),
            0 24px 60px rgba(0,0,0,0.55),
            0 0 60px rgba(253,91,1,0.07);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .hm-hero__pcard--fading {
          opacity: 0; transform: scale(0.96) translateY(8px);
        }

        /* corpo de texto do card */
        .hm-hero__pcard__body {
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          padding: 52px 20px 24px; /* 52px = espaço para a metade inferior do avatar */
          text-align: center;
        }
        .hm-hero__pcard__name {
          font-size: 17px; font-weight: 800; color: #f0f0f0;
          margin: 0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
          letter-spacing: -0.02em;
        }
        .hm-hero__pcard__badge {
          font-size: 13px; font-weight: 800; color: #fd5b01;
          background: rgba(253,91,1,0.10);
          border: 1px solid rgba(253,91,1,0.25);
          padding: 5px 16px; border-radius: 8px;
          white-space: nowrap;
        }

        /* ═══════════ MAIN BODY ═══════════ */
        .hm-body {
          width: 100%;
          padding-top: 52px;
          padding-bottom: 24px;
        }

        /* ═══════════ SECTION ═══════════ */
        .hm-section { margin-bottom: 48px; }
        .hm-section__head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px;
        }
        .hm-section__bar   { width: 4px; height: 20px; border-radius: 2px; flex-shrink: 0; }
        .hm-section__title {
          font-size: 15px; font-weight: 800;
          letter-spacing: -0.01em; color: #fff;
          margin: 0; white-space: nowrap; flex-shrink: 0;
        }
        .hm-section__line  {
          flex: 1; height: 1px;
          background: rgba(255,255,255,0.06);
          min-width: 16px;
        }
        .hm-see-all {
          flex-shrink: 0;
          font-size: 12px; font-weight: 700;
          color: #fd5b01; text-decoration: none;
          white-space: nowrap;
          font-family: var(--font, 'Sora', sans-serif);
          padding: 5px 14px; border-radius: 20px;
          border: 1px solid rgba(253,91,1,0.35);
          background: rgba(253,91,1,0.09);
          transition: background 0.2s, border-color 0.2s;
          line-height: 1;
        }
        .hm-see-all:hover {
          background: rgba(253,91,1,0.18);
          border-color: rgba(253,91,1,0.55);
        }

        /* ═══════════ SCROLL ROW ═══════════ */
        .hm-scroll {
          display: flex; gap: 14px; overflow-x: auto;
          padding-bottom: 12px; scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .hm-scroll::-webkit-scrollbar { height: 3px; }
        .hm-scroll::-webkit-scrollbar-thumb { background: rgba(253,91,1,0.4); border-radius: 3px; }
        .hm-scroll::-webkit-scrollbar-track { background: transparent; }

        /* ═══════════ PROVIDER CARD ═══════════ */
        .hm-card {
          flex-shrink: 0; width: 220px;
          border-radius: 14px; overflow: hidden;
          text-decoration: none; background: #1a1a1a;
          scroll-snap-align: start;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          border: 1px solid rgba(255,255,255,0.07);
          display: block;
        }
        .hm-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.5),
                      0 0 0 1px rgba(253,91,1,0.18);
        }
        .hm-card__thumb {
          position: relative; width: 100%; padding-top: 62%;
          background: #111; overflow: hidden;
        }
        .hm-card__img {
          object-fit: cover; object-position: center top;
          transition: transform 0.5s ease;
        }
        .hm-card:hover .hm-card__img { transform: scale(1.06); }
        .hm-card__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 55%);
        }
        .hm-card__price {
          position: absolute; top: 8px; right: 8px;
          background: rgba(13,13,13,0.88);
          border: 1px solid rgba(253,91,1,0.35);
          color: #fd5b01; font-size: 11px; font-weight: 800;
          padding: 4px 9px; border-radius: 6px;
          backdrop-filter: blur(6px);
          font-family: var(--font, 'Sora', sans-serif);
        }
        .hm-card__rank {
          position: absolute; bottom: 36px; left: 8px;
          font-size: 44px; font-weight: 800;
          color: rgba(255,255,255,0.08); line-height: 1;
          font-family: var(--font, 'Sora', sans-serif);
          pointer-events: none; user-select: none;
          text-shadow: -2px 0 0 rgba(253,91,1,0.15);
        }
        .hm-card__info {
          padding: 10px 12px 13px;
          display: flex; flex-direction: column; gap: 6px;
          background: #1a1a1a;
        }
        .hm-card__name {
          font-size: 13px; font-weight: 700; color: #f0f0f0;
          margin: 0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        /* ═══════════ EMPTY STATE ═══════════ */
        .hm-empty {
          text-align: center; padding: 5rem 1rem; color: #666;
          font-family: var(--font, 'Sora', sans-serif);
          animation: tp-fadeUp 0.4s ease both;
        }
        .hm-empty__icon  { font-size: 56px; margin-bottom: 16px; opacity: 0.4; }
        .hm-empty__title { font-size: 18px; font-weight: 700; color: #aaa; margin-bottom: 8px; }
        .hm-empty__desc  { font-size: 14px; color: #666; line-height: 1.6; }

        /* ═══════════ RESPONSIVE ═══════════ */
        @media (max-width: 860px) {
          .hm-hero__right { width: clamp(200px, 28vw, 260px); }
        }
        @media (max-width: 640px) {
          .hm-hero__inner { flex-direction: column-reverse; gap: 28px; padding: 64px 0 40px; }
          .hm-hero__right { width: 100%; max-width: 260px; margin: 0 auto; }
          .hm-hero__left  { width: 100%; }
          .hm-hero__name  { font-size: clamp(28px, 8vw, 40px); }
          .hm-body { padding-top: 36px; }
          .hm-card { width: 190px; }
        }
        @media (max-width: 400px) {
          .hm-hero__right { max-width: 220px; }
          .hm-card { width: 168px; }
        }
      `}</style>

      <div className="hm-page">

        {/* ═══════════ HERO ═══════════ */}
        {hero && (
          <div className="hm-hero">
            <div className="hm-container">
              <div className="hm-hero__inner">

                {/* LEFT — text */}
                <div className="hm-hero__left">
                  <div className="hm-hero__eyebrow">
                    <span className="hm-hero__eyebrow-dot" />
                    Destaque da semana
                  </div>

                  <h1 className={`hm-hero__name${heroFading ? " hm-hero__name--fading" : ""}`}>
                    {hero.name}
                  </h1>

                  <div className="hm-hero__meta">
                    <span className="hm-hero__rating">
                      <svg width="13" height="13" viewBox="0 0 10 10" fill="#fd5b01">
                        <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
                      </svg>
                      {hero.rating.toFixed(1)}
                    </span>
                    <span className="hm-hero__price">
                      R$ {Number(hero.price).toFixed(2)} / sessão
                    </span>
                  </div>

                  <Link href={`/providers/${hero.id}`} className="hm-hero__cta">
                    Ver perfil
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>

                  {/* carousel dots */}
                  {topProviders.length > 1 && (
                    <div className="hm-hero__dots">
                      {topProviders.map((_, i) => (
                        <button
                          key={i}
                          className={`hm-hero__dot${i === heroIndex ? " hm-hero__dot--active" : ""}`}
                          onClick={() => {
                            setHeroFading(true);
                            setTimeout(() => { setHeroIndex(i); setHeroFading(false); }, 350);
                          }}
                          aria-label={`Prestador ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT — provider card */}
                <div className="hm-hero__right">
                  <Link href={`/providers/${hero.id}`} className="hm-hero__pcard-link">
                    {/* outer: deixa espaço no topo para o avatar sobresair */}
                    <div className="hm-hero__pcard-outer">
                      {/* faixa de cover borrada no topo */}
                      <div className="hm-hero__pcard__cover" aria-hidden="true">
                        <Image src={hero.avatarUrl} fill alt="" className="hm-hero__pcard__cover-img" sizes="320px" />
                        <div className="hm-hero__pcard__cover-grad" />
                      </div>
                      {/* avatar circular */}
                      <div className="hm-hero__pcard__avatar-wrap">
                        <Image src={hero.avatarUrl} fill alt={hero.name} className="hm-hero__pcard__avatar-img" sizes="96px" priority />
                      </div>
                      {/* card body */}
                      <div className={`hm-hero__pcard${heroFading ? " hm-hero__pcard--fading" : ""}`}>
                        <div className="hm-hero__pcard__body">
                          <p className="hm-hero__pcard__name">{hero.name}</p>
                          <span className="hm-hero__pcard__badge">R$ {Number(hero.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SECTIONS ═══════════ */}
        <div className="hm-body">
          <div className="hm-container">

            {topProviders.length > 0 && (
              <section className="hm-section anim-fadeUp">
                <div className="hm-section__head">
                  <span className="hm-section__bar" style={{ background: "#fd5b01" }} />
                  <h2 className="hm-section__title">🔥 Top Prestadores</h2>
                  <span className="hm-section__line" />
                  <Link href="/feed" className="hm-see-all">Ver todos →</Link>
                </div>
                <div className="hm-scroll">
                  {topProviders.map((p, i) => (
                    <ProviderCard key={p.id} provider={p} rank={i + 1} />
                  ))}
                </div>
              </section>
            )}

            {categories.map((cat, ci) => (
              <Section
                key={cat.name}
                title={cat.name}
                providers={cat.providers}
                accent={ci % 2 === 0 ? "#fd5b01" : "#a78bfa"}
              />
            ))}

            {topProviders.length === 0 && (
              <div className="hm-empty">
                <div className="hm-empty__icon">🎮</div>
                <p className="hm-empty__title">Nenhum prestador disponível</p>
                <p className="hm-empty__desc">Ainda não há prestadores cadastrados.<br />Volte em breve!</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
