"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import AgendarButton from "@/components/AgendarButton";
import AvaliarSection from "@/components/AvaliarSection";
import { useProvider } from "@/hooks/useProviders";

function StarFull({ n, rating }: { n: number; rating: number }) {
  const filled = n <= Math.round(rating);
  return (
    <svg width="14" height="14" viewBox="0 0 10 10" fill={filled ? "#fd5b01" : "#2a2a2a"}>
      <polygon points="5,0.5 6.2,3.8 9.8,3.8 6.9,5.9 8,9.2 5,7.1 2,9.2 3.1,5.9 0.2,3.8 3.8,3.8" />
    </svg>
  );
}

function ProviderSkeleton() {
  return (
    <div style={{ background: "var(--bg,#0d0d0d)", minHeight: "100vh", padding: "5.5rem 1.5rem 3rem" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* Header card */}
        <div style={{ background: "#1a1a1a", borderRadius: 18, padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div className="sk sk-circle" style={{ width: 88, height: 88, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk sk-h28" style={{ width: 200, marginBottom: 10, borderRadius: 6 }} />
              <div className="sk sk-h13" style={{ width: "80%", marginBottom: 8, borderRadius: 5 }} />
              <div className="sk sk-h13" style={{ width: "60%", marginBottom: 14, borderRadius: 5 }} />
              <div className="sk sk-h20" style={{ width: 100, borderRadius: 10 }} />
            </div>
          </div>
        </div>
        {/* Services card */}
        <div style={{ background: "#1a1a1a", borderRadius: 18, padding: "1.5rem", marginBottom: "1rem" }}>
          <div className="sk sk-h16" style={{ width: 160, marginBottom: "1.25rem", borderRadius: 6 }} />
          {[1, 2].map(i => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem", marginBottom: 12 }}>
              <div className="sk sk-h16" style={{ width: "50%", marginBottom: 8, borderRadius: 6 }} />
              <div className="sk sk-h13" style={{ width: "90%", marginBottom: 6, borderRadius: 5 }} />
              <div className="sk sk-h13" style={{ width: "70%", marginBottom: 14, borderRadius: 5 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="sk sk-h20" style={{ width: 80, borderRadius: 8 }} />
                <div className="sk sk-h20" style={{ width: 100, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProviderPage() {
  const params = useParams<{ id: string }>();
  const id     = params.id;
  const { data: provider, isLoading, isError } = useProvider(id);

  if (isLoading) return <ProviderSkeleton />;

  if (isError || !provider) {
    return (
      <div className="page-loader">
        <span style={{ fontSize: 40 }}>😕</span>
        <p style={{ color: "#aaa", fontSize: 15, fontFamily: "var(--font)" }}>Prestador não encontrado.</p>
        <a href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14, fontFamily: "var(--font)" }}>← Voltar para Home</a>
      </div>
    );
  }

  const avgRating = provider.reviews.length > 0
    ? provider.reviews.reduce((acc, r) => acc + r.rating, 0) / provider.reviews.length
    : provider.rating;

  const servicos = provider.services.map(s => ({ id: s.id, title: s.title }));
  const reviewsForSection = provider.reviews.map(r => ({
    id: r.id, rating: r.rating, comment: r.comment,
    user: r.user,
    services: { id: r.services.id ?? "", title: r.services.title },
  }));

  return (
    <>
      <style>{`
        .pv * { font-family: var(--font,'Sora',sans-serif); box-sizing: border-box; }
        .pv-page { background: var(--bg,#0d0d0d); min-height: 100vh; padding: 5.5rem 1.5rem 3rem; }
        .pv-inner { max-width: 840px; margin: 0 auto; }

        .pv-card {
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border,rgba(255,255,255,0.07));
          border-radius: 18px; padding: 1.5rem;
          margin-bottom: 1rem;
        }
        .pv-sec-title {
          font-size: 11px; font-weight: 700; color: var(--t3,#666);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 1rem;
          display: flex; align-items: center; gap: 8px;
        }
        .pv-sec-title::before { content:''; display:block; width:3px; height:12px; background:#fd5b01; border-radius:2px; flex-shrink:0; }

        /* Header */
        .pv-header-content { display: flex; gap: 20px; align-items: flex-start; }
        .pv-avatar {
          position: relative; width: 88px; height: 88px; flex-shrink: 0;
          border-radius: 50%; overflow: hidden;
          border: 3px solid rgba(253,91,1,0.40);
          background: linear-gradient(135deg,#fd5b01,#ff8c42);
        }
        .pv-name { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -.03em; margin: 0 0 6px; }
        .pv-bio  { font-size: 13px; color: var(--t3,#666); line-height: 1.55; margin: 0 0 12px; }
        .pv-rating-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(253,91,1,0.10);
          border: 1px solid rgba(253,91,1,0.22);
          color: #fd5b01; font-size: 13px; font-weight: 700;
          padding: 5px 14px; border-radius: 100px;
        }
        .pv-rating-count { font-size: 11px; color: rgba(253,91,1,0.6); font-weight: 400; }

        /* Category badges */
        .pv-cats { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
        .pv-cat {
          display: inline-flex; align-items: center;
          background: rgba(255,255,255,0.06); color: var(--t2,#aaa);
          font-size: 11.5px; font-weight: 600;
          padding: 5px 13px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.10);
        }

        /* Gallery */
        .pv-gallery {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-top: 1.25rem;
        }
        .pv-gallery-item {
          border-radius: 12px; overflow: hidden;
          aspect-ratio: 1 / 1; position: relative;
          background: #111;
          transition: transform 0.2s;
        }
        .pv-gallery-item:hover { transform: scale(1.02); }

        /* Service cards */
        .pv-service {
          background: rgba(255,255,255,0.035);
          border-radius: 14px;
          border: 1px solid var(--border,rgba(255,255,255,0.07));
          padding: 1.25rem 1.25rem 1rem;
          margin-bottom: 12px;
          transition: background 0.2s, border-color 0.2s;
        }
        .pv-service:hover {
          background: rgba(253,91,1,0.04);
          border-color: rgba(253,91,1,0.18);
        }
        .pv-service-title { font-size: 15px; font-weight: 700; color: #f0f0f0; margin: 0 0 5px; }
        .pv-service-desc  { font-size: 12.5px; color: var(--t3,#666); line-height: 1.55; margin: 0 0 14px; }
        .pv-service-footer {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .pv-service-meta { display: flex; align-items: center; gap: 10px; }
        .pv-service-price    { font-size: 18px; font-weight: 800; color: #fd5b01; }
        .pv-service-duration {
          font-size: 11px; color: var(--t2,#aaa);
          background: rgba(255,255,255,0.07);
          padding: 4px 10px; border-radius: 100px;
          display: flex; align-items: center; gap: 5px;
        }

        /* Empty services */
        .pv-no-services {
          text-align: center; padding: 2rem 0; color: var(--t3,#666); font-size: 13px;
        }

        @media (max-width: 600px) {
          .pv-page { padding: 5rem 1rem 2.5rem; }
          .pv-gallery { grid-template-columns: repeat(2,1fr); }
          .pv-header-content { flex-direction: column; align-items: center; text-align: center; }
          .pv-cats { justify-content: center; }
        }
      `}</style>

      <div className="pv pv-page">
        <div className="pv-inner">

          {/* HEADER */}
          <div className="pv-card anim-fadeUp">
            <div className="pv-header-content">
              <div className="pv-avatar">
                <Image src={provider.avatarUrl} fill alt="Avatar" style={{ objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h1 className="pv-name">{provider.user?.name ?? "Prestador"}</h1>
                {provider.bio && <p className="pv-bio">{provider.bio}</p>}
                <div className="pv-rating-badge">
                  <div style={{ display: "flex", gap: 3 }}>
                    {[1,2,3,4,5].map(n => <StarFull key={n} n={n} rating={avgRating} />)}
                  </div>
                  {avgRating.toFixed(1)}
                  <span className="pv-rating-count">({provider.reviews.length} avaliações)</span>
                </div>
              </div>
            </div>

            {/* Categorias */}
            {provider.categories.length > 0 && (
              <div className="pv-cats">
                {provider.categories.map(cat => (
                  <span key={cat} className="pv-cat">{cat}</span>
                ))}
              </div>
            )}

            {/* Galeria */}
            {provider.images.length > 0 && (
              <div className="pv-gallery">
                {provider.images.map((img, i) => (
                  <div key={i} className="pv-gallery-item">
                    <Image src={img} alt={`Foto ${i + 1}`} fill style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SERVIÇOS */}
          <div className="pv-card anim-fadeUp" style={{ animationDelay: "0.08s" }}>
            <div className="pv-sec-title">Serviços disponíveis</div>
            {provider.services.length === 0 ? (
              <div className="pv-no-services">
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🎮</div>
                <p>Nenhum serviço disponível no momento.</p>
              </div>
            ) : provider.services.map(service => (
              <div key={service.id} className="pv-service">
                <p className="pv-service-title">{service.title}</p>
                {service.description && <p className="pv-service-desc">{service.description}</p>}
                <div className="pv-service-footer">
                  <div className="pv-service-meta">
                    <span className="pv-service-price">R$ {Number(service.price).toFixed(2)}</span>
                    <span className="pv-service-duration">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {service.duration} min
                    </span>
                  </div>
                  <AgendarButton
                    providerId={provider.id}
                    providerName={provider.user?.name}
                    serviceId={service.id}
                    serviceTitle={service.title}
                    servicePrice={Number(service.price)}
                    serviceDuration={service.duration}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AVALIAÇÕES */}
          <div className="anim-fadeUp" style={{ animationDelay: "0.14s" }}>
            <AvaliarSection initialReviews={reviewsForSection} />
          </div>

        </div>
      </div>
    </>
  );
}
