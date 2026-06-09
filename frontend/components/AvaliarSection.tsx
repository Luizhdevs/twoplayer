"use client";

import AvaliarButton from "./AvaliarButton";

type Review = {
  id: string; rating: number; comment: string;
  services: { id: string | number; title: string };
  user: { name: string };
};
type Props = {
  initialReviews: Review[];
  reviewAppointmentId?: string;
};

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <span key={i} style={{ fontSize: 14 }}>{i < rating ? "⭐" : "☆"}</span>
  ));
}

export default function AvaliarSection({ initialReviews, reviewAppointmentId }: Props) {
  return (
    <div className="pv-card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
        <div className="pv-section-title" style={{ marginBottom: 0 }}>Avaliações</div>
        {reviewAppointmentId && <AvaliarButton appointmentId={reviewAppointmentId} />}
      </div>
      {initialReviews.length === 0 ? (
        <p style={{ fontSize:13, color:"#555", textAlign:"center", padding:"1rem 0" }}>Nenhuma avaliação ainda.</p>
      ) : initialReviews.map(review => (
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
