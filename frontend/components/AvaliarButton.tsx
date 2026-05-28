"use client";

import { useState } from "react";

type Props = {
  servicos: { id: string; title: string }[];
  onNovaAvaliacao: (avaliacao: {
    id: string; rating: number; comment: string;
    services: { id: number; title: string };
    user: { name: string };
  }) => void;
};

export default function AvaliarButton({ servicos, onNovaAvaliacao }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [nome,    setNome]    = useState("");
  const [servico, setServico] = useState("");
  const [nota,    setNota]    = useState(0);
  const [texto,   setTexto]   = useState("");
  const [ok,      setOk]      = useState(false);

  function handleEnviar() {
    if (!nome.trim() || !servico || nota === 0 || !texto.trim()) return;
    onNovaAvaliacao({ id: String(Date.now()), rating: nota, comment: texto, services: { id: 0, title: servico }, user: { name: nome } });
    setOk(true);
  }
  function handleFechar() {
    setShowModal(false); setNome(""); setServico(""); setNota(0); setTexto(""); setOk(false);
  }

  return (
    <>
      <style>{`
        @keyframes av-fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes av-popIn  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .av-btn { padding:10px 20px; background:#fd5b01; color:#fff; border:none; border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:inline-flex; align-items:center; gap:6px; }
        .av-btn:hover { background:#d94d00; }
        .av-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:600; display:flex; align-items:center; justify-content:center; padding:1rem; animation:av-fadeIn .2s ease; }
        .av-modal { background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:2rem; width:100%; max-width:420px; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.6); animation:av-popIn .25s ease; font-family:'Sora',sans-serif; }
        .av-close { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-size:14px; color:#aaa; transition:all .15s; }
        .av-close:hover { background:#fd5b01; color:#fff; }
        .av-label { font-size:11px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; display:block; margin-top:.75rem; }
        .av-input { width:100%; padding:11px 14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; color:#fff; outline:none; transition:border-color .2s,box-shadow .2s; }
        .av-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .av-input::placeholder { color:#444; }
        .av-confirmar { width:100%; padding:12px; background:#fd5b01; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s; margin-top:1.25rem; }
        .av-confirmar:hover:not(:disabled) { background:#d94d00; }
        .av-confirmar:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }
        .av-success { text-align:center; padding:1rem 0; }
        .av-success-icon { font-size:48px; margin-bottom:12px; }
        .av-success h3 { font-size:18px; font-weight:700; color:#fff; margin-bottom:8px; }
        .av-success p  { font-size:13px; color:#888; margin-bottom:1.25rem; }
      `}</style>

      <button className="av-btn" onClick={() => setShowModal(true)}>⭐ Avaliar</button>

      {showModal && (
        <div className="av-overlay" onClick={handleFechar}>
          <div className="av-modal" onClick={e => e.stopPropagation()}>
            <button className="av-close" onClick={handleFechar}>✕</button>
            {ok ? (
              <div className="av-success">
                <div className="av-success-icon">⭐</div>
                <h3>Avaliação enviada!</h3>
                <p>Obrigado pelo seu comentário.</p>
                <button className="av-confirmar" onClick={handleFechar}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:4 }}>⭐ Avaliar serviço</p>
                <p style={{ fontSize:13, color:"#777", marginBottom:".5rem" }}>Deixe sua avaliação sobre o serviço</p>
                <label className="av-label">Seu nome</label>
                <input className="av-input" placeholder="João Silva" value={nome} onChange={e => setNome(e.target.value)} />
                <label className="av-label">Serviço</label>
                <select className="av-input" value={servico} onChange={e => setServico(e.target.value)} style={{ cursor:"pointer", background:"rgba(255,255,255,0.06)" }}>
                  <option value="" style={{ background:"#1a1a1a" }}>Selecione o serviço</option>
                  {servicos.map(s => <option key={s.id} value={s.title} style={{ background:"#1a1a1a" }}>{s.title}</option>)}
                </select>
                <label className="av-label">Nota</label>
                <div style={{ display:"flex", gap:6, marginBottom:".5rem" }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setNota(n)} style={{ background:"none", border:"none", fontSize:28, cursor:"pointer", opacity: n <= nota ? 1 : 0.2, transition:"opacity .15s,transform .1s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform="scale(1.2)")}
                      onMouseLeave={e => (e.currentTarget.style.transform="scale(1)")}>
                      ⭐
                    </button>
                  ))}
                  {nota > 0 && <span style={{ fontSize:12, color:"#fd5b01", fontWeight:700, alignSelf:"center", fontFamily:"'Sora',sans-serif" }}>{["","Ruim","Regular","Bom","Ótimo","Excelente"][nota]}</span>}
                </div>
                <label className="av-label">Comentário</label>
                <textarea className="av-input" placeholder="Conte sua experiência..." value={texto} onChange={e => setTexto(e.target.value)} rows={3} style={{ resize:"none" }} />
                <button className="av-confirmar" disabled={!nome.trim() || !servico || nota === 0 || !texto.trim()} onClick={handleEnviar}>
                  Enviar avaliação →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
