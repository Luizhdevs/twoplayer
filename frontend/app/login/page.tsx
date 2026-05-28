"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "@/lib/firebase";

type Tab   = "login" | "register";
type Modal = "none" | "senha" | "termos" | "privacidade";

function maskCpf(v: string) {
  return v.replace(/\D/g,"").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2").slice(0,14);
}
function validateCpf(cpf: string) {
  const c = cpf.replace(/\D/g,"");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s=0; for (let i=0;i<9;i++) s += +c[i]*(10-i);
  let r=(s*10)%11; if (r===10||r===11) r=0; if (r!==+c[9]) return false;
  s=0; for (let i=0;i<10;i++) s += +c[i]*(11-i);
  r=(s*10)%11; if (r===10||r===11) r=0; return r===+c[10];
}


const IconEmail = () => (
  <svg className="li-icon" viewBox="0 0 20 20" fill="none">
    <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconLock = () => (
  <svg className="li-icon" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="13.5" r="1.5" fill="currentColor"/>
  </svg>
);
const IconUser = () => (
  <svg className="li-icon" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconDoc = () => (
  <svg className="li-icon" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconEye = ({ show }: { show: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    {show && <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function LoginPage() {
  const [docFile, setDocFile]             = useState<File | null>(null);
  const [tab, setTab]                     = useState<Tab>("login");
  const [modal, setModal]                 = useState<Modal>("none");
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPw, setLoginPw]             = useState("");
  const [showLoginPw, setShowLoginPw]     = useState(false);
  const [remember, setRemember]           = useState(false);
  const [loginError, setLoginError]       = useState("");
  const [loginLoading, setLoginLoading]   = useState(false);
  const [recEmail, setRecEmail]           = useState("");
  const [recResult, setRecResult]         = useState<{type:"success"|"error";msg:string}|null>(null);
  const [regName, setRegName]             = useState("");
  const [regEmail, setRegEmail]           = useState("");
  const [regNasc, setRegNasc]             = useState("");
  const [regCpf, setRegCpf]               = useState("");
  const [regPw, setRegPw]                 = useState("");
  const [regPwConfirm, setRegPwConfirm]   = useState("");
  const [showRegPw, setShowRegPw]         = useState(false);
  const [showRegPwConfirm, setShowRegPwConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms]     = useState(false);
  const [errNasc, setErrNasc]             = useState("");
  const [errCpf, setErrCpf]               = useState("");
  const [errPwConfirm, setErrPwConfirm]   = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tp_remember");
    if (saved) { const {email,password} = JSON.parse(saved); setLoginEmail(email); setLoginPw(password); setRemember(true); }
  }, []);

  const pwRules = {
    len:     regPw.length >= 6,
    upper:   /[A-Z]/.test(regPw),
    lower:   /[a-z]/.test(regPw),
    num:     /[0-9]/.test(regPw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPw),
  };
  const pwStrength = Object.values(pwRules).filter(Boolean).length;
  const pwStrengthColor = ["","#ef4444","#f97316","#eab308","#84cc16","#fd5b01"][pwStrength];
  const pwValid = Object.values(pwRules).every(Boolean);
  const regCanSubmit = (() => {
    if (!regName.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) return false;
    if (!regNasc) return false;
    const age = Math.floor((Date.now()-new Date(regNasc).getTime())/(365.25*24*3600*1000));
    if (age < 18) return false;
    if (!validateCpf(regCpf)) return false;
    if (!pwValid || regPw !== regPwConfirm) return false;
    if (!acceptTerms) return false;
    return true;
  })();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPw) { setLoginError("Preencha e-mail e senha."); return; }
    setLoginLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, loginEmail, loginPw);
      const user = credential.user;
      if (remember) {
        localStorage.setItem("tp_remember", JSON.stringify({ email: loginEmail, password: loginPw }));
      } else {
        localStorage.removeItem("tp_remember");
      }
      localStorage.setItem("tp_user", JSON.stringify({ uid: user.uid, name: user.displayName ?? loginEmail, email: user.email }));
      window.location.href = "/home";
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setLoginError("E-mail ou senha incorretos.");
      } else if (code === "auth/too-many-requests") {
        setLoginError("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        setLoginError("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRecuperar() {
    if (!recEmail) { setRecResult({ type: "error", msg: "Digite seu e-mail." }); return; }
    try {
      await sendPasswordResetEmail(auth, recEmail);
      setRecResult({ type: "success", msg: "Verifique seu e-mail! Enviamos um link para redefinir sua senha." });
    } catch {
      setRecResult({ type: "error", msg: "E-mail não encontrado ou inválido." });
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regCanSubmit) return;
    setLoginLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, regEmail, regPw);
      const user = credential.user;
      localStorage.setItem("tp_user", JSON.stringify({ uid: user.uid, name: regName, email: user.email }));
      window.location.href = "/home";
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use") {
        setLoginError("Este e-mail já está cadastrado.");
      } else {
        setLoginError("Erro ao criar conta. Tente novamente.");
      }
      setTab("login");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleNascBlur() {
    if (!regNasc) return;
    const age = Math.floor((Date.now()-new Date(regNasc).getTime())/(365.25*24*3600*1000));
    setErrNasc(age < 18 ? "Você precisa ter pelo menos 18 anos." : "");
  }
  function handleCpfBlur()      { if (regCpf && !validateCpf(regCpf)) setErrCpf("CPF inválido."); else setErrCpf(""); }
  function handlePwConfirmBlur() { if (regPwConfirm && regPw !== regPwConfirm) setErrPwConfirm("As senhas não coincidem."); else setErrPwConfirm(""); }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* ── PAGE ── */
        .li-page {
          min-height: 100vh;
          background: #0d0d0d;
          font-family: 'Sora', sans-serif;
          display: flex;
          align-items: stretch;
        }

        /* ── PAINEL ESQUERDO (decorativo) ── */
        .li-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          background: linear-gradient(160deg, #0d0d0d 0%, #0d0d0d 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) { .li-left { display: flex; flex: 1; } }

        .li-left-glow {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(253,91,1,0.18) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          pointer-events: none;
        }
        .li-left-quote {
          position: relative; z-index: 1;
          font-size: 28px; font-weight: 800;
          color: #fff; line-height: 1.25;
          letter-spacing: -0.03em;
          max-width: 340px;
        }
        .li-left-quote span { color: #fd5b01; }
        .li-left-bottom {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 12px;
        }
        .li-left-avatar {
          width: 25px; height: 25px; border-radius: 50%;
          background: linear-gradient(135deg, #fd5b01, #ff8c42);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; color: #fff;
        }
        .li-left-stat { font-size: 12px; color: #888; }
        .li-left-stat strong { color: #fff; display: block; font-size: 14px; }

        /* ── PAINEL DIREITO (form) ── */
        .li-right {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2.5rem 1.5rem;
          overflow-y: auto;
        }
        .li-wrapper { width: 100%; max-width: 420px; }

        /* ── LOGO ── */
        .li-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 2rem; text-decoration: none;
        }
        .li-logo-name { font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: #fff; }
        .li-logo-name span { color: #fd5b01; }

        /* ── TABS ── */
        .li-tabs {
          display: flex; background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 4px; margin-bottom: 2rem;
        }
        .li-tab {
          flex: 1; padding: 10px; background: none; border: none;
          border-radius: 8px; font-family: 'Sora', sans-serif;
          font-size: 13px; font-weight: 500; color: #666;
          cursor: pointer; transition: all 0.2s;
        }
        .li-tab.active {
          background: #fd5b01; color: #fff; font-weight: 700;
          box-shadow: 0 2px 12px rgba(253,91,1,0.35);
        }
        .li-tab:hover:not(.active) { color: #fff; background: rgba(255,255,255,0.05); }

        /* ── FORM HEADER ── */
        .li-form-header { margin-bottom: 1.5rem; }
        .li-form-header h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; color: #fff; margin-bottom: 5px; }
        .li-form-header p  { font-size: 13px; color: #666; }

        /* ── ALERT ── */
        .li-alert {
          padding: 10px 14px; border-radius: 8px;
          font-size: 13px; margin-bottom: 1rem;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          color: #f87171;
        }

        /* ── FIELDS ── */
        .li-field        { margin-bottom: 0.75rem; }
        .li-field.compact{ margin-bottom: 0.45rem; }
        .li-label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 11px; font-weight: 700; color: #666;
          margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .li-forgot { font-size: 11px; color: #fd5b01; text-decoration: none; font-weight: 500; text-transform: none; letter-spacing: 0; }
        .li-forgot:hover { opacity: 0.75; }

        .li-input-wrap { position: relative; display: flex; align-items: center; }
        .li-icon {
          position: absolute; left: 12px; width: 15px; height: 15px;
          color: #555; pointer-events: none;
        }
        .li-input {
          width: 100%; padding: 11px 38px 11px 36px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 9px;
          font-family: 'Sora', sans-serif; font-size: 13px; color: #f0f0f0;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .li-input::placeholder { color: #444; }
        .li-input:focus { border-color: #fd5b01; box-shadow: 0 0 0 3px rgba(253,91,1,0.12); }
        .li-input.error { border-color: rgba(248,113,113,0.5); }
        .li-input-date {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 9px;
          font-family: 'Sora', sans-serif; font-size: 13px; color: #f0f0f0;
          outline: none; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
          color-scheme: dark;
        }
        .li-input-date:focus { border-color: #fd5b01; box-shadow: 0 0 0 3px rgba(253,91,1,0.12); }
        .li-toggle-pw {
          position: absolute; right: 10px; background: none; border: none;
          cursor: pointer; color: #555; padding: 4px;
          display: flex; align-items: center; transition: color 0.15s;
        }
        .li-toggle-pw:hover { color: #aaa; }

        .li-field-error { display: block; font-size: 11px; color: #f87171; margin-top: 4px; min-height: 14px; }

        /* ── CHECKBOX ── */
        .li-check-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #777; cursor: pointer; flex-wrap: wrap;
        }
        .li-checkmark {
          width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .li-checkmark.checked { background: #fd5b01; border-color: #fd5b01; }
        .li-checkmark.checked::after { content:''; display:block; width:8px; height:5px; border-left:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg) translateY(-1px); }
        .li-check-label a { color: #fd5b01; text-decoration: none; font-weight: 500; }

        /* ── BTN ── */
        .li-btn {
          width: 100%; padding: 13px;
          background: #fd5b01; color: #fff; border: none;
          border-radius: 9px; font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          margin-top: 1.25rem; letter-spacing: 0.01em;
          box-shadow: 0 4px 20px rgba(253,91,1,0.35);
        }
        .li-btn:hover:not(:disabled) { background: #d94d00; box-shadow: 0 6px 24px rgba(253,91,1,0.45); }
        .li-btn:active:not(:disabled){ transform: scale(0.98); }
        .li-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
        .li-btn.compact  { margin-top: 0.6rem; }

        .li-spinner { width: 17px; height: 17px; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── PASSWORD STRENGTH ── */
        .strength-bar { height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-top: 8px; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }
        .pw-rules { list-style: none; margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
        .pw-rules li { font-size: 11px; color: #555; padding-left: 16px; position: relative; transition: color 0.2s; }
        .pw-rules li::before { content: '✗'; position: absolute; left: 0; color: #555; }
        .pw-rules li.ok { color: #4ade80; }
        .pw-rules li.ok::before { content: '✓'; color: #4ade80; }

        /* ── DIVIDER / FOOTER ── */
        .li-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 1.25rem 0; }
        .li-footer  { text-align: center; font-size: 11px; color: #444; margin-top: 1.25rem; }
        .li-grid2   { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

        /* ── UPLOAD ── */
        .li-upload-btn {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 11px 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: 9px; font-size: 13px; color: #666;
          transition: border-color 0.2s, color 0.2s; cursor: pointer;
        }
        .li-upload-label:hover .li-upload-btn { border-color: #fd5b01; color: #fd5b01; }

        /* ── MODAL ── */
        .li-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: liFadeIn 0.2s ease;
        }
        @keyframes liFadeIn { from{opacity:0} to{opacity:1} }
        .li-modal {
          background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px; padding: 2rem; width: 100%; max-width: 420px;
          position: relative; box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          animation: liPopIn 0.25s ease;
        }
        .li-modal.large { max-width: 540px; max-height: 80vh; overflow-y: auto; }
        @keyframes liPopIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .li-modal-close {
          position: absolute; top: 14px; right: 14px;
          background: rgba(255,255,255,0.08); border: none; border-radius: 6px;
          color: #aaa; font-size: 14px; cursor: pointer;
          padding: 6px 10px; transition: all 0.15s;
        }
        .li-modal-close:hover { background: #fd5b01; color: #fff; }
        .li-modal h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: #fff; letter-spacing: -0.02em; }
        .li-modal > p { font-size: 13px; color: #777; }
        .rec-result { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-top: 0.75rem; }
        .rec-success { background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2); color: #4ade80; }
        .rec-error   { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; }

        .termos-content h4 { font-size: 13px; font-weight: 700; color: #fd5b01; margin: 1rem 0 4px; }
        .termos-content p  { font-size: 13px; color: #888; line-height: 1.7; }

        /* ── FORM ANIMATION ── */
        .li-form { animation: liSlideUp 0.25s ease; }
        @keyframes liSlideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        /* ── LINK COLABORADOR ── */
        .li-colab-link {
          text-align: center; font-size: 12px; color: #555;
          margin-top: 1.25rem;
        }
        .li-colab-link a { color: #fd5b01; font-weight: 600; text-decoration: none; }
        .li-colab-link a:hover { opacity: 0.8; }
      `}</style>

      <div className="li-page">

        {/* PAINEL ESQUERDO */}
        <div className="li-left">
          <div className="li-left-glow" />
          <Image src="/logo.png" width={44} height={44} alt="TwoPlayers" style={{ position:"relative", zIndex:1 }} />
          <div className="li-left-quote">
            Conecte-se com seus<br/>
            <span>ídolos</span> e viva<br/>
            experiências únicas.
          </div>
          <div className="li-left-bottom">
            <div className="li-left-avatar"></div>
            <div className="li-left-stat">
              <strong>+2.400 sessões realizadas</strong>
              Plataforma exclusiva para maiores de 18 anos
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="li-right">
          <div className="li-wrapper">

            <div className="li-logo">
              <Image src="/logo.png" width={40} height={40} alt="TwoPlayers" />
              <span className="li-logo-name">Two<span>Players</span></span>
            </div>

            <div className="li-tabs">
              <button className={`li-tab ${tab==="login"?"active":""}`}    onClick={() => setTab("login")}>Entrar</button>
              <button className={`li-tab ${tab==="register"?"active":""}`} onClick={() => setTab("register")}>Criar conta</button>
            </div>

            {/* ── LOGIN ── */}
            {tab === "login" && (
              <form className="li-form" onSubmit={handleLogin} noValidate>
                <div className="li-form-header">
                  <h2>Bem-vindo de volta</h2>
                  <p>Acesse sua conta para continuar</p>
                </div>
                {loginError && <div className="li-alert">{loginError}</div>}
                <div className="li-field">
                  <label className="li-label">E-mail</label>
                  <div className="li-input-wrap">
                    <IconEmail />
                    <input className="li-input" type="email" placeholder="seu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoComplete="email" />
                  </div>
                </div>
                <div className="li-field">
                  <label className="li-label">
                    Senha
                    <a href="#" className="li-forgot" onClick={e => { e.preventDefault(); setModal("senha"); setRecResult(null); setRecEmail(""); }}>Esqueceu a senha?</a>
                  </label>
                  <div className="li-input-wrap">
                    <IconLock />
                    <input className="li-input" type={showLoginPw?"text":"password"} placeholder="••••••••" value={loginPw} onChange={e => setLoginPw(e.target.value)} autoComplete="current-password" />
                    <button type="button" className="li-toggle-pw" onClick={() => setShowLoginPw(p => !p)}><IconEye show={showLoginPw} /></button>
                  </div>
                </div>
                <div className="li-field">
                  <label className="li-check-label" onClick={() => setRemember(p => !p)} style={{ cursor:"pointer" }}>
                    <span className={`li-checkmark ${remember?"checked":""}`} />
                    Manter conectado
                  </label>
                </div>
                <button className="li-btn" type="submit" disabled={loginLoading}>
                  {loginLoading ? (
                    <svg className="li-spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10"/>
                    </svg>
                  ) : <>Entrar <IconArrow /></>}
                </button>
                <div className="li-colab-link">
                  É prestador? <a href="/login-colaborador">Acesso de prestador →</a>
                </div>
              </form>
            )}

            {/* ── CADASTRO ── */}
            {tab === "register" && (
              <form className="li-form" onSubmit={handleRegister} noValidate>
                <div className="li-form-header" style={{ marginBottom:"0.75rem" }}>
                  <h2>Crie sua conta</h2>
                  <p>Plataforma exclusiva para maiores de 18 anos</p>
                </div>

                <div className="li-field compact">
                  <label className="li-label">Nome completo</label>
                  <div className="li-input-wrap"><IconUser /><input className="li-input" type="text" placeholder="João Silva" value={regName} onChange={e => setRegName(e.target.value)} /></div>
                </div>
                <div className="li-field compact">
                  <label className="li-label">E-mail</label>
                  <div className="li-input-wrap"><IconEmail /><input className="li-input" type="email" placeholder="seu@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} /></div>
                </div>
                <div className="li-grid2">
                  <div className="li-field compact">
                    <label className="li-label">Nascimento</label>
                    <input className="li-input-date" type="date" value={regNasc} onChange={e => setRegNasc(e.target.value)} onBlur={handleNascBlur} />
                    {errNasc && <span className="li-field-error" style={{ fontSize:10 }}>{errNasc}</span>}
                  </div>
                  <div className="li-field compact">
                    <label className="li-label">CPF</label>
                    <div className="li-input-wrap">
                      <IconDoc />
                      <input className={`li-input ${errCpf?"error":""}`} type="text" placeholder="000.000.000-00" maxLength={14} value={regCpf} onChange={e => setRegCpf(maskCpf(e.target.value))} onBlur={handleCpfBlur} />
                    </div>
                    {errCpf && <span className="li-field-error" style={{ fontSize:10 }}>{errCpf}</span>}
                  </div>
                </div>

                <div className="li-field compact">
                  <label className="li-label">Senha</label>
                  <div className="li-input-wrap">
                    <IconLock />
                    <input className="li-input" type={showRegPw?"text":"password"} placeholder="Mínimo 6 caracteres" value={regPw} onChange={e => setRegPw(e.target.value)} />
                    <button type="button" className="li-toggle-pw" onClick={() => setShowRegPw(p => !p)}><IconEye show={showRegPw} /></button>
                  </div>
                  <div className="strength-bar"><div className="strength-fill" style={{ width:`${(pwStrength/5)*100}%`, background:pwStrengthColor }} /></div>
                  <ul className="pw-rules">
                    <li className={pwRules.len     ?"ok":""}>Mínimo 6 caracteres</li>
                    <li className={pwRules.upper   ?"ok":""}>Letra maiúscula (A-Z)</li>
                    <li className={pwRules.lower   ?"ok":""}>Letra minúscula (a-z)</li>
                    <li className={pwRules.num     ?"ok":""}>Número (0-9)</li>
                    <li className={pwRules.special ?"ok":""}>Caractere especial (!@#$...)</li>
                  </ul>
                </div>

                <div className="li-field compact">
                  <label className="li-label">Confirmar senha</label>
                  <div className="li-input-wrap">
                    <IconLock />
                    <input className={`li-input ${errPwConfirm?"error":""}`} type={showRegPwConfirm?"text":"password"} placeholder="Repita a senha" value={regPwConfirm} onChange={e => setRegPwConfirm(e.target.value)} onBlur={handlePwConfirmBlur} />
                    <button type="button" className="li-toggle-pw" onClick={() => setShowRegPwConfirm(p => !p)}><IconEye show={showRegPwConfirm} /></button>
                  </div>
                  {errPwConfirm && <span className="li-field-error">{errPwConfirm}</span>}
                </div>

                <div className="li-field compact">
                  <label className="li-label">Documento ou foto</label>
                  <label className="li-upload-label" htmlFor="reg-doc-upload">
                    <input id="reg-doc-upload" type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => setDocFile(e.target.files?.[0]??null)} />
                    <span className="li-upload-btn">📎 {docFile ? docFile.name : "Anexar foto ou documento"}</span>
                  </label>
                </div>

                <div className="li-field compact">
                  <label className="li-check-label" onClick={() => setAcceptTerms(p => !p)} style={{ cursor:"pointer" }}>
                    <span className={`li-checkmark ${acceptTerms?"checked":""}`} />
                    Concordo com os{" "}
                    <a href="#" onClick={e => { e.stopPropagation(); e.preventDefault(); setModal("termos"); }}>Termos de Uso</a>
                    {" "}e{" "}
                    <a href="#" onClick={e => { e.stopPropagation(); e.preventDefault(); setModal("privacidade"); }}>Privacidade</a>
                  </label>
                </div>

                <button className="li-btn compact" type="submit" disabled={!regCanSubmit}>Criar conta <IconArrow /></button>
              </form>
            )}

            <p className="li-footer">© 2026 TwoPlayers. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      {/* ── MODAL RECUPERAR SENHA ── */}
      {modal === "senha" && (
        <div className="li-overlay" onClick={() => setModal("none")}>
          <div className="li-modal" onClick={e => e.stopPropagation()}>
            <button className="li-modal-close" onClick={() => setModal("none")}>✕</button>
            <h3>Recuperar senha</h3>
            <p>Digite seu e-mail cadastrado.</p>
            <div className="li-field" style={{ marginTop:"1rem" }}>
              <label className="li-label">E-mail</label>
              <div className="li-input-wrap"><IconEmail /><input className="li-input" type="email" placeholder="seu@email.com" value={recEmail} onChange={e => setRecEmail(e.target.value)} /></div>
            </div>
            {recResult && <div className={`rec-result ${recResult.type==="success"?"rec-success":"rec-error"}`}>{recResult.msg}</div>}
            <button className="li-btn" style={{ marginTop:"0.75rem" }} onClick={handleRecuperar}>Buscar senha</button>
          </div>
        </div>
      )}

      {/* ── MODAL TERMOS ── */}
      {modal === "termos" && (
        <div className="li-overlay" onClick={() => setModal("none")}>
          <div className="li-modal large" onClick={e => e.stopPropagation()}>
            <button className="li-modal-close" onClick={() => setModal("none")}>✕</button>
            <h3>Termos de Uso</h3>
            <div className="termos-content">
              <h4>1. Aceitação dos Termos</h4><p>Ao criar uma conta na plataforma TwoPlayers, você concorda com os presentes Termos de Uso e Política de Privacidade.</p>
              <h4>2. Uso da Plataforma</h4><p>A TwoPlayers é uma plataforma de conexão entre pessoas para realização de sessões, mentorias e experiências personalizadas.</p>
              <h4>3. Conta e Responsabilidade</h4><p>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</p>
              <h4>4. Privacidade dos Dados</h4><p>Coletamos apenas as informações necessárias para o funcionamento da plataforma.</p>
              <h4>5. Pagamentos e Agendamentos</h4><p>As transações realizadas na plataforma estão sujeitas às políticas de cancelamento e reembolso descritas em cada serviço.</p>
              <h4>6. Conduta dos Usuários</h4><p>É proibido qualquer comportamento abusivo, discriminatório ou ilegal dentro da plataforma.</p>
              <h4>7. Alterações nos Termos</h4><p>A TwoPlayers reserva-se o direito de atualizar estes termos a qualquer momento.</p>
              <h4>8. Contato</h4><p>suporte@twoplayers.com</p>
            </div>
            <button className="li-btn" style={{ marginTop:"1.25rem" }} onClick={() => { setAcceptTerms(true); setModal("none"); }}>Entendi e aceito</button>
          </div>
        </div>
      )}

      {/* ── MODAL PRIVACIDADE ── */}
      {modal === "privacidade" && (
        <div className="li-overlay" onClick={() => setModal("none")}>
          <div className="li-modal large" onClick={e => e.stopPropagation()}>
            <button className="li-modal-close" onClick={() => setModal("none")}>✕</button>
            <h3>Política de Privacidade</h3>
            <div className="termos-content">
              <h4>1. Dados Coletados</h4><p>Coletamos nome, e-mail e informações de perfil fornecidas voluntariamente por você.</p>
              <h4>2. Uso dos Dados</h4><p>Seus dados são utilizados exclusivamente para identificação na plataforma.</p>
              <h4>3. Armazenamento e Segurança</h4><p>Utilizamos criptografia para proteger suas informações.</p>
              <h4>4. Cookies</h4><p>Utilizamos cookies de sessão para manter você autenticado.</p>
              <h4>5. Seus Direitos</h4><p>Você tem direito a acessar, corrigir ou solicitar a exclusão dos seus dados.</p>
              <h4>6. Contato</h4><p>privacidade@twoplayers.com</p>
            </div>
            <button className="li-btn" style={{ marginTop:"1.25rem" }} onClick={() => setModal("none")}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
