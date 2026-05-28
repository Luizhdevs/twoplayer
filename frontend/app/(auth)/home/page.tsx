"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

type ProviderCardType = {
  id: number;
  name: string;
  avatarUrl: string;
  rating: number;
  price: number;
};

type Category = {
  name: string;
  providers: ProviderCardType[];
};

type HomeData = {
  topProviders: ProviderCardType[];
  categories: Category[];
};

const MOCK_DATA: HomeData = {
  topProviders: [
    { id: 1, name: "Neymar Jr", avatarUrl: "https://placehold.co/900x500/111/fd5b01?text=Neymar+Jr", rating: 4.9, price: 350 },
    { id: 2, name: "Ronaldinho", avatarUrl: "https://placehold.co/900x500/111/ff8c42?text=Ronaldinho", rating: 4.8, price: 280 },
    { id: 3, name: "Kaká", avatarUrl: "https://placehold.co/900x500/111/fd5b01?text=Kaká", rating: 4.7, price: 220 },
    { id: 4, name: "Robinho", avatarUrl: "https://placehold.co/900x500/111/ff8c42?text=Robinho", rating: 4.6, price: 190 },
  ],
  categories: [
    {
      name: "⚽ Futebol",
      providers: [
        { id: 5, name: "Adriano", avatarUrl: "https://placehold.co/320x180/111/fd5b01?text=Adriano", rating: 4.5, price: 160 },
        { id: 6, name: "Dentinho", avatarUrl: "https://placehold.co/320x180/111/fd5b01?text=Dentinho", rating: 4.3, price: 120 },
        { id: 7, name: "Fred", avatarUrl: "https://placehold.co/320x180/111/fd5b01?text=Fred", rating: 4.2, price: 110 },
      ],
    },
    {
      name: "🎮 Games",
      providers: [
        { id: 8, name: "Gaules", avatarUrl: "https://placehold.co/320x180/111/ff8c42?text=Gaules", rating: 4.9, price: 200 },
        { id: 9, name: "Nobru", avatarUrl: "https://placehold.co/320x180/111/ff8c42?text=Nobru", rating: 4.7, price: 150 },
        { id: 10, name: "Loud Coringa", avatarUrl: "https://placehold.co/320x180/111/ff8c42?text=Coringa", rating: 4.6, price: 130 },
      ],
    },
  ],
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill={i <= Math.round(rating) ? "#fd5b01" : "#444"}>
          <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
        </svg>
      ))}
      <span style={{ color: "#aaa", fontSize: 11, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function ProviderCard({ provider, featured = false }: { provider: ProviderCardType; featured?: boolean }) {
  return (
    <Link
      href={`/providers/${provider.id}`}
      className={featured ? "tp-card tp-card--featured" : "tp-card"}
    >
      <div className="tp-card-thumb">
        <Image src={provider.avatarUrl} fill alt={provider.name} className="tp-card-img" sizes="260px" />
        <div className="tp-card-overlay" />
        <div className="tp-card-price-badge">R$ {provider.price}</div>
      </div>
      <div className="tp-card-info">
        <p className="tp-card-name">{provider.name}</p>
        <StarRating rating={provider.rating} />
      </div>
    </Link>
  );
}

function SectionRow({ title, providers, accent = "#fd5b01" }: { title: string; providers: ProviderCardType[]; accent?: string }) {
  return (
    <section className="tp-section">
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

export default function HomePage() {
  const [data, setData] = useState<HomeData>(MOCK_DATA);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroFading, setHeroFading] = useState(false);

  // Carrega dados da API; fallback = mock
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    fetch(`${apiUrl}/providers`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: HomeData) => setData(d))
      .catch(() => {/* usa mock */});
  }, []);

  // Rotação automática do hero a cada 5s
  const advance = useCallback(() => {
    setHeroFading(true);
    setTimeout(() => {
      setHeroIndex((i) => (i + 1) % data.topProviders.length);
      setHeroFading(false);
    }, 400);
  }, [data.topProviders.length]);

  useEffect(() => {
    const id = setInterval(advance, 5000);
    return () => clearInterval(id);
  }, [advance]);

  const hero = data.topProviders[heroIndex];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .tp-home { background: #0d0d0d; min-height: 100vh; font-family: 'Sora', sans-serif; color: #fff; padding-bottom: 60px; }

        /* ── HERO ── */
        .tp-hero { position: relative; width: 100%; height: 56vw; max-height: 520px; min-height: 280px; overflow: hidden; }
        .tp-hero-img {
          position: absolute; inset: 0;
          object-fit: cover; width: 100%; height: 100%;
          filter: brightness(0.45) saturate(1.1);
          transition: opacity 0.4s ease;
        }
        .tp-hero-img.fading { opacity: 0; }
        .tp-hero-grad {
          position: absolute; inset: 0;
          background:
            linear-gradient(to right, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.55) 45%, transparent 75%),
            linear-gradient(to top, #0d0d0d 0%, transparent 40%);
        }
        .tp-hero-content { position: absolute; bottom: 15%; left: 0; padding: 0 5%; max-width: 520px; }
        .tp-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fd5b01; color: #fff; font-size: 11px; font-weight: 700;
          padding: 4px 12px; border-radius: 4px; letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 14px;
        }
        .tp-hero-name {
          font-size: clamp(26px, 4vw, 48px); font-weight: 800; line-height: 1.1;
          letter-spacing: -0.03em; color: #fff; margin: 0 0 10px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
          transition: opacity 0.4s ease;
        }
        .tp-hero-name.fading { opacity: 0; }
        .tp-hero-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .tp-hero-rating { display: inline-flex; align-items: center; gap: 5px; color: #fd5b01; font-weight: 700; font-size: 14px; }
        .tp-hero-price { color: #fff; font-size: 14px; font-weight: 600; background: rgba(255,255,255,0.12); padding: 4px 12px; border-radius: 6px; }
        .tp-hero-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fd5b01; color: #fff; font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px;
          text-decoration: none; transition: background 0.2s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(253,91,1,0.4);
        }
        .tp-hero-cta:hover { background: #e04e00; transform: translateY(-1px); }

        /* dots de navegação do hero */
        .tp-hero-dots { position: absolute; bottom: 8%; right: 5%; display: flex; gap: 8px; }
        .tp-hero-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.3); border: none; padding: 0; cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .tp-hero-dot.active { background: #fd5b01; transform: scale(1.3); }

        /* ── MAIN ── */
        .tp-main { padding: 0 5%; margin-top: -40px; position: relative; z-index: 2; }

        /* ── SEÇÃO ── */
        .tp-section { margin-bottom: 44px; }
        .tp-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .tp-section-bar { width: 4px; height: 22px; border-radius: 2px; flex-shrink: 0; }
        .tp-section-title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: #fff; margin: 0; white-space: nowrap; }
        .tp-section-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }

        /* ── CARROSSEL ── */
        .tp-row, .tp-featured-row {
          display: flex; gap: 12px; overflow-x: auto;
          padding-bottom: 10px; scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .tp-row::-webkit-scrollbar,
        .tp-featured-row::-webkit-scrollbar { height: 3px; }
        .tp-row::-webkit-scrollbar-thumb,
        .tp-featured-row::-webkit-scrollbar-thumb { background: #fd5b01; border-radius: 3px; }
        .tp-row::-webkit-scrollbar-track,
        .tp-featured-row::-webkit-scrollbar-track { background: transparent; }

        /* ── CARD ── */
        .tp-card {
          flex-shrink: 0; width: 180px;
          border-radius: 10px; overflow: visible;
          text-decoration: none; background: #1a1a1a;
          scroll-snap-align: start;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative; display: block;
        }
        .tp-card--featured { width: 260px; }

        /* inner clip para bordas arredondadas nas imagens */
        .tp-card-inner { border-radius: 10px; overflow: hidden; }

        .tp-card:hover { opacity: 1; }

        .tp-card-thumb {
          position: relative; width: 100%; padding-top: 56.25%;
          background: #1a1a1a; overflow: hidden;
          border-radius: 10px 10px 0 0;
        }
        .tp-card-img { object-fit: cover; transition: transform 0.4s; }
        .tp-card:hover .tp-card-img { transform: scale(1.05); }
        .tp-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%);
        }
        .tp-card-price-badge {
          position: absolute; top: 8px; right: 8px;
          background: rgba(13,13,13,0.85); border: 1px solid rgba(253,91,1,0.4);
          color: #fd5b01; font-size: 11px; font-weight: 700;
          padding: 3px 8px; border-radius: 5px;
          backdrop-filter: blur(4px); font-family: 'Sora', sans-serif;
        }
        .tp-card-info {
          padding: 10px 10px 12px;
          display: flex; flex-direction: column; gap: 5px;
          background: #1a1a1a;
          border-radius: 0 0 10px 10px;
        }
        .tp-card-name { font-size: 13px; font-weight: 600; color: #f0f0f0; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* rank */
        .tp-rank {
          position: absolute; bottom: 44px; left: 8px;
          font-size: 42px; font-weight: 800;
          color: rgba(255,255,255,0.1); line-height: 1;
          font-family: 'Sora', sans-serif;
          pointer-events: none; user-select: none;
          text-shadow: -2px 0 0 rgba(253,91,1,0.25);
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
                <span className="tp-hero-rating">⭐ {hero.rating.toFixed(1)}</span>
                <span className="tp-hero-price">R$ {hero.price} / sessão</span>
              </div>
              <Link href={`/providers/${hero.id}`} className="tp-hero-cta">
                Ver perfil
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            {/* dots */}
            <div className="tp-hero-dots">
              {data.topProviders.map((_, i) => (
                <button
                  key={i}
                  className={`tp-hero-dot${i === heroIndex ? " active" : ""}`}
                  onClick={() => { setHeroFading(true); setTimeout(() => { setHeroIndex(i); setHeroFading(false); }, 400); }}
                  aria-label={`Ir para destaque ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN ── */}
        <div className="tp-main">

          {/* TOP PRESTADORES */}
          <section className="tp-section">
            <div className="tp-section-header">
              <span className="tp-section-bar" style={{ background: "#fd5b01" }} />
              <h2 className="tp-section-title">🔥 Top Prestadores</h2>
              <span className="tp-section-line" />
            </div>
            <div className="tp-featured-row">
              {data.topProviders.map((p, i) => (
                <Link key={p.id} href={`/providers/${p.id}`} className="tp-card tp-card--featured">
                  <div className="tp-card-thumb">
                    <Image src={p.avatarUrl} fill alt={p.name} className="tp-card-img" sizes="260px" />
                    <div className="tp-card-overlay" />
                    <div className="tp-card-price-badge">R$ {p.price}</div>
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

          {/* CATEGORIAS */}
          {data.categories.map((cat, ci) => (
            <SectionRow key={cat.name} title={cat.name} providers={cat.providers} accent={ci % 2 === 0 ? "#fd5b01" : "#ff8c42"} />
          ))}
        </div>
      </div>
    </>
  );
}
