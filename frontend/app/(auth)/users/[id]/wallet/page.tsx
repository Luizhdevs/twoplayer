"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type Transacao = {
  id: number;
  tipo: "recarga" | "gasto" | "resgate";
  descricao: string;
  valor: number;
  data: string;
};

type Cartao = {
  id: number;
  numero: string;
  nome: string;
  validade: string;
  bandeira: string;
};

const TRANSACOES_MOCK: Transacao[] = [
  { id: 1, tipo: "recarga", descricao: "Recarga via Pix",          valor: 100.00, data: "2026-04-20" },
  { id: 2, tipo: "gasto",   descricao: "Bate-papo com Neymar",     valor: 50.00,  data: "2026-04-18" },
  { id: 3, tipo: "recarga", descricao: "Recarga via cartão",       valor: 200.00, data: "2026-04-15" },
  { id: 4, tipo: "gasto",   descricao: "Partida de CS com Gaules", valor: 100.00, data: "2026-04-10" },
];

const VALORES_RAPIDOS = [10, 20, 50, 100, 200, 500];
const TAXA_RESGATE = 0.15;

function maskNumero(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function maskValidade(v: string) {
  return v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");
}
function maskCvv(v: string) {
  return v.replace(/\D/g, "").slice(0, 4);
}
function detectaBandeira(numero: string): string {
  const n = numero.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Elo";
  return "";
}
function bandeiraEmoji(bandeira: string) {
  const m: Record<string, string> = { Visa: "💳", Mastercard: "🔴", Amex: "🟦", Elo: "🟡" };
  return m[bandeira] ?? "💳";
}

function QrCodeIndisponivel() {
  return (
    <div style={{ textAlign:"center", background:"#0d0d0d", borderRadius:12, padding:"1.25rem", marginBottom:"1rem", border:"1px solid rgba(0,0,0,0.07)" }}>
      <div style={{ position:"relative", width:140, height:140, margin:"0 auto 10px" }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <rect width="140" height="140" fill="#fff" rx="8"/>
          {/* canto superior esquerdo */}
          <rect x="10" y="10" width="35" height="35" fill="none" stroke="#ccc" strokeWidth="4"/>
          <rect x="16" y="16" width="23" height="23" fill="#ddd"/>
          {/* canto superior direito */}
          <rect x="95" y="10" width="35" height="35" fill="none" stroke="#ccc" strokeWidth="4"/>
          <rect x="101" y="16" width="23" height="23" fill="#ddd"/>
          {/* canto inferior esquerdo */}
          <rect x="10" y="95" width="35" height="35" fill="none" stroke="#ccc" strokeWidth="4"/>
          <rect x="16" y="101" width="23" height="23" fill="#ddd"/>
          {/* pixels do meio */}
          <rect x="55" y="10" width="8" height="8" fill="#ddd"/>
          <rect x="67" y="10" width="8" height="8" fill="#ddd"/>
          <rect x="79" y="10" width="8" height="8" fill="#ddd"/>
          <rect x="55" y="22" width="8" height="8" fill="#ddd"/>
          <rect x="79" y="22" width="8" height="8" fill="#ddd"/>
          <rect x="67" y="34" width="8" height="8" fill="#ddd"/>
          <rect x="55" y="55" width="8" height="8" fill="#ddd"/>
          <rect x="67" y="55" width="8" height="8" fill="#ddd"/>
          <rect x="79" y="55" width="8" height="8" fill="#ddd"/>
          <rect x="55" y="67" width="8" height="8" fill="#ddd"/>
          <rect x="79" y="67" width="8" height="8" fill="#ddd"/>
          <rect x="67" y="79" width="8" height="8" fill="#ddd"/>
          <rect x="95" y="55" width="8" height="8" fill="#ddd"/>
          <rect x="107" y="55" width="8" height="8" fill="#ddd"/>
          <rect x="119" y="55" width="8" height="8" fill="#ddd"/>
          <rect x="95" y="67" width="8" height="8" fill="#ddd"/>
          <rect x="107" y="79" width="8" height="8" fill="#ddd"/>
          <rect x="119" y="67" width="8" height="8" fill="#ddd"/>
          <rect x="55" y="95" width="8" height="8" fill="#ddd"/>
          <rect x="67" y="107" width="8" height="8" fill="#ddd"/>
          <rect x="79" y="95" width="8" height="8" fill="#ddd"/>
          <rect x="55" y="119" width="8" height="8" fill="#ddd"/>
          <rect x="79" y="119" width="8" height="8" fill="#ddd"/>
          <rect x="67" y="119" width="8" height="8" fill="#ddd"/>
          <rect x="107" y="95" width="8" height="8" fill="#ddd"/>
          <rect x="119" y="107" width="8" height="8" fill="#ddd"/>
          <rect x="95" y="119" width="8" height="8" fill="#ddd"/>
          <rect x="119" y="95" width="8" height="8" fill="#ddd"/>
          {/* X vermelho por cima */}
          <line x1="15" y1="15" x2="125" y2="125" stroke="#dc2626" strokeWidth="9" strokeLinecap="round"/>
          <line x1="125" y1="15" x2="15" y2="125" stroke="#dc2626" strokeWidth="9" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize:13, fontWeight:700, color:"#dc2626", marginBottom:4 }}>Pix indisponível</p>
      <p style={{ fontSize:11, color:"#999", lineHeight:1.5 }}>Este método de pagamento está temporariamente indisponível. Use o cartão.</p>
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isColab, setIsColab] = useState(false);

  useEffect(() => {
    const colabStr = localStorage.getItem("tp_colab");
    const userStr  = localStorage.getItem("tp_user");
    if (colabStr) {
      const colab = JSON.parse(colabStr);
      if (String(colab.id) === String(id) && !userStr) {
        setIsColab(true);
        return;
      }
    }
    setIsColab(false);
  }, [id]);

  const [transacoes, setTransacoes] = useState<Transacao[]>(TRANSACOES_MOCK);
  const [saldo, setSaldo]           = useState(150.00);
  const [cartoes, setCartoes]       = useState<Cartao[]>([]);
  const [abaAtiva, setAbaAtiva]     = useState<"todos"|"recargas"|"gastos">("todos");

  const [showRecarga,  setShowRecarga]  = useState(false);
  const [showCartao,   setShowCartao]   = useState(false);
  const [showReceber,  setShowReceber]  = useState(false);

  const [valorRecarga,    setValorRecarga]    = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"pix"|"cartao"|"">("");
  const [recargaFeita,    setRecargaFeita]    = useState(false);

  const [cNumero,   setCNumero]   = useState("");
  const [cNome,     setCNome]     = useState("");
  const [cValidade, setCValidade] = useState("");
  const [cCvv,      setCCvv]      = useState("");
  const [cCartaoOk, setCCartaoOk] = useState(false);
  const [cErro,     setCErro]     = useState("");

  const [chavePix,      setChavePix]      = useState("");
  const [chavePixSalva, setChavePixSalva] = useState("");
  const [editandoPix,   setEditandoPix]   = useState(false);
  const [valorResgate,  setValorResgate]  = useState("");
  const [resgateOk,     setResgateOk]     = useState(false);
  const [resgateErro,   setResgateErro]   = useState("");

  const totalRecargas = transacoes.filter(t => t.tipo === "recarga").reduce((a,t) => a + t.valor, 0);
  const totalGastos   = transacoes.filter(t => t.tipo === "gasto").reduce((a,t) => a + t.valor, 0);
  const txFiltradas   = transacoes.filter(t =>
    abaAtiva === "todos" ? true : abaAtiva === "recargas" ? t.tipo === "recarga" : t.tipo === "gasto"
  );

  const valorResgateNum = parseFloat(valorResgate) || 0;
  const taxaValor       = valorResgateNum * TAXA_RESGATE;
  const valorLiquido    = valorResgateNum - taxaValor;

  function formatData(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" });
  }

  function handleConfirmarRecarga() {
    const valor = parseFloat(valorRecarga);
    if (!valor || valor <= 0 || metodoPagamento !== "cartao") return;
    setTransacoes(prev => [{ id: Date.now(), tipo: "recarga", descricao: "Recarga via Cartão", valor, data: new Date().toISOString().split("T")[0] }, ...prev]);
    setSaldo(prev => prev + valor);
    setRecargaFeita(true);
  }
  function handleFecharRecarga() {
    setShowRecarga(false); setValorRecarga(""); setMetodoPagamento(""); setRecargaFeita(false);
  }

  const bandeiraDetectada = detectaBandeira(cNumero);
  const cartaoValido = cNumero.replace(/\s/g,"").length === 16 && cNome.trim().length >= 3 && cValidade.length === 5 && (cCvv.length === 3 || cCvv.length === 4);

  function handleCadastrarCartao() {
    if (!cartaoValido) { setCErro("Preencha todos os campos corretamente."); return; }
    const [mes, ano] = cValidade.split("/");
    const expiry = new Date(2000 + parseInt(ano), parseInt(mes) - 1);
    if (expiry < new Date()) { setCErro("Cartão vencido."); return; }
    setCartoes(prev => [{ id: Date.now(), numero: cNumero.replace(/\s/g,"").slice(-4), nome: cNome, validade: cValidade, bandeira: bandeiraDetectada || "Cartão" }, ...prev]);
    setCCartaoOk(true); setCErro("");
  }
  function handleFecharCartao() {
    setShowCartao(false); setCNumero(""); setCNome(""); setCValidade(""); setCCvv(""); setCCartaoOk(false); setCErro("");
  }

  function handleSalvarPix() {
    if (!chavePix.trim()) return;
    setChavePixSalva(chavePix.trim());
    setEditandoPix(false);
  }
  function handleResgate() {
    setResgateErro("");
    if (!valorResgateNum || valorResgateNum <= 0) { setResgateErro("Digite um valor válido."); return; }
    if (valorResgateNum > saldo) { setResgateErro("Saldo insuficiente."); return; }
    setTransacoes(prev => [{ id: Date.now(), tipo: "resgate" as const, descricao: "Resgate via Pix (taxa 15%)", valor: valorResgateNum, data: new Date().toISOString().split("T")[0] }, ...prev]);
    setSaldo(prev => prev - valorResgateNum);
    setResgateOk(true);
  }
  function handleFecharReceber() {
    setShowReceber(false); setValorResgate(""); setResgateOk(false); setResgateErro("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        .wl * { font-family:'Sora',sans-serif; box-sizing:border-box; }
        .wl-card { background:#1a1a1a; border-radius:18px; border:1px solid rgba(255,255,255,0.07); box-shadow:0 4px 24px rgba(0,0,0,0.07); padding:1.75rem; margin-bottom:1.25rem; }
        .wl-section-title { font-size:15px; font-weight:700; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:8px; }
        .wl-section-title::before { content:''; display:block; width:3px; height:16px; background:#fd5b01; border-radius:2px; }
        .wl-hero { background:linear-gradient(135deg,#fd5b01,#ff8c42); border-radius:18px; padding:2rem; margin-bottom:1.25rem; box-shadow:0 8px 24px rgba(253,91,1,0.3); color:#fff; }
        .wl-hero-label { font-size:12px; font-weight:600; opacity:.8; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
        .wl-hero-value { font-size:40px; font-weight:700; letter-spacing:-.03em; margin-bottom:20px; }
        .wl-hero-stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .wl-stat { background:rgba(255,255,255,.15); border-radius:12px; padding:12px 14px; }
        .wl-stat-label { font-size:10px; opacity:.8; font-weight:600; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
        .wl-stat-value { font-size:17px; font-weight:700; }
        .wl-actions { display:grid; gap:10px; margin-bottom:1.25rem; }
        .wl-actions-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .wl-add-btn { padding:14px; background:#fd5b01; color:#fff; border:none; border-radius:12px; font-family:'Sora',sans-serif; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(253,91,1,0.35); transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .wl-add-btn:hover { background:#d94d00; }
        .wl-add-btn:active { transform:scale(.98); }
        .wl-card-btn { padding:14px; background:#1a1a1a; color:#fd5b01; border:2px solid #fd5b01; border-radius:12px; font-family:'Sora',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .wl-card-btn:hover { background:#ffd6bf; }
        .wl-receber-btn { padding:14px; background:#16a34a; color:#fff; border:none; border-radius:12px; font-family:'Sora',sans-serif; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(22,163,74,0.3); transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .wl-receber-btn:hover { background:#15803d; }
        .wl-receber-btn:active { transform:scale(.98); }
        .wl-saved-card { display:flex; align-items:center; gap:12px; padding:12px 14px; background:#0d0d0d; border-radius:12px; border:1px solid rgba(255,255,255,0.07); margin-bottom:8px; }
        .wl-saved-card-icon { font-size:24px; }
        .wl-saved-card-info p { font-size:13px; font-weight:700; color:#fff; margin-bottom:2px; }
        .wl-saved-card-info span { font-size:11px; color:#666; }
        .wl-tabs { display:flex; background:#0d0d0d; border-radius:10px; padding:4px; margin-bottom:1rem; }
        .wl-tab { flex:1; padding:8px; background:none; border:none; border-radius:8px; font-family:'Sora',sans-serif; font-size:12px; font-weight:500; color:#888; cursor:pointer; transition:all .2s; }
        .wl-tab.active { background:#1a1a1a; color:#fd5b01; font-weight:700; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .wl-tx { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.06); }
        .wl-tx:last-child { border-bottom:none; padding-bottom:0; }
        .wl-tx-icon { width:40px; height:40px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .wl-tx-icon.recarga { background:rgba(22,163,74,0.1); }
        .wl-tx-icon.gasto { background:rgba(253,91,1,0.1); }
        .wl-tx-icon.resgate { background:rgba(22,163,74,0.1); }
        .wl-tx-desc { flex:1; }
        .wl-tx-desc p { font-size:13px; font-weight:600; color:#fff; margin-bottom:2px; }
        .wl-tx-desc span { font-size:11px; color:#666; }
        .wl-tx-valor { font-size:15px; font-weight:700; }
        .wl-tx-valor.recarga { color:#16a34a; }
        .wl-tx-valor.gasto { color:#fd5b01; }
        .wl-tx-valor.resgate { color:#16a34a; }
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn .2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box { background:#1a1a1a; border-radius:20px; padding:2rem; width:100%; max-width:420px; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.18); animation:popIn .25s ease; font-family:'Sora',sans-serif; max-height:90vh; overflow-y:auto; }
        @keyframes popIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .modal-close { position:absolute; top:14px; right:14px; background:#0d0d0d; border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-size:14px; color:#888; transition:all .15s; }
        .modal-close:hover { background:#fd5b01; color:#fff; }
        .wl-input-valor { width:100%; padding:12px 14px; background:#0d0d0d; border:1.5px solid rgba(0,0,0,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:22px; font-weight:700; color:#fff; outline:none; text-align:center; margin-bottom:1rem; transition:border-color .2s,box-shadow .2s; }
        .wl-input-valor:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.1); }
        .wl-input-valor::placeholder { color:#ccc; font-size:16px; font-weight:400; }
        .wl-rapidos { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:1.25rem; }
        .wl-rapido-btn { padding:9px; background:#0d0d0d; border:1.5px solid rgba(0,0,0,0.08); border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#444; cursor:pointer; transition:all .15s; text-align:center; }
        .wl-rapido-btn:hover,.wl-rapido-btn.sel { background:#ffd6bf; border-color:#fd5b01; color:#fd5b01; }
        .wl-metodos { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:.75rem; }
        .wl-metodo-btn { padding:12px; background:#0d0d0d; border:1.5px solid rgba(0,0,0,0.08); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#444; cursor:pointer; transition:all .15s; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; }
        .wl-metodo-btn:hover,.wl-metodo-btn.sel { background:#ffd6bf; border-color:#fd5b01; color:#fd5b01; }
        .wl-metodo-btn.pix-sel { background:rgba(220,38,38,0.07); border-color:#dc2626; color:#dc2626; }
        .wl-metodo-btn .icon { font-size:22px; }
        .cc-label { font-size:11px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; display:block; }
        .cc-input { width:100%; padding:11px 14px; background:#0d0d0d; border:1.5px solid rgba(0,0,0,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:14px; font-weight:600; color:#fff; outline:none; margin-bottom:1rem; transition:border-color .2s,box-shadow .2s; }
        .cc-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.1); }
        .cc-input::placeholder { color:#bbb; font-weight:400; }
        .cc-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .cc-bandeira { display:inline-flex; align-items:center; gap:6px; background:#ffd6bf; color:#fd5b01; font-size:11px; font-weight:700; padding:3px 10px; border-radius:100px; margin-bottom:8px; }
        .cc-erro { background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.2); color:#dc2626; border-radius:8px; padding:10px 14px; font-size:13px; margin-bottom:1rem; }
        .wl-confirmar { width:100%; padding:12px; background:#fd5b01; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s; }
        .wl-confirmar:hover:not(:disabled) { background:#d94d00; }
        .wl-confirmar:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }
        .wl-confirmar-green { width:100%; padding:12px; background:#16a34a; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(22,163,74,0.3); transition:background .2s; }
        .wl-confirmar-green:hover:not(:disabled) { background:#15803d; }
        .wl-confirmar-green:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }
        .wl-success { text-align:center; padding:1rem 0; }
        .wl-success-icon { font-size:52px; margin-bottom:12px; }
        .wl-success h3 { font-size:20px; font-weight:700; color:#fff; margin-bottom:8px; letter-spacing:-.02em; }
        .wl-success p { font-size:13px; color:#666; margin-bottom:1.5rem; line-height:1.6; }
        .wl-back-btn { display:flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#fd5b01; padding:0; margin-bottom:1.5rem; transition:opacity .2s; }
        .wl-back-btn:hover { opacity:.7; }
        .pix-salvo { background:#0d0d0d; border-radius:10px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:1rem; border:1px solid rgba(255,255,255,0.07); }
        .pix-salvo-key { font-size:13px; font-weight:700; color:#fff; }
        .pix-salvo-edit { background:none; border:none; color:#fd5b01; font-family:'Sora',sans-serif; font-size:12px; font-weight:700; cursor:pointer; padding:4px 8px; border-radius:6px; transition:background .15s; }
        .pix-salvo-edit:hover { background:#ffd6bf; }
        .taxa-box { background:#1a1a1a8f5; border:1px solid rgba(253,91,1,0.2); border-radius:10px; padding:14px; margin:1rem 0; }
        .taxa-row { display:flex; justify-content:space-between; font-size:13px; color:#888; margin-bottom:6px; }
        .taxa-row:last-child { margin-bottom:0; border-top:1px solid rgba(0,0,0,0.08); padding-top:8px; font-weight:700; color:#fff; }
        .taxa-row span:last-child { color:#fd5b01; }
        .taxa-row.liquido span:last-child { color:#16a34a; }
        .pix-sem-chave { background:#1a1a1a8f5; border:1px solid rgba(253,91,1,0.15); border-radius:10px; padding:12px 14px; font-size:12px; color:#666; text-align:center; margin-bottom:1rem; }
      `}</style>

      <div className="wl" style={{ background:"#0d0d0d", minHeight:"100vh", padding:"4rem 1.5rem" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>

          <button className="wl-back-btn" onClick={() => router.push(isColab ? `/colaborador/${id}/perfil` : `/users/${id}/profile`)}>
            ← Voltar ao perfil
          </button>

          <div className="wl-hero">
            <div className="wl-hero-label">👛 Minha Carteira</div>
            <div className="wl-hero-value">R$ {saldo.toFixed(2).replace(".",",")}</div>
            <div className="wl-hero-stats">
              <div className="wl-stat"><div className="wl-stat-label">↑ Total recarregado</div><div className="wl-stat-value">R$ {totalRecargas.toFixed(2).replace(".",",")}</div></div>
              <div className="wl-stat"><div className="wl-stat-label">↓ Total gasto</div><div className="wl-stat-value">R$ {totalGastos.toFixed(2).replace(".",",")}</div></div>
            </div>
          </div>

          <div className="wl-actions">
            <div className="wl-actions-row">
              <button className="wl-add-btn" onClick={() => setShowRecarga(true)}>+ Adicionar saldo</button>
              <button className="wl-card-btn" onClick={() => setShowCartao(true)}>💳 Cadastrar cartão</button>
            </div>
            {isColab && (
              <button className="wl-receber-btn" onClick={() => setShowReceber(true)}>
                💸 Receber / Resgatar saldo
              </button>
            )}
          </div>

          {cartoes.length > 0 && (
            <div className="wl-card">
              <div className="wl-section-title">Meus Cartões</div>
              {cartoes.map(c => (
                <div key={c.id} className="wl-saved-card">
                  <div className="wl-saved-card-icon">{bandeiraEmoji(c.bandeira)}</div>
                  <div className="wl-saved-card-info"><p>{c.bandeira} •••• {c.numero}</p><span>{c.nome} · Válido até {c.validade}</span></div>
                </div>
              ))}
            </div>
          )}

          <div className="wl-card">
            <div className="wl-section-title">Histórico</div>
            <div className="wl-tabs">
              <button className={`wl-tab ${abaAtiva==="todos"?"active":""}`} onClick={() => setAbaAtiva("todos")}>Todos</button>
              <button className={`wl-tab ${abaAtiva==="recargas"?"active":""}`} onClick={() => setAbaAtiva("recargas")}>Recargas</button>
              <button className={`wl-tab ${abaAtiva==="gastos"?"active":""}`} onClick={() => setAbaAtiva("gastos")}>Gastos</button>
            </div>
            {txFiltradas.length === 0 ? (
              <p style={{ fontSize:13, color:"#999", textAlign:"center", padding:"1rem 0" }}>Nenhuma transação encontrada.</p>
            ) : txFiltradas.map(t => (
              <div key={t.id} className="wl-tx">
                <div className={`wl-tx-icon ${t.tipo}`}>{t.tipo==="recarga"?"💰":t.tipo==="resgate"?"💸":"🔗"}</div>
                <div className="wl-tx-desc"><p>{t.descricao}</p><span>{formatData(t.data)}</span></div>
                <div className={`wl-tx-valor ${t.tipo}`}>{t.tipo==="gasto" ? "- " : "+ "} R$ {t.valor.toFixed(2).replace(".",",")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL RECARGA ── */}
      {showRecarga && (
        <div className="overlay" onClick={handleFecharRecarga}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleFecharRecarga}>✕</button>
            {recargaFeita ? (
              <div className="wl-success">
                <div className="wl-success-icon">✅</div>
                <h3>Saldo adicionado!</h3>
                <p>Seu saldo foi atualizado com sucesso.</p>
                <div style={{ background:"#0d0d0d", borderRadius:10, padding:"14px 16px", marginBottom:"1.25rem", fontSize:18, fontWeight:700, color:"#fd5b01", textAlign:"center" }}>
                  + R$ {parseFloat(valorRecarga).toFixed(2).replace(".",",")}
                </div>
                <button className="wl-confirmar" onClick={handleFecharRecarga}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:4 }}>💰 Adicionar saldo</p>
                <p style={{ fontSize:13, color:"#777", marginBottom:"1.25rem" }}>Escolha um valor ou digite o valor desejado</p>
                <div className="wl-rapidos">
                  {VALORES_RAPIDOS.map(v => (
                    <button key={v} className={`wl-rapido-btn ${valorRecarga===String(v)?"sel":""}`} onClick={() => setValorRecarga(String(v))}>R$ {v}</button>
                  ))}
                </div>
                <input className="wl-input-valor" type="number" placeholder="Ou digite o valor" min="1" value={valorRecarga} onChange={e => setValorRecarga(e.target.value)} />

                <p style={{ fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Método de pagamento</p>
                <div className="wl-metodos">
                  {/* Botão Pix — seleciona mas mostra QR indisponível */}
                  <button
                    className={`wl-metodo-btn ${metodoPagamento==="pix" ? "pix-sel" : ""}`}
                    onClick={() => setMetodoPagamento("pix")}
                  >
                    <span className="icon">⚡</span>Pix
                  </button>
                  <button
                    className={`wl-metodo-btn ${metodoPagamento==="cartao"?"sel":""}`}
                    onClick={() => setMetodoPagamento("cartao")}
                  >
                    <span className="icon">💳</span>Cartão
                  </button>
                </div>

                {/* QR Code indisponível — aparece ao selecionar Pix */}
                {metodoPagamento === "pix" && <QrCodeIndisponivel />}

                <button
                  className="wl-confirmar"
                  disabled={!valorRecarga || parseFloat(valorRecarga)<=0 || !metodoPagamento || metodoPagamento==="pix"}
                  onClick={handleConfirmarRecarga}
                >
                  Confirmar recarga →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL CADASTRAR CARTÃO ── */}
      {showCartao && (
        <div className="overlay" onClick={handleFecharCartao}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleFecharCartao}>✕</button>
            {cCartaoOk ? (
              <div className="wl-success">
                <div className="wl-success-icon">💳</div>
                <h3>Cartão cadastrado!</h3>
                <p>Seu cartão foi salvo com sucesso.</p>
                <div style={{ background:"#0d0d0d", borderRadius:12, padding:"14px 16px", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:28 }}>{bandeiraEmoji(bandeiraDetectada)}</span>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:"#000", marginBottom:2 }}>{bandeiraDetectada || "Cartão"} •••• {cNumero.replace(/\s/g,"").slice(-4)}</p>
                    <span style={{ fontSize:12, color:"#777" }}>{cNome} · Válido até {cValidade}</span>
                  </div>
                </div>
                <button className="wl-confirmar" onClick={handleFecharCartao}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:4 }}>💳 Cadastrar cartão</p>
                <p style={{ fontSize:13, color:"#777", marginBottom:"1.25rem" }}>Preencha os dados do seu cartão</p>
                <label className="cc-label">Número do cartão</label>
                {bandeiraDetectada && <div className="cc-bandeira">{bandeiraEmoji(bandeiraDetectada)} {bandeiraDetectada}</div>}
                <input className="cc-input" placeholder="0000 0000 0000 0000" value={cNumero} onChange={e => setCNumero(maskNumero(e.target.value))} maxLength={19} inputMode="numeric" />
                <label className="cc-label">Nome impresso no cartão</label>
                <input className="cc-input" placeholder="JOÃO DA SILVA" value={cNome} onChange={e => setCNome(e.target.value.toUpperCase())} maxLength={26} />
                <div className="cc-row">
                  <div><label className="cc-label">Validade</label><input className="cc-input" placeholder="MM/AA" value={cValidade} onChange={e => setCValidade(maskValidade(e.target.value))} maxLength={5} inputMode="numeric" /></div>
                  <div><label className="cc-label">CVV</label><input className="cc-input" placeholder="123" value={cCvv} onChange={e => setCCvv(maskCvv(e.target.value))} maxLength={4} inputMode="numeric" type="password" /></div>
                </div>
                {cErro && <div className="cc-erro">{cErro}</div>}
                <button className="wl-confirmar" disabled={!cartaoValido} onClick={handleCadastrarCartao}>Salvar cartão →</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL RECEBER (COLABORADOR) ── */}
      {showReceber && (
        <div className="overlay" onClick={handleFecharReceber}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleFecharReceber}>✕</button>
            {resgateOk ? (
              <div className="wl-success">
                <div className="wl-success-icon">💸</div>
                <h3>Resgate solicitado!</h3>
                <p>O valor líquido será enviado para sua chave Pix em até 1 dia útil.</p>
                <div className="taxa-box">
                  <div className="taxa-row"><span>Valor solicitado</span><span>R$ {valorResgateNum.toFixed(2).replace(".",",")}</span></div>
                  <div className="taxa-row"><span>Taxa TwoPlayers (15%)</span><span>- R$ {taxaValor.toFixed(2).replace(".",",")}</span></div>
                  <div className="taxa-row liquido"><span>Você receberá</span><span>R$ {valorLiquido.toFixed(2).replace(".",",")}</span></div>
                </div>
                <p style={{ fontSize:12, color:"#999", marginBottom:"1.25rem" }}>Chave Pix: <strong>{chavePixSalva}</strong></p>
                <button className="wl-confirmar" onClick={handleFecharReceber}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:4 }}>💸 Receber saldo</p>
                <p style={{ fontSize:13, color:"#777", marginBottom:"1.25rem" }}>Saldo disponível: <strong style={{ color:"#fd5b01" }}>R$ {saldo.toFixed(2).replace(".",",")}</strong></p>
                <label className="cc-label">Chave Pix</label>
                {chavePixSalva && !editandoPix ? (
                  <div className="pix-salvo">
                    <span className="pix-salvo-key">⚡ {chavePixSalva}</span>
                    <button className="pix-salvo-edit" onClick={() => { setEditandoPix(true); setChavePix(chavePixSalva); }}>✏️ Editar</button>
                  </div>
                ) : (
                  <>
                    <input className="cc-input" placeholder="CPF, e-mail, telefone ou chave aleatória" value={chavePix} onChange={e => setChavePix(e.target.value)} />
                    <button style={{ width:"100%", padding:"10px", background:"#fd5b01", color:"#fff", border:"none", borderRadius:8, fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", marginBottom:"1rem", opacity: chavePix.trim() ? 1 : 0.35 }} disabled={!chavePix.trim()} onClick={handleSalvarPix}>
                      Salvar chave Pix
                    </button>
                  </>
                )}
                {!chavePixSalva && !editandoPix && (
                  <div className="pix-sem-chave">Cadastre uma chave Pix para habilitar o resgate</div>
                )}
                {chavePixSalva && !editandoPix && (
                  <>
                    <label className="cc-label">Valor a resgatar</label>
                    <input className="wl-input-valor" type="number" placeholder="R$ 0,00" min="1" max={saldo} value={valorResgate} onChange={e => setValorResgate(e.target.value)} />
                    {valorResgateNum > 0 && (
                      <div className="taxa-box">
                        <div className="taxa-row"><span>Valor solicitado</span><span>R$ {valorResgateNum.toFixed(2).replace(".",",")}</span></div>
                        <div className="taxa-row"><span>Taxa TwoPlayers (15%)</span><span>- R$ {taxaValor.toFixed(2).replace(".",",")}</span></div>
                        <div className="taxa-row liquido"><span>Você receberá</span><span>R$ {valorLiquido.toFixed(2).replace(".",",")}</span></div>
                      </div>
                    )}
                    {resgateErro && <div className="cc-erro">{resgateErro}</div>}
                    <button className="wl-confirmar-green" disabled={!valorResgate || valorResgateNum <= 0 || valorResgateNum > saldo} onClick={handleResgate}>
                      Resgatar valor →
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
