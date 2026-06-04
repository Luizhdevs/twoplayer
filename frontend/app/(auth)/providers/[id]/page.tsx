"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import AgendarButton from "@/components/AgendarButton";
import AvaliarSection from "@/components/AvaliarSection";
import { useProvider } from "@/hooks/useProviders";

export default function ProviderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: provider, isLoading, isError } = useProvider(id);

  if (isLoading) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes pv-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fd5b01", animation: "pv-spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Sora', sans-serif" }}>
        <p style={{ color: "#aaa", fontSize: 16 }}>Prestador não encontrado.</p>
        <a href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>← Voltar para Home</a>
      </div>
    );
  }

  const avgRating = provider.reviews.length > 0
    ? provider.reviews.reduce((acc, r) => acc + r.rating, 0) / provider.reviews.length
    : provider.rating;

  const servicos = provider.services.map(s => ({ id: s.id, title: s.title }));

  const reviewsForSection = provider.reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    user: r.user,
    services: { id: r.services.id ?? "", title: r.services.title },
  }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .pv * { font-family:'Sora',sans-serif; box-sizing:border-box; }

        .pv-page { background:#0d0d0d; min-height:100vh; padding: 5rem 1.5rem 2rem; }
        .pv-inner { max-width:800px; margin:0 auto; }

        .pv-card {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
        }

        .pv-section-title {
          font-size: 13px; font-weight: 700; color: #aaa;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;
        }
        .pv-section-title::before {
          content: ''; display: block; width: 3px; height: 14px;
          background: #fd5b01; border-radius: 2px; flex-shrink: 0;
        }

        .pv-cat-badge {
          display: inline-block;
          background: rgba(253,91,1,0.12); color: #fd5b01;
          font-size: 11px; font-weight: 700;
          padding: 4px 12px; border-radius: 100px;
          border: 1px solid rgba(253,91,1,0.25);
        }

        .pv-gallery {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-top: 1.25rem;
        }
        .pv-gallery-item {
          border-radius: 12px; overflow: hidden;
          aspect-ratio: 1 / 1; position: relative;
          background: #111;
        }

        .pv-service-card {
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          padding: 1.25rem;
          margin-bottom: 12px;
          transition: background 0.2s, border-color 0.2s;
        }
        .pv-service-card:hover {
          background: rgba(253,91,1,0.06);
          border-color: rgba(253,91,1,0.2);
        }

        .pv-service-title { font-size: 15px; font-weight: 700; color: #f0f0f0; margin-bottom: 4px; }
        .pv-service-desc  { font-size: 12px; color: #666; margin-bottom: 12px; line-height: 1.5; }
        .pv-service-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .pv-service-price    { font-size:18px; font-weight:700; color:#fd5b01; }
        .pv-service-duration { font-size:11px; color:#666; background:rgba(255,255,255,0.07); padding:3px 10px; border-radius:100px; }

        .pv-rating-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(253,91,1,0.12); color: #fd5b01;
          font-size: 13px; font-weight: 700;
          padding: 4px 12px; border-radius: 100px;
          margin-top: 4px; border: 1px solid rgba(253,91,1,0.2);
        }
      `}</style>

      <div className="pv pv-page">
        <div className="pv-inner">

          {/* HEADER */}
          <div className="pv-card">
            <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
              <div style={{ position:"relative", width:80, height:80, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:"3px solid rgba(253,91,1,0.4)" }}>
                <Image src={provider.avatarUrl} fill alt="Avatar" style={{ objectFit:"cover" }} />
              </div>
              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:4 }}>
                  {provider.user?.name ?? "Prestador"}
                </h1>
                <p style={{ fontSize:13, color:"#777", marginBottom:10, lineHeight:1.5 }}>{provider.bio}</p>
                <div className="pv-rating-badge">
                  ⭐ {avgRating.toFixed(1)}
                  <span style={{ fontWeight:400, color:"rgba(253,91,1,0.7)" }}>({provider.reviews.length} avaliações)</span>
                </div>
              </div>
            </div>

            {/* Categorias */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:16 }}>
              {provider.categories.map(cat => (
                <span key={cat} className="pv-cat-badge">{cat}</span>
              ))}
            </div>

            {/* Galeria */}
            {provider.images.length > 0 && (
              <div className="pv-gallery">
                {provider.images.map((img, i) => (
                  <div key={i} className="pv-gallery-item">
                    <Image src={img} alt="Galeria" fill style={{ objectFit:"cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SERVIÇOS */}
          <div className="pv-card">
            <div className="pv-section-title">Serviços disponíveis</div>
            {provider.services.length === 0 ? (
              <p style={{ fontSize:13, color:"#555", textAlign:"center", padding:"1rem 0" }}>Nenhum serviço disponível.</p>
            ) : provider.services.map(service => (
              <div key={service.id} className="pv-service-card">
                <p className="pv-service-title">{service.title}</p>
                <p className="pv-service-desc">{service.description}</p>
                <div className="pv-service-footer">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span className="pv-service-price">R$ {service.price}</span>
                    <span className="pv-service-duration">⏱ {service.duration} min</span>
                  </div>
                  <AgendarButton
                    providerId={provider.id}
                    providerName={provider.user?.name}
                    serviceId={service.id}
                    serviceTitle={service.title}
                    servicePrice={service.price}
                    serviceDuration={service.duration}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AVALIAÇÕES */}
          <AvaliarSection initialReviews={reviewsForSection} servicos={servicos} />

        </div>
      </div>
    </>
  );
}
