"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useHomeProviders } from "@/hooks/useProviders";
import type { ProviderCard } from "@/services/providers.service";

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 10 10" fill={i <= Math.round(rating) ? "#fd5b01" : "#2a2a2a"}>
          <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
        </svg>
      ))}
      <span style={{ color: "#666", fontSize: 11, marginLeft: 3 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function ProviderGridCard({ provider }: { provider: ProviderCard }) {
  return (
    <Link href={`/providers/${provider.id}`} className="fd-card">
      <div className="fd-card-thumb">
        <Image
          src={provider.avatarUrl}
          fill
          alt={provider.name}
          className="fd-card-img"
          sizes="(max-width:600px) 50vw, (max-width:900px) 33vw, 280px"
        />
        <div className="fd-card-overlay" />
        <div className="fd-card-price">R$ {Number(provider.price).toFixed(2)}</div>
      </div>
      <div className="fd-card-body">
        <p className="fd-card-name">{provider.name}</p>
        <StarRating rating={provider.rating} />
        {(provider.displayCategories ?? provider.categories).length > 0 && (
          <div className="fd-card-cats">
            {(provider.displayCategories ?? provider.categories).slice(0, 3).map((c) => (
              <span key={c} className="fd-cat-tag">{c}</span>
            ))}
            {(provider.displayCategories ?? provider.categories).length > 3 && (
              <span className="fd-cat-tag" style={{ color: "#555" }}>+{(provider.displayCategories ?? provider.categories).length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function FeedSkeleton() {
  return (
    <div className="fd-page">
      <div className="fd-header">
        <div className="sk sk-h28" style={{ width: 240, borderRadius: 8, marginBottom: 8 }} />
        <div className="sk sk-h13" style={{ width: 180, borderRadius: 6 }} />
      </div>
      <div className="sk" style={{ height: 46, borderRadius: 12, margin: "1.5rem 0 1rem" }} />
      <div className="sk" style={{ height: 38, borderRadius: 10, marginBottom: "1.5rem" }} />
      <div className="fd-grid">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#1a1a1a" }}>
            <div className="sk" style={{ width: "100%", paddingTop: "62%", display: "block" }} />
            <div style={{ padding: "12px" }}>
              <div className="sk sk-h16" style={{ width: "70%", borderRadius: 6, marginBottom: 8 }} />
              <div className="sk sk-h10" style={{ width: "50%", borderRadius: 5 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { data, isLoading } = useHomeProviders();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allProviders: ProviderCard[] = data?.allProviders ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>();
    allProviders.forEach(p => p.categories.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [allProviders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProviders.filter(p => {
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.categories.some(c => c.toLowerCase().includes(q));
      const matchesCat = !activeCategory || p.categories.includes(activeCategory);
      return matchesSearch && matchesCat;
    });
  }, [allProviders, search, activeCategory]);

  if (isLoading) return <FeedSkeleton />;

  return (
    <>
      <style>{`
        .fd-page {
          background: #0d0d0d;
          min-height: 100vh;
          font-family: 'Sora', sans-serif;
          color: #fff;
          padding: 5.5rem 5% 4rem;
        }

        /* ── HEADER ── */
        .fd-header { margin-bottom: 1.75rem; }
        .fd-title {
          font-size: clamp(22px, 3vw, 32px);
          font-weight: 800; letter-spacing: -0.04em; color: #fff; margin: 0 0 6px;
        }
        .fd-subtitle { font-size: 13px; color: #666; }
        .fd-count { color: #fd5b01; font-weight: 700; }

        /* ── SEARCH ── */
        .fd-search-wrap {
          position: relative; margin-bottom: 1rem;
        }
        .fd-search-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #555; pointer-events: none;
        }
        .fd-search {
          width: 100%; padding: 13px 44px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-family: 'Sora', sans-serif; font-size: 14px; color: #f0f0f0;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .fd-search::placeholder { color: #444; }
        .fd-search:focus { border-color: #fd5b01; box-shadow: 0 0 0 3px rgba(253,91,1,0.12); }
        .fd-search-clear {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #555; cursor: pointer;
          padding: 4px; display: flex; align-items: center;
          transition: color 0.15s;
        }
        .fd-search-clear:hover { color: #fff; }

        /* ── CATEGORY CHIPS ── */
        .fd-chips {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1.75rem;
        }
        .fd-chip {
          padding: 7px 14px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
          color: #aaa; cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .fd-chip:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .fd-chip.active {
          background: rgba(253,91,1,0.15);
          border-color: rgba(253,91,1,0.5);
          color: #fd5b01;
        }

        /* ── GRID ── */
        .fd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }

        /* ── CARD ── */
        .fd-card {
          border-radius: 14px; overflow: hidden;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.07);
          text-decoration: none; display: block;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .fd-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(253,91,1,0.2);
        }
        .fd-card-thumb {
          position: relative; width: 100%; padding-top: 62%;
          background: #111; overflow: hidden;
        }
        .fd-card-img { object-fit: cover; transition: transform 0.5s ease; }
        .fd-card:hover .fd-card-img { transform: scale(1.06); }
        .fd-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%);
        }
        .fd-card-price {
          position: absolute; top: 8px; right: 8px;
          background: rgba(13,13,13,0.88);
          border: 1px solid rgba(253,91,1,0.35);
          color: #fd5b01; font-size: 11px; font-weight: 800;
          padding: 4px 9px; border-radius: 6px;
          backdrop-filter: blur(6px);
          font-family: 'Sora', sans-serif;
        }
        .fd-card-body { padding: 12px 14px 14px; }
        .fd-card-name {
          font-size: 14px; font-weight: 700; color: #f0f0f0;
          margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fd-card-cats { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
        .fd-cat-tag {
          font-size: 10px; font-weight: 600; color: #777;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 3px 8px; border-radius: 10px;
          text-transform: uppercase; letter-spacing: 0.04em;
        }

        /* ── EMPTY STATE ── */
        .fd-empty {
          grid-column: 1 / -1;
          text-align: center; padding: 4rem 1rem;
        }
        .fd-empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.4; }
        .fd-empty-title { font-size: 17px; font-weight: 700; color: #aaa; margin-bottom: 6px; }
        .fd-empty-desc  { font-size: 13px; color: #555; }

        /* ── RESULTS COUNT ── */
        .fd-results {
          font-size: 12px; color: #555; margin-bottom: 1.25rem;
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .fd-page { padding: 5rem 4% 3rem; }
          .fd-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>

      <div className="fd-page">
        <div className="fd-header">
          <h1 className="fd-title">Explorar Prestadores</h1>
          <p className="fd-subtitle">
            <span className="fd-count">{allProviders.length}</span> prestadores disponíveis
          </p>
        </div>

        {/* Search */}
        <div className="fd-search-wrap">
          <svg className="fd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="fd-search"
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="fd-search-clear" onClick={() => setSearch("")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="fd-chips">
            <button
              className={`fd-chip${!activeCategory ? " active" : ""}`}
              onClick={() => setActiveCategory(null)}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`fd-chip${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {(search || activeCategory) && (
          <p className="fd-results">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            {search && ` para "${search}"`}
            {activeCategory && ` em ${activeCategory}`}
          </p>
        )}

        {/* Grid */}
        <div className="fd-grid">
          {filtered.length > 0
            ? filtered.map(p => <ProviderGridCard key={p.id} provider={p} />)
            : (
              <div className="fd-empty">
                <div className="fd-empty-icon">🔍</div>
                <p className="fd-empty-title">Nenhum resultado encontrado</p>
                <p className="fd-empty-desc">Tente buscar por outro nome ou categoria.</p>
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}
