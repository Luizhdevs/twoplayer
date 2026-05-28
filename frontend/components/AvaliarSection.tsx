"use client";

import { useState } from "react";
import AvaliarButton from "./AvaliarButton";

type Review = {
  id: string; rating: number; comment: string;
  services: { id: number; title: string };
  user: { name: string };
};
type Props = {
  initialReviews: Review[];
  servicos: { id: string; title: string }[];
};

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <span key={i} style={{ fontSize: 14 }}>{i < rating ? "⭐" : "☆"}</span>
  ));
}

export default function AvaliarSection({ initialReviews, servicos }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  return (
    <div className="pv-card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
        <div className="pv-section-title" style={{ marginBottom:0 }}>Avaliações</div>
        <AvaliarButton servicos={servicos} onNovaAvaliacao={nova => setReviews(prev => [nova, ...prev])} />
      </div>
      {reviews.length === 0 ? (
        <p style={{ fontSize:13, color:"#555", textAlign:"center", padding:"1rem 0" }}>Nenhuma avaliação ainda.</p>
      ) : reviews.map(review => (
        <div key={review.id} className="pv-review-card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span className="pv-review-service">{review.services.title}</span>
            <span style={{ display:"flex", gap:2 }}>{renderStars(review.rating)}</span>
          </div>
          <p className="pv-review-comment">"{review.comment}"</p>
          <p className="pv-review-author">— {review.user.name}</p>
        </div>
      ))}
    </div>
  );
}
