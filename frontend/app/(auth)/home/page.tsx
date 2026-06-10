"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useHomeProviders } from "@/hooks/useProviders";
import type { ProviderCard } from "@/services/providers.service";

// ── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10"
          fill={i <= Math.round(rating) ? "#fd5b01" : "#333"}>
          <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
        </svg>
      ))}
      <span style={{ color: "#777", fontSize: 11, marginLeft: 3 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Provider Card ──────────────────────────────────────────────────────────────

function ProviderCard({ provider, rank }: { provider: ProviderCard; rank?: number }) {
  return (
    <Link href={`/providers/${provider.id}`} className="hm-card">
      <div className="hm-card__thumb">
        <Image
          src={provider.avatarUrl}
          fill alt={provider.name}
          className="hm-card__img"
          sizes="(max-width:600px) 200px, 260px"
        />
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

// ── Section ────────────────────────────────────────────────────────────────────

function Section({
  title, providers, accent = "#fd5b01",
}: { title: string; providers: ProviderCard[]; accent?: string }) {
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
      <div className="sk" style={{ width: "100%", height: "clamp(320px,46vw,500px)", borderRadius: 0 }} />
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
                    <div className="sk" style={{ width: "100%", height: 124, borderRadius: "12px 12px 0 0" }} />
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
        /* ── PAGE WRAPPER ── */
        .hm-page {
          width: 100%;
          background: var(--bg, #0d0d0d);
          min-height: 100vh;
          font-family: var(--font, 'Sora', sans-serif);
          color: #fff;
          padding-bottom: 64px;
        }

        /* ── CENTERED CONTAINER ── */
        .hm-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: max(20px, 4%);
          padding-right: max(20px, 4%);
          box-sizing: border-box;
        }

        /* ── HERO ── */
        .hm-hero {
          position: relative;
          width: 100%;
          height: clamp(360px, 46vw, 520px);
          overflow: hidden;
          /* image bleeds under fixed navbar — intentional */
        }
        .hm-hero__bg {
          position: absolute;
          inset: 0;
        }
        .hm-hero__img {
          object-fit: cover;
          object-position: center 20%;
          filter: brightness(0.65) saturate(1.05) blur(1px);
          transition: opacity 0.45s ease;
        }
        .hm-hero__img--fading { opacity: 0; }
        .hm-hero__overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.40) 42%, transparent 68%),
            linear-gradient(to top,   rgba(13,13,13,0.90) 0%, transparent 48%);
        }
        /* Hero text area — uses same max-width as rest of page */
        .hm-hero__body {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding-bottom: 5%;
        }
        .hm-hero__badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fd5b01; color: #fff;
          font-size: 11px; font-weight: 700;
          padding: 5px 14px; border-radius: 4px;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 14px;
          box-shadow: 0 2px 12px rgba(253,91,1,0.4);
        }
        .hm-hero__name {
          font-size: clamp(28px, 4vw, 52px);
          font-weight: 800; line-height: 1.06;
          letter-spacing: -0.035em; color: #fff;
          margin: 0 0 14px; max-width: 480px;
          text-shadow: 0 2px 24px rgba(0,0,0,0.5);
          transition: opacity 0.45s ease;
        }
        .hm-hero__name--fading { opacity: 0; }
        .hm-hero__meta {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .hm-hero__rating {
          display: inline-flex; align-items: center; gap: 6px;
          color: #fd5b01; font-weight: 800; font-size: 14px;
        }
        .hm-hero__price {
          color: #fff; font-size: 13px; font-weight: 600;
          background: rgba(255,255,255,0.14);
          padding: 5px 13px; border-radius: 8px;
          backdrop-filter: blur(4px);
        }
        .hm-hero__cta {
          display: inline-flex; align-items: center; gap: 9px;
          background: #fd5b01; color: #fff;
          font-family: var(--font, 'Sora', sans-serif);
          font-size: 14px; font-weight: 700;
          padding: 12px 26px; border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(253,91,1,0.45);
        }
        .hm-hero__cta:hover {
          background: #e04e00;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(253,91,1,0.5);
        }
        .hm-hero__dots {
          position: absolute;
          /* keep dots above the -44px body overlap zone */
          bottom: calc(44px + 20px);
          right: max(20px, 4%);
          display: flex; gap: 8px; align-items: center;
          z-index: 3;
        }
        .hm-hero__dot {
          border: none; padding: 0; cursor: pointer;
          border-radius: 4px; height: 4px;
          transition: background 0.3s, width 0.3s;
        }
        .hm-hero__dot         { width: 20px; background: rgba(255,255,255,0.25); }
        .hm-hero__dot--active { width: 32px; background: #fd5b01; }

        /* ── MAIN BODY ── */
        .hm-body {
          width: 100%;
          margin-top: -44px;
          position: relative;
          z-index: 2;
          padding-bottom: 24px;
        }

        /* ── SECTION ── */
        .hm-section { margin-bottom: 48px; }
        .hm-section__head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          /* NO flex:1 line here — the line is inside and bounded by this container */
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

        /* ── HORIZONTAL SCROLL ROW ── */
        .hm-scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 12px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .hm-scroll::-webkit-scrollbar { height: 3px; }
        .hm-scroll::-webkit-scrollbar-thumb { background: rgba(253,91,1,0.45); border-radius: 3px; }
        .hm-scroll::-webkit-scrollbar-track { background: transparent; }

        /* ── CARD ── */
        .hm-card {
          flex-shrink: 0;
          width: 220px;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          background: #1a1a1a;
          scroll-snap-align: start;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          display: block;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .hm-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(253,91,1,0.2);
        }
        .hm-card__thumb {
          position: relative;
          width: 100%;
          padding-top: 62%;
          background: #111;
          overflow: hidden;
        }
        .hm-card__img {
          object-fit: cover;
          object-position: center top;
          transition: transform 0.5s ease;
        }
        .hm-card:hover .hm-card__img { transform: scale(1.06); }
        .hm-card__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 58%);
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
          position: absolute; bottom: 38px; left: 8px;
          font-size: 46px; font-weight: 800;
          color: rgba(255,255,255,0.08); line-height: 1;
          font-family: var(--font, 'Sora', sans-serif);
          pointer-events: none; user-select: none;
          text-shadow: -2px 0 0 rgba(253,91,1,0.18);
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

        /* ── EMPTY STATE ── */
        .hm-empty {
          text-align: center; padding: 5rem 1rem;
          color: #666;
          font-family: var(--font, 'Sora', sans-serif);
          animation: tp-fadeUp 0.4s ease both;
        }
        .hm-empty__icon  { font-size: 56px; margin-bottom: 16px; opacity: 0.5; }
        .hm-empty__title { font-size: 18px; font-weight: 700; color: #aaa; margin-bottom: 8px; }
        .hm-empty__desc  { font-size: 14px; color: #666; line-height: 1.6; }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .hm-hero { height: clamp(280px, 82vw, 400px); }
          .hm-body { margin-top: -28px; }
          .hm-card { width: 180px; }
          .hm-section { margin-bottom: 36px; }
        }
        @media (max-width: 390px) {
          .hm-hero { height: clamp(260px, 88vw, 360px); }
          .hm-card { width: 160px; }
          .hm-hero__name { font-size: 26px; }
        }
      `}</style>

      <div className="hm-page">

        {/* ── HERO ── */}
        {hero && (
          <div className="hm-hero">
            <div className="hm-hero__bg">
              <Image
                src={hero.avatarUrl}
                fill alt={hero.name}
                className={`hm-hero__img${heroFading ? " hm-hero__img--fading" : ""}`}
                priority sizes="100vw"
              />
            </div>
            <div className="hm-hero__overlay" />

            {/* Text content — aligned with .hm-container */}
            <div className="hm-hero__body">
              <div className="hm-container">
                <div className="hm-hero__badge">🔥 Destaque da semana</div>
                <h1 className={`hm-hero__name${heroFading ? " hm-hero__name--fading" : ""}`}>
                  {hero.name}
                </h1>
                <div className="hm-hero__meta">
                  <span className="hm-hero__rating">
                    <svg width="14" height="14" viewBox="0 0 10 10" fill="#fd5b01">
                      <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
                    </svg>
                    {hero.rating.toFixed(1)}
                  </span>
                  <span className="hm-hero__price">R$ {Number(hero.price).toFixed(2)} / sessão</span>
                </div>
                <Link href={`/providers/${hero.id}`} className="hm-hero__cta">
                  Ver perfil
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Dots */}
            <div className="hm-hero__dots">
              {topProviders.map((_, i) => (
                <button
                  key={i}
                  className={`hm-hero__dot${i === heroIndex ? " hm-hero__dot--active" : ""}`}
                  onClick={() => {
                    setHeroFading(true);
                    setTimeout(() => { setHeroIndex(i); setHeroFading(false); }, 400);
                  }}
                  aria-label={`Destaque ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="hm-body">
          <div className="hm-container">

            {/* TOP PRESTADORES */}
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

            {/* CATEGORIAS */}
            {categories.map((cat, ci) => (
              <Section
                key={cat.name}
                title={cat.name}
                providers={cat.providers}
                accent={ci % 2 === 0 ? "#fd5b01" : "#a78bfa"}
              />
            ))}

            {/* EMPTY STATE */}
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
