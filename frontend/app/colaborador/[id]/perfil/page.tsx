"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";

type Servico    = { id: number; titulo: string; descricao: string; preco: number; duracao: number };
type Comentario = { id: number; usuario: string; servico: string; nota: number; texto: string; data: string };
type Colaborador= { id: number; name: string; email: string; bio?: string; avatarUrl?: string };

const MOCK_SERVICOS: Servico[] = [
  { id: 1, titulo: "Bate-papo",    descricao: "Sessão de 30min",  preco: 1000, duracao: 30 },
  { id: 2, titulo: "Partida de CS", descricao: "Sessão de 1h",   preco: 2000, duracao: 60 },
];
const MOCK_COMENTARIOS: Comentario[] = [
  { id: 1, usuario: "Ryan Charles",    servico: "Bate-papo",    nota: 5, texto: "Nunca imaginei que um dia pudesse conversar com o meu ídolo!", data: "2026-04-18" },
  { id: 2, usuario: "Deyvison Dênnis", servico: "Partida de CS", nota: 4, texto: "Craque dentro e fora dos gramados!", data: "2026-04-10" },
];
const MOCK_FOTOS = ["/ney1.jpg", "/ney2.jpeg", "/ney3.jpg"];
const MOCK_SALDO = 150.00;

function Stars({ nota }: { nota: number }) {
  return <span>{Array.from({ length:5 }).map((_, i) => <span key={i} style={{ fontSize:14 }}>{i < nota ? "⭐" : "☆"}</span>)}</span>;
}

export default function ColaboradorPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [colab, setColab]               = useState<Colaborador | null>(null);
  const [servicos, setServicos]         = useState<Servico[]>(MOCK_SERVICOS);
  const [fotos, setFotos]               = useState<string[]>(MOCK_FOTOS);
  const [showIndisponivel, setShowIndisp] = useState(false);
  const [showAddServico, setShowAddServico] = useState(false);
  const [showEditServico, setShowEditServico] = useState<Servico | null>(null);

  const [sTitulo, setSTitulo] = useState("");
  const [sDesc,   setSDesc]   = useState("");
  const [sPreco,  setSPreco]  = useState("");
  const [sDur,    setSDur]    = useState("");
  const [sOk,     setSOk]     = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tp_colab");
    if (stored) {
      const d = JSON.parse(stored);
      if (String(d.id) === String(id)) setColab(d);
    }
  }, [id]);

  function abrirEdit(s: Servico) {
    setShowEditServico(s); setSTitulo(s.titulo); setSDesc(s.descricao);
    setSPreco(String(s.preco)); setSDur(String(s.duracao)); setSOk(false);
  }
  function abrirAdd() { setShowAddServico(true); setSTitulo(""); setSDesc(""); setSPreco(""); setSDur(""); setSOk(false); }
  function salvarServico() {
    if (!sTitulo || !sDesc || !sPreco || !sDur) return;
    if (showEditServico) {
      setServicos(prev => prev.map(s => s.id === showEditServico.id
        ? { ...s, titulo: sTitulo, descricao: sDesc, preco: parseFloat(sPreco), duracao: parseInt(sDur) } : s));
    } else {
      setServicos(prev => [...prev, { id: Date.now(), titulo: sTitulo, descricao: sDesc, preco: parseFloat(sPreco), duracao: parseInt(sDur) }]);
    }
    setSOk(true);
  }
  function fecharServico() {
    setShowAddServico(false); setShowEditServico(null); setSOk(false);
    setSTitulo(""); setSDesc(""); setSPreco(""); setSDur("");
  }
  function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFotos(prev => [...prev, URL.createObjectURL(file)]);
  }

  if (!colab) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d0d0d", color:"#aaa", fontFamily:"'Sora',sans-serif" }}>
      Carregando...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .cp * { font-family:'Sora',sans-serif; box-sizing:border-box; }

        .cp-card { background:#1a1a1a; border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:1.75rem; margin-bottom:1.25rem; }

        .cp-section-title { font-size:13px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem; display:flex; align-items:center; gap:10px; }
        .cp-section-title::before { content:''; display:block; width:3px; height:14px; background:#fd5b01; border-radius:2px; flex-shrink:0; }

        .cp-btn-primary { padding:10px 18px; background:#fd5b01; color:#fff; border:none; border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:inline-flex; align-items:center; gap:6px; }
        .cp-btn-primary:hover { background:#d94d00; }
        .cp-btn-primary:active { transform:scale(.97); }

        .cp-btn-secondary { padding:10px 18px; background:transparent; color:#fd5b01; border:1.5px solid rgba(253,91,1,0.4); border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:6px; }
        .cp-btn-secondary:hover { background:rgba(253,91,1,0.1); border-color:#fd5b01; }

        .cp-btn-ghost { width:100%; padding:13px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:500; color:#ccc; text-align:left; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all .2s; margin-bottom:8px; }
        .cp-btn-ghost:hover { background:rgba(253,91,1,0.1); border-color:rgba(253,91,1,0.3); color:#fd5b01; }

        .cp-servico { background:rgba(255,255,255,0.04); border-radius:14px; padding:1.25rem; margin-bottom:10px; border:1px solid rgba(255,255,255,0.06); transition:border-color .2s; }
        .cp-servico:hover { border-color:rgba(253,91,1,0.2); }
        .cp-servico-titulo { font-size:14px; font-weight:700; color:#f0f0f0; margin-bottom:3px; }
        .cp-servico-desc   { font-size:12px; color:#666; margin-bottom:8px; }
        .cp-preco { font-size:16px; font-weight:700; color:#fd5b01; }
        .cp-dur   { font-size:11px; color:#666; background:rgba(255,255,255,0.07); padding:3px 10px; border-radius:100px; }

        .cp-gallery { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .cp-gallery-item { border-radius:12px; overflow:hidden; aspect-ratio:1/1; position:relative; background:#111; }
        .cp-foto-add { border-radius:12px; aspect-ratio:1/1; background:rgba(255,255,255,0.03); border:2px dashed rgba(253,91,1,0.25); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; gap:4px; }
        .cp-foto-add:hover { border-color:#fd5b01; background:rgba(253,91,1,0.06); }
        .cp-foto-add span { font-size:22px; }
        .cp-foto-add p { font-size:10px; font-weight:600; color:#fd5b01; }

        .cp-comment { background:rgba(255,255,255,0.04); border-radius:12px; padding:1.25rem; margin-bottom:10px; border:1px solid rgba(255,255,255,0.06); }
        .cp-comment-user    { font-size:13px; font-weight:700; color:#f0f0f0; }
        .cp-comment-service { font-size:11px; font-weight:700; color:#fd5b01; background:rgba(253,91,1,0.1); padding:2px 10px; border-radius:100px; border:1px solid rgba(253,91,1,0.2); }
        .cp-comment-text    { font-size:13px; color:#aaa; line-height:1.6; margin:6px 0; }
        .cp-comment-date    { font-size:11px; color:#555; }

        .cp-wallet { background:linear-gradient(135deg,#fd5b01,#ff8c42); border-radius:14px; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; transition:transform .2s,box-shadow .2s; box-shadow:0 4px 16px rgba(253,91,1,0.3); border:none; width:100%; font-family:'Sora',sans-serif; }
        .cp-wallet:hover { transform:scale(1.01); box-shadow:0 8px 32px rgba(253,91,1,0.45); }

        .cp-label { font-size:11px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; display:block; }
        .cp-input { width:100%; padding:11px 14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; color:#fff; outline:none; margin-bottom:.75rem; transition:border-color .2s,box-shadow .2s; }
        .cp-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .cp-input::placeholder { color:#444; }
        .cp-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn .2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box { background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:2rem; width:100%; max-width:440px; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.6); animation:popIn .25s ease; }
        @keyframes popIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .modal-close { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-size:14px; color:#aaa; transition:all .15s; }
        .modal-close:hover { background:#fd5b01; color:#fff; }
        .modal-confirm { width:100%; padding:12px; background:#fd5b01; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s; margin-top:.5rem; }
        .modal-confirm:hover:not(:disabled) { background:#d94d00; }
        .modal-confirm:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }

        .cp-success { text-align:center; padding:1rem 0; }
        .cp-success-icon { font-size:48px; margin-bottom:12px; }
        .cp-success h3 { font-size:18px; font-weight:700; color:#fff; margin-bottom:8px; }
        .cp-success p  { font-size:13px; color:#888; margin-bottom:1.25rem; line-height:1.6; }
      `}</style>

      <Navbar />
      <div className="cp" style={{ background:"#0d0d0d", minHeight:"100vh", padding:"5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* HEADER */}
          <div className="cp-card">
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
              <div style={{ width:88, height:88, borderRadius:"50%", background:"linear-gradient(135deg,#fd5b01,#ff8c42)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:700, color:"#fff", flexShrink:0, boxShadow:"0 4px 24px rgba(253,91,1,0.35)" }}>
                {colab.name.charAt(0)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-.03em" }}>{colab.name}</h1>
                  <span style={{ background:"rgba(253,91,1,0.12)", color:"#fd5b01", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:100, border:"1px solid rgba(253,91,1,0.25)" }}>Prestador</span>
                </div>
                <p style={{ fontSize:13, color:"#666" }}>{colab.email}</p>
              </div>
            </div>

            {/* CARTEIRA */}
            <button className="cp-wallet" onClick={() => router.push(`/users/${id}/wallet`)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:42, height:42, background:"rgba(255,255,255,.2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👛</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,.8)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>Minha Carteira</div>
                  <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-.02em" }}>R$ {MOCK_SALDO.toFixed(2).replace(".",",")}</div>
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.9)", background:"rgba(255,255,255,.15)", padding:"7px 14px", borderRadius:8, whiteSpace:"nowrap" }}>Ver carteira →</div>
            </button>
          </div>

          {/* SERVIÇOS */}
          <div className="cp-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" }}>
              <div className="cp-section-title" style={{ marginBottom:0 }}>Meus Serviços</div>
              <button className="cp-btn-primary" onClick={abrirAdd}>+ Adicionar serviço</button>
            </div>
            {servicos.map(s => (
              <div key={s.id} className="cp-servico">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <p className="cp-servico-titulo">{s.titulo}</p>
                    <p className="cp-servico-desc">{s.descricao}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span className="cp-preco">R$ {s.preco}</span>
                      <span className="cp-dur">⏱ {s.duracao} min</span>
                    </div>
                  </div>
                  <button className="cp-btn-secondary" onClick={() => abrirEdit(s)}>✏️ Alterar</button>
                </div>
              </div>
            ))}
          </div>

          {/* FOTOS */}
          <div className="cp-card">
            <div className="cp-section-title">Fotos do Perfil</div>
            <div className="cp-gallery">
              {fotos.map((f, i) => (
                <div key={i} className="cp-gallery-item">
                  <Image src={f} alt="Foto" fill style={{ objectFit:"cover" }} />
                </div>
              ))}
              <label className="cp-foto-add" htmlFor="foto-upload">
                <span>+</span><p>Adicionar foto</p>
              </label>
              <input id="foto-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={handleFotoUpload} />
            </div>
          </div>

          {/* COMENTÁRIOS */}
          <div className="cp-card">
            <div className="cp-section-title">Comentários dos Clientes</div>
            {MOCK_COMENTARIOS.map(c => (
              <div key={c.id} className="cp-comment">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span className="cp-comment-user">{c.usuario}</span>
                  <span className="cp-comment-service">{c.servico}</span>
                </div>
                <Stars nota={c.nota} />
                <p className="cp-comment-text">"{c.texto}"</p>
                <p className="cp-comment-date">{new Date(c.data+"T00:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</p>
              </div>
            ))}
          </div>

          {/* CONFIGURAÇÕES */}
          <div className="cp-card">
            <div className="cp-section-title">Configurações</div>
            <button className="cp-btn-ghost" onClick={() => setShowIndisp(true)}>✏️ Editar perfil</button>
            <button className="cp-btn-ghost" onClick={() => setShowIndisp(true)}>🔒 Alterar senha</button>
            <button className="cp-btn-ghost" onClick={() => {
              localStorage.removeItem("tp_user");
              localStorage.removeItem("tp_colab");
              localStorage.removeItem("tp_remember");
              window.location.href = "/login";
            }}>🚪 Sair da conta</button>
          </div>

        </div>
      </div>

      {/* MODAL ADD/EDIT SERVIÇO */}
      {(showAddServico || showEditServico) && (
        <div className="overlay" onClick={fecharServico}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={fecharServico}>✕</button>
            {sOk ? (
              <div className="cp-success">
                <div className="cp-success-icon">✅</div>
                <h3>{showEditServico ? "Serviço atualizado!" : "Serviço adicionado!"}</h3>
                <p>As alterações foram salvas com sucesso.</p>
                <button className="modal-confirm" onClick={fecharServico}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:4 }}>
                  {showEditServico ? "✏️ Alterar serviço" : "➕ Adicionar serviço"}
                </p>
                <p style={{ fontSize:13, color:"#777", marginBottom:"1.25rem" }}>
                  {showEditServico ? "Edite as informações do serviço" : "Preencha os dados do novo serviço"}
                </p>
                <label className="cp-label">Título</label>
                <input className="cp-input" placeholder="Ex: Bate-papo" value={sTitulo} onChange={e => setSTitulo(e.target.value)} />
                <label className="cp-label">Descrição</label>
                <input className="cp-input" placeholder="Ex: Sessão de 30min" value={sDesc} onChange={e => setSDesc(e.target.value)} />
                <div className="cp-row">
                  <div><label className="cp-label">Preço (R$)</label><input className="cp-input" type="number" placeholder="1000" value={sPreco} onChange={e => setSPreco(e.target.value)} /></div>
                  <div><label className="cp-label">Duração (min)</label><input className="cp-input" type="number" placeholder="30" value={sDur} onChange={e => setSDur(e.target.value)} /></div>
                </div>
                <button className="modal-confirm" disabled={!sTitulo || !sDesc || !sPreco || !sDur} onClick={salvarServico}>
                  {showEditServico ? "Salvar alterações →" : "Adicionar serviço →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL INDISPONÍVEL */}
      {showIndisponivel && (
        <div className="overlay" onClick={() => setShowIndisp(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowIndisp(false)}>✕</button>
            <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"#fff" }}>Serviço indisponível</h3>
            <p style={{ fontSize:13, color:"#888", lineHeight:1.6 }}>Este serviço está atualmente indisponível. Em breve estará disponível!</p>
            <button className="modal-confirm" onClick={() => setShowIndisp(false)}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
