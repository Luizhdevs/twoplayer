"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useWallet } from "@/hooks/useWallet";
import type { WalletTransaction } from "@/services/wallet.service";

type Cartao = {
  id: number;
  numero: string;
  nome: string;
  validade: string;
  bandeira: string;
};

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
    <div style={{ textAlign: "center", background: "var(--bg,#0d0d0d)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 10px" }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <rect width="140" height="140" fill="#1a1a1a" rx="8"/>
          <rect x="10" y="10" width="35" height="35" fill="none" stroke="#333" strokeWidth="4"/>
          <rect x="16" y="16" width="23" height="23" fill="#2a2a2a"/>
          <rect x="95" y="10" width="35" height="35" fill="none" stroke="#333" strokeWidth="4"/>
          <rect x="101" y="16" width="23" height="23" fill="#2a2a2a"/>
          <rect x="10" y="95" width="35" height="35" fill="none" stroke="#333" strokeWidth="4"/>
          <rect x="16" y="101" width="23" height="23" fill="#2a2a2a"/>
          {[55,67,79].map(x => [10,22,34].map(y => <rect key={`${x}${y}`} x={x} y={y} width="8" height="8" fill="#2a2a2a"/>))}
          {[55,67,79].map(x => [55,67,79].map(y => <rect key={`m${x}${y}`} x={x} y={y} width="8" height="8" fill="#2a2a2a"/>))}
          <line x1="15" y1="15" x2="125" y2="125" stroke="#f87171" strokeWidth="9" strokeLinecap="round"/>
          <line x1="125" y1="15" x2="15" y2="125" stroke="#f87171" strokeWidth="9" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>Pix indisponível</p>
      <p style={{ fontSize: 11, color: "var(--t3,#666)", lineHeight: 1.5 }}>Temporariamente indisponível. Use o cartão.</p>
    </div>
  );
}

function WalletSkeleton() {
  return (
    <div style={{ background: "var(--bg,#0d0d0d)", minHeight: "100vh", padding: "5.5rem 1.5rem 3rem" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="sk" style={{ width: 120, height: 13, borderRadius: 6, marginBottom: "1.5rem" }} />
        {/* Hero */}
        <div className="sk" style={{ width: "100%", height: 160, borderRadius: 18, marginBottom: "1rem" }} />
        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
          <div className="sk" style={{ height: 52, borderRadius: 12 }} />
          <div className="sk" style={{ height: 52, borderRadius: 12 }} />
        </div>
        {/* History card */}
        <div style={{ background: "#1a1a1a", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", padding: "1.5rem" }}>
          <div className="sk sk-h16" style={{ width: 120, marginBottom: "1rem", borderRadius: 6 }} />
          <div className="sk" style={{ height: 40, borderRadius: 10, marginBottom: "1rem" }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
              <div className="sk" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="sk sk-h13" style={{ width: "60%", marginBottom: 8, borderRadius: 5 }} />
                <div className="sk sk-h10" style={{ width: "40%", borderRadius: 5 }} />
              </div>
              <div className="sk sk-h16" style={{ width: 60, borderRadius: 5 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { dbUser } = useAuth();

  const isColab = dbUser?.role === "PROVIDER";

  const { data: walletData, isLoading: walletLoading } = useWallet(id);
  const saldo = walletData?.balance ?? 0;
  const transactions: WalletTransaction[] = walletData?.transactions ?? [];

  const [cartoes, setCartoes]           = useState<Cartao[]>([]);
  const [abaAtiva, setAbaAtiva]         = useState<"todos" | "recargas" | "gastos">("todos");

  const [showRecarga,  setShowRecarga]  = useState(false);
  const [showCartao,   setShowCartao]   = useState(false);
  const [showReceber,  setShowReceber]  = useState(false);

  const [valorRecarga,    setValorRecarga]    = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao" | "">("");
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

  const totalRecargas = transactions
    .filter(t => t.type === "credit" || t.type === "refund")
    .reduce((a, t) => a + t.amount, 0);
  const totalGastos = transactions
    .filter(t => t.type === "debit" || t.type === "withdrawal")
    .reduce((a, t) => a + t.amount, 0);

  const txFiltradas = transactions.filter(t => {
    if (abaAtiva === "todos") return true;
    if (abaAtiva === "recargas") return t.type === "credit" || t.type === "refund";
    return t.type === "debit" || t.type === "withdrawal";
  });

  function txTipo(t: WalletTransaction): "recarga" | "gasto" | "resgate" {
    if (t.type === "credit" || t.type === "refund") return "recarga";
    if (t.type === "withdrawal") return "resgate";
    return "gasto";
  }
  function txSinal(t: WalletTransaction) {
    return t.type === "credit" || t.type === "refund" ? "+ " : "- ";
  }

  const valorResgateNum = parseFloat(valorResgate) || 0;
  const taxaValor       = valorResgateNum * TAXA_RESGATE;
  const valorLiquido    = valorResgateNum - taxaValor;

  function handleConfirmarRecarga() {
    const valor = parseFloat(valorRecarga);
    if (!valor || valor <= 0 || metodoPagamento !== "cartao") return;
    setRecargaFeita(true);
  }
  function handleFecharRecarga() {
    setShowRecarga(false); setValorRecarga(""); setMetodoPagamento(""); setRecargaFeita(false);
  }

  const bandeiraDetectada = detectaBandeira(cNumero);
  const cartaoValido = cNumero.replace(/\s/g, "").length === 16 && cNome.trim().length >= 3 && cValidade.length === 5 && (cCvv.length === 3 || cCvv.length === 4);

  function handleCadastrarCartao() {
    if (!cartaoValido) { setCErro("Preencha todos os campos corretamente."); return; }
    const [mes, ano] = cValidade.split("/");
    const expiry = new Date(2000 + parseInt(ano), parseInt(mes) - 1);
    if (expiry < new Date()) { setCErro("Cartão vencido."); return; }
    setCartoes(prev => [{ id: Date.now(), numero: cNumero.replace(/\s/g, "").slice(-4), nome: cNome, validade: cValidade, bandeira: bandeiraDetectada || "Cartão" }, ...prev]);
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
    setResgateOk(true);
  }
  function handleFecharReceber() {
    setShowReceber(false); setValorResgate(""); setResgateOk(false); setResgateErro("");
  }

  if (walletLoading) return <WalletSkeleton />;

  return (
    <>
      <style>{`
        @keyframes wl-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wl-modal { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes wl-overlay { from{opacity:0} to{opacity:1} }

        .wl * { font-family: var(--font,'Sora',sans-serif); box-sizing: border-box; }
        .wl-page { background: var(--bg,#0d0d0d); min-height: 100vh; padding: 5.5rem 1.5rem 3rem; }
        .wl-inner { max-width: 600px; margin: 0 auto; }

        .wl-card {
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border,rgba(255,255,255,0.07));
          border-radius: 18px; padding: 1.5rem;
          margin-bottom: 1rem;
          animation: wl-in 0.3s ease both;
        }
        .wl-sec-title {
          font-size: 11px; font-weight: 700; color: var(--t3,#666);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;
        }
        .wl-sec-title::before { content:''; display:block; width:3px; height:12px; background:#fd5b01; border-radius:2px; flex-shrink:0; }

        /* Hero */
        .wl-hero {
          background: linear-gradient(135deg, #fd5b01 0%, #ff7a35 50%, #ff9a5c 100%);
          border-radius: 18px; padding: 1.75rem;
          margin-bottom: 1rem;
          box-shadow: 0 8px 32px rgba(253,91,1,0.35);
          color: #fff;
          animation: wl-in 0.3s ease both;
        }
        .wl-hero-label { font-size: 11px; font-weight: 700; opacity: 0.85; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
        .wl-hero-value { font-size: 42px; font-weight: 800; letter-spacing: -.04em; margin-bottom: 20px; line-height: 1; }
        .wl-hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .wl-stat { background: rgba(255,255,255,.18); border-radius: 12px; padding: 12px 14px; }
        .wl-stat-label { font-size: 10px; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
        .wl-stat-value { font-size: 17px; font-weight: 800; }

        /* Action buttons */
        .wl-actions { display: grid; gap: 10px; margin-bottom: 1rem; animation: wl-in 0.3s ease both; animation-delay: 0.06s; }
        .wl-actions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .wl-add-btn {
          padding: 14px; background: #fd5b01; color: #fff; border: none; border-radius: 12px;
          font-family: var(--font,'Sora',sans-serif); font-size: 14px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 16px rgba(253,91,1,0.35); transition: background .15s, transform .1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .wl-add-btn:hover   { background: #e04e00; }
        .wl-add-btn:active  { transform: scale(.98); }
        .wl-card-btn {
          padding: 14px; background: rgba(253,91,1,0.08); color: #fd5b01;
          border: 1.5px solid rgba(253,91,1,0.30); border-radius: 12px;
          font-family: var(--font,'Sora',sans-serif); font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .wl-card-btn:hover { background: rgba(253,91,1,0.15); }
        .wl-receber-btn {
          padding: 14px; background: var(--green,#4ade80); color: #111; border: none; border-radius: 12px;
          font-family: var(--font,'Sora',sans-serif); font-size: 14px; font-weight: 800; cursor: pointer;
          box-shadow: 0 4px 16px rgba(74,222,128,0.25); transition: filter .15s, transform .1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .wl-receber-btn:hover   { filter: brightness(1.1); }
        .wl-receber-btn:active  { transform: scale(.98); }

        /* Saved card chip */
        .wl-saved-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; margin-bottom: 8px;
        }
        .wl-saved-card-icon { font-size: 24px; }
        .wl-saved-card-info p    { font-size: 13px; font-weight: 700; color: #f0f0f0; margin-bottom: 2px; }
        .wl-saved-card-info span { font-size: 11px; color: var(--t3,#666); }

        /* Tabs */
        .wl-tabs { display: flex; background: var(--bg,#0d0d0d); border-radius: 10px; padding: 4px; margin-bottom: 1rem; gap: 4px; }
        .wl-tab {
          flex: 1; padding: 8px; background: none; border: none; border-radius: 8px;
          font-family: var(--font,'Sora',sans-serif); font-size: 12px; font-weight: 500;
          color: var(--t3,#666); cursor: pointer; transition: all .15s;
        }
        .wl-tab.active { background: var(--surface,#1a1a1a); color: #fd5b01; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }

        /* Transactions */
        .wl-tx { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .wl-tx:last-child { border-bottom: none; padding-bottom: 0; }
        .wl-tx-icon { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .wl-tx-icon.recarga  { background: var(--green-bg,rgba(74,222,128,0.10)); }
        .wl-tx-icon.gasto    { background: var(--brand-dim,rgba(253,91,1,0.12)); }
        .wl-tx-icon.resgate  { background: var(--green-bg,rgba(74,222,128,0.10)); }
        .wl-tx-desc { flex: 1; }
        .wl-tx-desc p    { font-size: 13px; font-weight: 600; color: #f0f0f0; margin-bottom: 2px; }
        .wl-tx-desc span { font-size: 11px; color: var(--t3,#666); }
        .wl-tx-valor         { font-size: 15px; font-weight: 700; }
        .wl-tx-valor.recarga { color: var(--green,#4ade80); }
        .wl-tx-valor.gasto   { color: var(--brand,#fd5b01); }
        .wl-tx-valor.resgate { color: var(--green,#4ade80); }

        /* Back btn */
        .wl-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-family: var(--font,'Sora',sans-serif); font-size: 13px; font-weight: 600;
          color: var(--brand,#fd5b01); padding: 0; margin-bottom: 1.5rem;
          transition: opacity .15s;
        }
        .wl-back-btn:hover { opacity: 0.7; }

        /* Empty state */
        .wl-empty { text-align: center; padding: 2.5rem 0; }
        .wl-empty-icon  { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }
        .wl-empty-text  { font-size: 13px; color: var(--t3,#666); }

        /* Modal */
        .wl-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: wl-overlay .2s ease; }
        .wl-modal   {
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border-2,rgba(255,255,255,0.12));
          border-radius: 20px; padding: 2rem; width: 100%; max-width: 420px;
          position: relative; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          animation: wl-modal .25s ease;
          font-family: var(--font,'Sora',sans-serif); max-height: 90vh; overflow-y: auto;
        }
        .wl-modal-close {
          position: absolute; top: 14px; right: 14px;
          background: rgba(255,255,255,0.06); border: none; border-radius: 7px;
          padding: 7px 11px; cursor: pointer; font-size: 14px; color: var(--t2,#aaa);
          transition: all .15s;
        }
        .wl-modal-close:hover { background: rgba(253,91,1,0.15); color: #fd5b01; }

        /* Modal inputs */
        .wl-input-valor {
          width: 100%; padding: 12px 14px;
          background: var(--bg,#0d0d0d); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; font-family: var(--font,'Sora',sans-serif);
          font-size: 22px; font-weight: 700; color: #fff; outline: none;
          text-align: center; margin-bottom: 1rem; transition: border-color .2s, box-shadow .2s;
        }
        .wl-input-valor:focus { border-color: #fd5b01; box-shadow: 0 0 0 3px rgba(253,91,1,0.12); }
        .wl-input-valor::placeholder { color: var(--t3,#666); font-size: 16px; font-weight: 400; }

        .wl-rapidos { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 1.25rem; }
        .wl-rapido-btn {
          padding: 9px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 8px; font-family: var(--font,'Sora',sans-serif); font-size: 13px;
          font-weight: 600; color: var(--t2,#aaa); cursor: pointer; transition: all .15s; text-align: center;
        }
        .wl-rapido-btn:hover, .wl-rapido-btn.sel { background: rgba(253,91,1,0.12); border-color: rgba(253,91,1,0.40); color: #fd5b01; }

        .wl-metodos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: .75rem; }
        .wl-metodo-btn {
          padding: 12px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; font-family: var(--font,'Sora',sans-serif); font-size: 13px; font-weight: 600;
          color: var(--t2,#aaa); cursor: pointer; transition: all .15s; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .wl-metodo-btn:hover, .wl-metodo-btn.sel { background: rgba(253,91,1,0.12); border-color: rgba(253,91,1,0.40); color: #fd5b01; }
        .wl-metodo-btn.pix-sel { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.35); color: #f87171; }
        .wl-metodo-btn .icon { font-size: 22px; }

        .cc-label { font-size: 11px; font-weight: 700; color: var(--t3,#666); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; display: block; }
        .cc-input {
          width: 100%; padding: 11px 14px;
          background: var(--bg,#0d0d0d); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; font-family: var(--font,'Sora',sans-serif);
          font-size: 14px; font-weight: 600; color: #fff; outline: none; margin-bottom: 1rem;
          transition: border-color .2s, box-shadow .2s;
        }
        .cc-input:focus { border-color: #fd5b01; box-shadow: 0 0 0 3px rgba(253,91,1,0.12); }
        .cc-input::placeholder { color: var(--t3,#666); font-weight: 400; }
        .cc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cc-bandeira {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(253,91,1,0.12); color: #fd5b01; font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 100px; margin-bottom: 8px;
        }
        .cc-erro {
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
          color: #f87171; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 1rem;
        }

        .wl-confirmar {
          width: 100%; padding: 12px; background: #fd5b01; color: #fff; border: none;
          border-radius: 10px; font-family: var(--font,'Sora',sans-serif); font-weight: 700; font-size: 14px;
          cursor: pointer; box-shadow: 0 4px 16px rgba(253,91,1,0.30); transition: background .15s;
        }
        .wl-confirmar:hover:not(:disabled) { background: #e04e00; }
        .wl-confirmar:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }

        .wl-confirmar-green {
          width: 100%; padding: 12px; background: var(--green,#4ade80); color: #111; border: none;
          border-radius: 10px; font-family: var(--font,'Sora',sans-serif); font-weight: 800; font-size: 14px;
          cursor: pointer; box-shadow: 0 4px 16px rgba(74,222,128,0.20); transition: filter .15s;
        }
        .wl-confirmar-green:hover:not(:disabled) { filter: brightness(1.1); }
        .wl-confirmar-green:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }

        .wl-success { text-align: center; padding: 1rem 0; }
        .wl-success-icon { font-size: 52px; margin-bottom: 12px; }
        .wl-success h3   { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; letter-spacing: -.02em; }
        .wl-success p    { font-size: 13px; color: var(--t3,#666); margin-bottom: 1.5rem; line-height: 1.6; }

        /* Pix */
        .pix-salvo {
          background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px 14px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.07);
        }
        .pix-salvo-key  { font-size: 13px; font-weight: 700; color: #f0f0f0; }
        .pix-salvo-edit {
          background: none; border: none; color: #fd5b01;
          font-family: var(--font,'Sora',sans-serif); font-size: 12px; font-weight: 700;
          cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background .15s;
        }
        .pix-salvo-edit:hover { background: rgba(253,91,1,0.12); }

        .taxa-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(253,91,1,0.18); border-radius: 10px; padding: 14px; margin: 1rem 0;
        }
        .taxa-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--t3,#666); margin-bottom: 6px; }
        .taxa-row:last-child { margin-bottom: 0; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 8px; font-weight: 700; color: #fff; }
        .taxa-row span:last-child { color: #fd5b01; }
        .taxa-row.liquido span:last-child { color: var(--green,#4ade80); }

        .pix-sem-chave {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(253,91,1,0.15);
          border-radius: 10px; padding: 12px 14px; font-size: 12px;
          color: var(--t3,#666); text-align: center; margin-bottom: 1rem;
        }

        @media (max-width: 480px) {
          .wl-page { padding: 5rem 1rem 2.5rem; }
          .wl-hero-value { font-size: 34px; }
          .wl-actions-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wl wl-page">
        <div className="wl-inner">

          <button className="wl-back-btn" onClick={() => router.push(isColab ? `/colaborador/${id}/perfil` : `/users/${id}/profile`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Voltar ao perfil
          </button>

          {/* HERO CARD */}
          <div className="wl-hero">
            <div className="wl-hero-label">Saldo disponível</div>
            <div className="wl-hero-value">R$ {saldo.toFixed(2).replace(".", ",")}</div>
            <div className="wl-hero-stats">
              <div className="wl-stat">
                <div className="wl-stat-label">↑ Total recarregado</div>
                <div className="wl-stat-value">R$ {totalRecargas.toFixed(2).replace(".", ",")}</div>
              </div>
              <div className="wl-stat">
                <div className="wl-stat-label">↓ Total gasto</div>
                <div className="wl-stat-value">R$ {totalGastos.toFixed(2).replace(".", ",")}</div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="wl-actions">
            <div className="wl-actions-row">
              <button className="wl-add-btn" onClick={() => setShowRecarga(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Adicionar saldo
              </button>
              <button className="wl-card-btn" onClick={() => setShowCartao(true)}>
                💳 Cartão
              </button>
            </div>
            {isColab && (
              <button className="wl-receber-btn" onClick={() => setShowReceber(true)}>
                💸 Receber / Resgatar saldo
              </button>
            )}
          </div>

          {/* SAVED CARDS */}
          {cartoes.length > 0 && (
            <div className="wl-card" style={{ animationDelay: "0.08s" }}>
              <div className="wl-sec-title">Meus Cartões</div>
              {cartoes.map(c => (
                <div key={c.id} className="wl-saved-card">
                  <div className="wl-saved-card-icon">{bandeiraEmoji(c.bandeira)}</div>
                  <div className="wl-saved-card-info">
                    <p>{c.bandeira} •••• {c.numero}</p>
                    <span>{c.nome} · Válido até {c.validade}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HISTORY */}
          <div className="wl-card" style={{ animationDelay: "0.12s" }}>
            <div className="wl-sec-title">Histórico de transações</div>
            <div className="wl-tabs">
              <button className={`wl-tab ${abaAtiva === "todos" ? "active" : ""}`} onClick={() => setAbaAtiva("todos")}>Todos</button>
              <button className={`wl-tab ${abaAtiva === "recargas" ? "active" : ""}`} onClick={() => setAbaAtiva("recargas")}>Entradas</button>
              <button className={`wl-tab ${abaAtiva === "gastos" ? "active" : ""}`} onClick={() => setAbaAtiva("gastos")}>Saídas</button>
            </div>

            {txFiltradas.length === 0 ? (
              <div className="wl-empty">
                <div className="wl-empty-icon">{transactions.length === 0 ? "🌱" : "🔍"}</div>
                <p className="wl-empty-text">
                  {transactions.length === 0 ? "Nenhuma transação ainda." : "Nenhuma transação nesta categoria."}
                </p>
              </div>
            ) : txFiltradas.map(t => {
              const tipo = txTipo(t);
              return (
                <div key={t.id} className="wl-tx">
                  <div className={`wl-tx-icon ${tipo}`}>
                    {tipo === "recarga" ? "💰" : tipo === "resgate" ? "💸" : "🔗"}
                  </div>
                  <div className="wl-tx-desc">
                    <p>{t.description ?? (tipo === "recarga" ? "Crédito recebido" : tipo === "resgate" ? "Saque" : "Débito")}</p>
                    <span>{new Date(t.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className={`wl-tx-valor ${tipo}`}>
                    {txSinal(t)} R$ {Number(t.amount).toFixed(2).replace(".", ",")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MODAL RECARGA ── */}
      {showRecarga && (
        <div className="wl-overlay" onClick={handleFecharRecarga}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>
            <button className="wl-modal-close" onClick={handleFecharRecarga}>✕</button>
            {recargaFeita ? (
              <div className="wl-success">
                <div className="wl-success-icon">✅</div>
                <h3>Saldo adicionado!</h3>
                <p>Seu saldo foi atualizado com sucesso.</p>
                <div style={{ background: "rgba(253,91,1,0.10)", border: "1px solid rgba(253,91,1,0.22)", borderRadius: 10, padding: "14px 16px", marginBottom: "1.25rem", fontSize: 20, fontWeight: 800, color: "#fd5b01", textAlign: "center" }}>
                  + R$ {parseFloat(valorRecarga).toFixed(2).replace(".", ",")}
                </div>
                <button className="wl-confirmar" onClick={handleFecharRecarga}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-.02em", marginBottom: 4 }}>Adicionar saldo</p>
                <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: "1.25rem" }}>Escolha um valor ou digite o desejado</p>
                <div className="wl-rapidos">
                  {VALORES_RAPIDOS.map(v => (
                    <button key={v} className={`wl-rapido-btn ${valorRecarga === String(v) ? "sel" : ""}`} onClick={() => setValorRecarga(String(v))}>
                      R$ {v}
                    </button>
                  ))}
                </div>
                <input className="wl-input-valor" type="number" placeholder="Ou digite o valor" min="1" value={valorRecarga} onChange={e => setValorRecarga(e.target.value)} />
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Método de pagamento</p>
                <div className="wl-metodos">
                  <button className={`wl-metodo-btn ${metodoPagamento === "pix" ? "pix-sel" : ""}`} onClick={() => setMetodoPagamento("pix")}>
                    <span className="icon">⚡</span>Pix
                  </button>
                  <button className={`wl-metodo-btn ${metodoPagamento === "cartao" ? "sel" : ""}`} onClick={() => setMetodoPagamento("cartao")}>
                    <span className="icon">💳</span>Cartão
                  </button>
                </div>
                {metodoPagamento === "pix" && <QrCodeIndisponivel />}
                <button
                  className="wl-confirmar"
                  disabled={!valorRecarga || parseFloat(valorRecarga) <= 0 || !metodoPagamento || metodoPagamento === "pix"}
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
        <div className="wl-overlay" onClick={handleFecharCartao}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>
            <button className="wl-modal-close" onClick={handleFecharCartao}>✕</button>
            {cCartaoOk ? (
              <div className="wl-success">
                <div className="wl-success-icon">💳</div>
                <h3>Cartão cadastrado!</h3>
                <p>Seu cartão foi salvo com sucesso.</p>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{bandeiraEmoji(bandeiraDetectada)}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 2 }}>{bandeiraDetectada || "Cartão"} •••• {cNumero.replace(/\s/g, "").slice(-4)}</p>
                    <span style={{ fontSize: 12, color: "var(--t3)" }}>{cNome} · Válido até {cValidade}</span>
                  </div>
                </div>
                <button className="wl-confirmar" onClick={handleFecharCartao}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-.02em", marginBottom: 4 }}>Cadastrar cartão</p>
                <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: "1.25rem" }}>Preencha os dados do seu cartão</p>
                <label className="cc-label">Número do cartão</label>
                {bandeiraDetectada && <div className="cc-bandeira">{bandeiraEmoji(bandeiraDetectada)} {bandeiraDetectada}</div>}
                <input className="cc-input" placeholder="0000 0000 0000 0000" value={cNumero} onChange={e => setCNumero(maskNumero(e.target.value))} maxLength={19} inputMode="numeric" />
                <label className="cc-label">Nome impresso no cartão</label>
                <input className="cc-input" placeholder="NOME NO CARTÃO" value={cNome} onChange={e => setCNome(e.target.value.toUpperCase())} maxLength={26} />
                <div className="cc-row">
                  <div>
                    <label className="cc-label">Validade</label>
                    <input className="cc-input" placeholder="MM/AA" value={cValidade} onChange={e => setCValidade(maskValidade(e.target.value))} maxLength={5} inputMode="numeric" />
                  </div>
                  <div>
                    <label className="cc-label">CVV</label>
                    <input className="cc-input" placeholder="123" value={cCvv} onChange={e => setCCvv(maskCvv(e.target.value))} maxLength={4} inputMode="numeric" type="password" />
                  </div>
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
        <div className="wl-overlay" onClick={handleFecharReceber}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>
            <button className="wl-modal-close" onClick={handleFecharReceber}>✕</button>
            {resgateOk ? (
              <div className="wl-success">
                <div className="wl-success-icon">💸</div>
                <h3>Resgate solicitado!</h3>
                <p>O valor líquido será enviado para sua chave Pix em até 1 dia útil.</p>
                <div className="taxa-box">
                  <div className="taxa-row"><span>Valor solicitado</span><span>R$ {valorResgateNum.toFixed(2).replace(".", ",")}</span></div>
                  <div className="taxa-row"><span>Taxa TwoPlayers (15%)</span><span>- R$ {taxaValor.toFixed(2).replace(".", ",")}</span></div>
                  <div className="taxa-row liquido"><span>Você receberá</span><span>R$ {valorLiquido.toFixed(2).replace(".", ",")}</span></div>
                </div>
                <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: "1.25rem" }}>Chave Pix: <strong style={{ color: "#f0f0f0" }}>{chavePixSalva}</strong></p>
                <button className="wl-confirmar" onClick={handleFecharReceber}>Fechar</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-.02em", marginBottom: 4 }}>Receber saldo</p>
                <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: "1.25rem" }}>
                  Saldo disponível: <strong style={{ color: "#fd5b01" }}>R$ {saldo.toFixed(2).replace(".", ",")}</strong>
                </p>
                <label className="cc-label">Chave Pix</label>
                {chavePixSalva && !editandoPix ? (
                  <div className="pix-salvo">
                    <span className="pix-salvo-key">⚡ {chavePixSalva}</span>
                    <button className="pix-salvo-edit" onClick={() => { setEditandoPix(true); setChavePix(chavePixSalva); }}>✏️ Editar</button>
                  </div>
                ) : (
                  <>
                    <input className="cc-input" placeholder="CPF, e-mail, telefone ou chave aleatória" value={chavePix} onChange={e => setChavePix(e.target.value)} />
                    <button
                      style={{ width: "100%", padding: "10px", background: "#fd5b01", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font,'Sora',sans-serif)", fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: "1rem", opacity: chavePix.trim() ? 1 : 0.35, transition: "opacity .15s" }}
                      disabled={!chavePix.trim()}
                      onClick={handleSalvarPix}
                    >
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
                        <div className="taxa-row"><span>Valor solicitado</span><span>R$ {valorResgateNum.toFixed(2).replace(".", ",")}</span></div>
                        <div className="taxa-row"><span>Taxa TwoPlayers (15%)</span><span>- R$ {taxaValor.toFixed(2).replace(".", ",")}</span></div>
                        <div className="taxa-row liquido"><span>Você receberá</span><span>R$ {valorLiquido.toFixed(2).replace(".", ",")}</span></div>
                      </div>
                    )}
                    {resgateErro && <div className="cc-erro">{resgateErro}</div>}
                    <button
                      className="wl-confirmar-green"
                      disabled={!valorResgate || valorResgateNum <= 0 || valorResgateNum > saldo}
                      onClick={handleResgate}
                    >
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
