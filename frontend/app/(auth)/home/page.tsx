"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useHomeProviders } from "@/hooks/useProviders";
import type { ProviderCard } from "@/services/providers.service";

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill={i <= Math.round(rating) ? "#fd5b01" : "#333"}>
          <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
        </svg>
      ))}
      <span style={{ color: "#777", fontSize: 11, marginLeft: 3 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function ProviderCard({ provider, featured = false }: { provider: ProviderCard; featured?: boolean }) {
  return (
    <Link
      href={`/providers/${provider.id}`}
      className={featured ? "tp-card tp-card--featured" : "tp-card"}
    >
      <div className="tp-card-thumb">
        <Image src={provider.avatarUrl} fill alt={provider.name} className="tp-card-img" sizes="(max-width:600px) 180px, 260px" />
        <div className="tp-card-overlay" />
        <div className="tp-card-price">R$ {Number(provider.price).toFixed(2)}</div>
      </div>
      <div className="tp-card-info">
        <p className="tp-card-name">{provider.name}</p>
        <StarRating rating={provider.rating} />
      </div>
    </Link>
  );
}

function SectionRow({ title, providers, accent = "#fd5b01" }: { title: string; providers: ProviderCard[]; accent?: string }) {
  return (
    <section className="tp-section anim-fadeUp">
      <div className="tp-section-header">
        <span className="tp-section-bar" style={{ background: accent }} />
        <h2 className="tp-section-title">{title}</h2>
        <span className="tp-section-line" />
      </div>
      <div className="tp-row">
        {providers.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>
    </section>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function HomeSkeleton() {
  return (
    <div className="tp-home">
      {/* Hero skeleton */}
      <div className="sk" style={{ width: "100%", height: "min(56vw, 520px)", minHeight: 280, borderRadius: 0 }} />

      <div className="tp-main">
        {[1, 2].map((s) => (
          <div key={s} style={{ marginBottom: 44 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div className="sk" style={{ width: 4, height: 22, borderRadius: 2, flexShrink: 0 }} />
              <div className="sk sk-h16" style={{ width: 160, borderRadius: 6 }} />
            </div>
            {/* Cards row */}
            <div style={{ display: "flex", gap: 12 }}>
              {[1, 2, 3, 4].map((c) => (
                <div key={c} style={{ flexShrink: 0, width: s === 1 ? 260 : 180, borderRadius: 10, overflow: "hidden" }}>
                  <div className="sk" style={{ width: "100%", height: s === 1 ? 146 : 101, borderRadius: "10px 10px 0 0" }} />
                  <div style={{ padding: "10px 10px 12px", background: "#1a1a1a", borderRadius: "0 0 10px 10px" }}>
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
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useHomeProviders();
  const [heroIndex,  setHeroIndex]  = useState(0);
  const [heroFading, setHeroFading] = useState(false);

  // Prestadores não acessam a home de clientes — vão direto ao dashboard
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

  // Bloqueia renderização até auth resolver — evita flash de conteúdo antes do redirect
  if (authLoading) return <HomeSkeleton />;
  // Provider será redirecionado pelo useEffect — não renderiza home
  if (dbUser?.role === "PROVIDER") return null;
  if (isLoading) return <HomeSkeleton />;

  return (
    <>
      <style>{`
        .tp-home {
          background: var(--bg, #0d0d0d);
          min-height: 100vh;
          font-family: var(--font, 'Sora', sans-serif);
          color: #fff;
          padding-bottom: 60px;
        }

        /* ── HERO ── */
        .tp-hero {
          position: relative; width: 100%;
          height: min(58vw, 540px); min-height: 300px;
          overflow: hidden;
        }
        .tp-hero-img {
          position: absolute; inset: 0;
          object-fit: cover; width: 100%; height: 100%;
          filter: brightness(0.65) saturate(1.15);
          transition: opacity 0.45s ease;
        }
        .tp-hero-img.fading { opacity: 0; }
        .tp-hero-grad {
          position: absolute; inset: 0;
          background:
            linear-gradient(to right, rgba(13,13,13,0.88) 0%, rgba(13,13,13,0.45) 45%, transparent 75%),
            linear-gradient(to top, #0d0d0d 0%, transparent 50%);
        }
        .tp-hero-content {
          position: absolute; bottom: 14%; left: 0;
          padding: 0 5%; max-width: 540px;
        }
        .tp-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--brand, #fd5b01); color: #fff;
          font-size: 11px; font-weight: 700;
          padding: 5px 14px; border-radius: 4px;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 14px;
          box-shadow: 0 2px 12px rgba(253,91,1,0.4);
        }
        .tp-hero-name {
          font-size: clamp(26px, 4.5vw, 52px);
          font-weight: 800; line-height: 1.06;
          letter-spacing: -0.035em; color: #fff;
          margin: 0 0 12px;
          text-shadow: 0 2px 24px rgba(0,0,0,0.5);
          transition: opacity 0.45s ease;
        }
        .tp-hero-name.fading { opacity: 0; }
        .tp-hero-meta {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 22px; flex-wrap: wrap;
        }
        .tp-hero-rating {
          display: inline-flex; align-items: center; gap: 6px;
          color: #fd5b01; font-weight: 800; font-size: 14px;
        }
        .tp-hero-price {
          color: #fff; font-size: 13px; font-weight: 600;
          background: rgba(255,255,255,0.13); padding: 5px 13px;
          border-radius: 8px; backdrop-filter: blur(4px);
        }
        .tp-hero-cta {
          display: inline-flex; align-items: center; gap: 9px;
          background: var(--brand, #fd5b01); color: #fff;
          font-family: var(--font, 'Sora', sans-serif);
          font-size: 14px; font-weight: 700;
          padding: 13px 28px; border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(253,91,1,0.45);
        }
        .tp-hero-cta:hover {
          background: #e04e00;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(253,91,1,0.5);
        }
        .tp-hero-dots {
          position: absolute; bottom: 7%; right: 5%;
          display: flex; gap: 8px; align-items: center;
        }
        .tp-hero-dot {
          border: none; padding: 0; cursor: pointer;
          transition: background 0.3s, transform 0.2s, width 0.3s;
          border-radius: 4px; height: 4px;
        }
        .tp-hero-dot         { width: 20px; background: rgba(255,255,255,0.25); }
        .tp-hero-dot.active  { width: 32px; background: #fd5b01; }

        /* ── MAIN ── */
        .tp-main {
          padding: 0 5%;
          margin-top: -48px;
          position: relative; z-index: 2;
        }

        /* ── SECTION ── */
        .tp-section { margin-bottom: 48px; }
        .tp-section-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 18px;
        }
        .tp-section-bar    { width: 4px; height: 20px; border-radius: 2px; flex-shrink: 0; }
        .tp-section-title  { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; color: #fff; margin: 0; white-space: nowrap; }
        .tp-section-line   { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }

        /* ── ROWS ── */
        .tp-row, .tp-featured-row {
          display: flex; gap: 14px; overflow-x: auto;
          padding-bottom: 12px; scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .tp-row::-webkit-scrollbar,
        .tp-featured-row::-webkit-scrollbar { height: 3px; }
        .tp-row::-webkit-scrollbar-thumb,
        .tp-featured-row::-webkit-scrollbar-thumb { background: rgba(253,91,1,0.5); border-radius: 3px; }
        .tp-row::-webkit-scrollbar-track,
        .tp-featured-row::-webkit-scrollbar-track { background: transparent; }

        /* ── CARD ── */
        .tp-card {
          flex-shrink: 0; width: 180px;
          border-radius: 12px; overflow: visible;
          text-decoration: none; background: var(--surface, #1a1a1a);
          scroll-snap-align: start;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative; display: block;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .tp-card--featured { width: 268px; }
        .tp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(253,91,1,0.2);
        }

        .tp-card-thumb {
          position: relative; width: 100%; padding-top: 56.25%;
          background: #111; overflow: hidden;
          border-radius: 12px 12px 0 0;
        }
        .tp-card-img { object-fit: cover; transition: transform 0.5s ease; }
        .tp-card:hover .tp-card-img { transform: scale(1.06); }
        .tp-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%);
        }
        .tp-card-price {
          position: absolute; top: 8px; right: 8px;
          background: rgba(13,13,13,0.88);
          border: 1px solid rgba(253,91,1,0.35);
          color: #fd5b01; font-size: 11px; font-weight: 800;
          padding: 4px 9px; border-radius: 6px;
          backdrop-filter: blur(6px);
          font-family: var(--font, 'Sora', sans-serif);
        }
        .tp-card-info {
          padding: 10px 12px 13px;
          display: flex; flex-direction: column; gap: 6px;
          background: var(--surface, #1a1a1a);
          border-radius: 0 0 12px 12px;
        }
        .tp-card-name {
          font-size: 13px; font-weight: 700; color: #f0f0f0;
          margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── RANK NUMBER ── */
        .tp-rank {
          position: absolute; bottom: 46px; left: 8px;
          font-size: 44px; font-weight: 800;
          color: rgba(255,255,255,0.09); line-height: 1;
          font-family: var(--font, 'Sora', sans-serif);
          pointer-events: none; user-select: none;
          text-shadow: -2px 0 0 rgba(253,91,1,0.20);
        }

        /* ── EMPTY STATE ── */
        .tp-empty {
          text-align: center; padding: 5rem 1rem;
          color: var(--t3, #666);
          font-family: var(--font, 'Sora', sans-serif);
          animation: tp-fadeUp 0.4s ease both;
        }
        .tp-empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.5; }
        .tp-empty-title { font-size: 18px; font-weight: 700; color: var(--t2, #aaa); margin-bottom: 8px; }
        .tp-empty-desc  { font-size: 14px; color: var(--t3, #666); line-height: 1.6; }

        @media (max-width: 480px) {
          .tp-main { padding: 0 4%; margin-top: -32px; }
          .tp-card { width: 160px; }
          .tp-card--featured { width: 240px; }
          .tp-hero-content { padding: 0 4%; max-width: 90%; }
        }
      `}</style>

      <div className="tp-home">

        {/* ── HERO ── */}
        {hero && (
          <div className="tp-hero">
            <Image
              src={hero.avatarUrl}
              fill alt={hero.name}
              className={`tp-hero-img${heroFading ? " fading" : ""}`}
              priority sizes="100vw"
            />
            <div className="tp-hero-grad" />
            <div className="tp-hero-content">
              <div className="tp-hero-badge">🔥 Destaque da semana</div>
              <h1 className={`tp-hero-name${heroFading ? " fading" : ""}`}>{hero.name}</h1>
              <div className="tp-hero-meta">
                <span className="tp-hero-rating">
                  <svg width="14" height="14" viewBox="0 0 10 10" fill="#fd5b01">
                    <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
                  </svg>
                  {hero.rating.toFixed(1)}
                </span>
                <span className="tp-hero-price">R$ {Number(hero.price).toFixed(2)} / sessão</span>
              </div>
              <Link href={`/providers/${hero.id}`} className="tp-hero-cta">
                Ver perfil
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            <div className="tp-hero-dots">
              {topProviders.map((_, i) => (
                <button
                  key={i}
                  className={`tp-hero-dot${i === heroIndex ? " active" : ""}`}
                  onClick={() => { setHeroFading(true); setTimeout(() => { setHeroIndex(i); setHeroFading(false); }, 400); }}
                  aria-label={`Destaque ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN ── */}
        <div className="tp-main">

          {/* TOP PRESTADORES */}
          {topProviders.length > 0 && (
            <section className="tp-section anim-fadeUp">
              <div className="tp-section-header">
                <span className="tp-section-bar" style={{ background: "#fd5b01" }} />
                <h2 className="tp-section-title">🔥 Top Prestadores</h2>
                <span className="tp-section-line" />
                <Link href="/feed" style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#fd5b01", textDecoration: "none", whiteSpace: "nowrap", fontFamily: "var(--font,'Sora',sans-serif)" }}>
                  Ver todos →
                </Link>
              </div>
              <div className="tp-featured-row">
                {topProviders.map((p, i) => (
                  <Link key={p.id} href={`/providers/${p.id}`} className="tp-card tp-card--featured">
                    <div className="tp-card-thumb">
                      <Image src={p.avatarUrl} fill alt={p.name} className="tp-card-img" sizes="268px" />
                      <div className="tp-card-overlay" />
                      <div className="tp-card-price">R$ {p.price}</div>
                      <span className="tp-rank">{i + 1}</span>
                    </div>
                    <div className="tp-card-info">
                      <p className="tp-card-name">{p.name}</p>
                      <StarRating rating={p.rating} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORIAS */}
          {categories.map((cat, ci) => (
            <SectionRow
              key={cat.name}
              title={cat.name}
              providers={cat.providers}
              accent={ci % 2 === 0 ? "#fd5b01" : "#a78bfa"}
            />
          ))}

          {/* Empty state */}
          {!isLoading && topProviders.length === 0 && (
            <div className="tp-empty">
              <div className="tp-empty-icon">🎮</div>
              <p className="tp-empty-title">Nenhum prestador disponível</p>
              <p className="tp-empty-desc">Ainda não há prestadores cadastrados.<br />Volte em breve!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
