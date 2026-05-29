import Image from "next/image";
import AgendarButton from "@/components/AgendarButton";
import AvaliarSection from "@/components/AvaliarSection";

type User = { name: string };
type Service = { id: string; title: string; description: string; price: number; duration: number };
type Review = {
  id: string; rating: number; comment: string;
  services: { id: number; title: string };
  user: { name: string };
};
type Provider = {
  id: number; avatarUrl: string; bio: string;
  categories: string[]; user: User;
  services: Service[]; reviews: Review[]; images: string[];
};
type Props = { params: Promise<{ id: string }> };

const MOCK_PROVIDERS: Record<string, Provider> = {
  "1": { id: 1, avatarUrl: "/avatar.jpg", bio: "Jogador de Futebol e CS nas horas vagas", categories: ["Futebol", "Games"], user: { name: "Neymar" }, services: [{ id: "1", title: "Bate-papo", description: "Sessão de 30min", price: 1000, duration: 30 }, { id: "2", title: "Partida de CS", description: "Sessão de 1h", price: 2000, duration: 60 }], reviews: [{ id: "1", rating: 5, comment: "Nunca imaginei que um dia pudesse conversar com o meu ídolo!", services: { id: 1, title: "Bate-papo" }, user: { name: "Ryan Charles" } }], images: [] },
  "2": { id: 2, avatarUrl: "/gaules.jpg", bio: "Streamer e Gamer", categories: ["Streaming", "Games"], user: { name: "Gaules" }, services: [{ id: "1", title: "Bate-papo", description: "Sessão de 30min", price: 1000, duration: 30 }], reviews: [{ id: "1", rating: 5, comment: "Incrível!", services: { id: 1, title: "Bate-papo" }, user: { name: "Deyvison" } }], images: [] },
  "3": { id: 3, avatarUrl: "/caze.jpg", bio: "Apresentador e streamer", categories: ["Futebol", "Games", "Streaming"], user: { name: "Caze" }, services: [{ id: "1", title: "Bate-papo", description: "Sessão de 30min", price: 1000, duration: 30 }], reviews: [], images: [] },
};

async function getProvider(id: string): Promise<Provider> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiUrl}/providers/${id}`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {}
  const mock = MOCK_PROVIDERS[id];
  if (mock) return mock;
  throw new Error("Prestador não encontrado");
}

export default async function ProviderPage({ params }: Props) {
  const { id } = await params;
  const provider = await getProvider(id);

  const avgRating = provider.reviews.length > 0
    ? provider.reviews.reduce((acc, r) => acc + r.rating, 0) / provider.reviews.length
    : 0;

  const servicos = provider.services.map(s => ({ id: s.id, title: s.title }));

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

        .pv-review-card {
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          padding: 1.25rem; margin-bottom: 12px;
        }
        .pv-review-service {
          font-size: 11px; font-weight: 700; color: #fd5b01;
          background: rgba(253,91,1,0.1); padding: 2px 10px; border-radius: 100px;
          display: inline-block; margin-bottom: 8px;
          border: 1px solid rgba(253,91,1,0.2);
        }
        .pv-review-comment { font-size: 13px; color: #bbb; line-height: 1.6; margin-bottom: 8px; }
        .pv-review-author  { font-size: 11px; color: #555; font-weight: 600; }

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
                  {provider.user.name}
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
            {provider.services.map(service => (
              <div key={service.id} className="pv-service-card">
                <p className="pv-service-title">{service.title}</p>
                <p className="pv-service-desc">{service.description}</p>
                <div className="pv-service-footer">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span className="pv-service-price">R$ {service.price}</span>
                    <span className="pv-service-duration">⏱ {service.duration} min</span>
                  </div>
                  <AgendarButton />
                </div>
              </div>
            ))}
          </div>

          {/* AVALIAÇÕES */}
          <AvaliarSection initialReviews={provider.reviews} servicos={servicos} />

        </div>
      </div>
    </>
  );
}
