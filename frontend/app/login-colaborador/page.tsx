"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const MOCK_COLABORADORES = [
  { id: 1, email: "neymar@twoplayers.com",  password: "Neymar@123", name: "Neymar" },
  { id: 2, email: "gaules@twoplayers.com",  password: "Gaules@123", name: "Gaules" },
];

const IconEmail = () => (
  <svg className="lc-icon" viewBox="0 0 20 20" fill="none">
    <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconLock = () => (
  <svg className="lc-icon" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="13.5" r="1.5" fill="currentColor"/>
  </svg>
);
const IconEye = ({ show }: { show: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    {show && <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
  </svg>
);

export default function LoginColaboradorPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tp_colab_remember");
    if (saved) { const d = JSON.parse(saved); setEmail(d.email); setPassword(d.password); setRemember(true); }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);
    setTimeout(() => {
      const colab = MOCK_COLABORADORES.find(c => c.email===email && c.password===password);
      if (colab) {
        if (remember) localStorage.setItem("tp_colab_remember", JSON.stringify({email,password}));
        else localStorage.removeItem("tp_colab_remember");
        localStorage.setItem("tp_colab", JSON.stringify({id:colab.id,name:colab.name,email:colab.email}));
        window.location.href = `/colaborador/${colab.id}/perfil`;
      } else {
        setError("E-mail ou senha incorretos.");
      }
      setLoading(false);
    }, 800);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lc-page {
          min-height: 100vh;
          background: #0d0d0d;
          font-family: 'Sora', sans-serif;
          display: flex; align-items: stretch;
        }

        /* PAINEL ESQUERDO */
        .lc-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          background: linear-gradient(160deg, #0d0d0d 0%, #0d0d0d 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
        }
        @media (min-width: 900px) { .lc-left { display: flex; flex: 1; } }
        .lc-left-glow {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(253,91,1,0.15) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none;
        }
        .lc-left-badge {
          position: relative; z-index: 1;
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(253,91,1,0.12); border: 1px solid rgba(253,91,1,0.25);
          color: #fd5b01; font-size: 12px; font-weight: 700;
          padding: 6px 16px; border-radius: 100px;
          width: fit-content; margin-bottom: 1.5rem;
        }
        .lc-left-quote {
          position: relative; z-index: 1;
          font-size: 28px; font-weight: 800; color: #fff; line-height: 1.25;
          letter-spacing: -0.03em; max-width: 340px;
        }
        .lc-left-quote span { color: #fd5b01; }
        .lc-left-bottom {
          position: relative; z-index: 1;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 14px 16px;
          display: flex; align-items: center; gap: 12px;
        }
        .lc-left-icon { font-size: 24px; }
        .lc-left-tip { font-size: 12px; color: #888; line-height: 1.5; }
        .lc-left-tip strong { color: #fff; display: block; font-size: 13px; margin-bottom: 2px; }

        /* PAINEL DIREITO */
        .lc-right {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2.5rem 1.5rem; overflow-y: auto;
        }
        .lc-wrapper { width: 100%; max-width: 400px; }

        .lc-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
        .lc-logo-name { font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: #fff; }
        .lc-logo-name span { color: #fd5b01; }

        .lc-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(253,91,1,0.12); color: #fd5b01;
          font-size: 11px; font-weight: 700; padding: 4px 14px;
          border-radius: 100px; margin-bottom: 1.75rem;
          border: 1px solid rgba(253,91,1,0.25);
        }

        .lc-form-header { margin-bottom: 1.5rem; }
        .lc-form-header h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; color: #fff; margin-bottom: 5px; }
        .lc-form-header p  { font-size: 13px; color: #666; }

        .lc-alert { padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:1rem; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); color:#f87171; }

        .lc-field { margin-bottom: 0.75rem; }
        .lc-label { display:flex; justify-content:space-between; align-items:center; font-size:11px; font-weight:700; color:#666; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em; }

        .lc-input-wrap { position:relative; display:flex; align-items:center; }
        .lc-icon { position:absolute; left:12px; width:15px; height:15px; color:#555; pointer-events:none; }
        .lc-input {
          width:100%; padding:11px 38px 11px 36px;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.08);
          border-radius:9px; font-family:'Sora',sans-serif;
          font-size:13px; color:#f0f0f0; outline:none;
          transition:border-color .2s,box-shadow .2s;
        }
        .lc-input::placeholder { color:#444; }
        .lc-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .lc-toggle-pw { position:absolute; right:10px; background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; align-items:center; transition:color .15s; }
        .lc-toggle-pw:hover { color:#aaa; }

        .lc-check-label { display:flex; align-items:center; gap:8px; font-size:13px; color:#777; cursor:pointer; }
        .lc-checkmark { width:16px; height:16px; border-radius:4px; border:1.5px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; }
        .lc-checkmark.checked { background:#fd5b01; border-color:#fd5b01; }
        .lc-checkmark.checked::after { content:''; display:block; width:8px; height:5px; border-left:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg) translateY(-1px); }

        .lc-btn { width:100%; padding:13px; background:#fd5b01; color:#fff; border:none; border-radius:9px; font-family:'Sora',sans-serif; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:background .2s,transform .1s,box-shadow .2s; margin-top:1.25rem; box-shadow:0 4px 20px rgba(253,91,1,0.35); }
        .lc-btn:hover { background:#d94d00; box-shadow:0 6px 24px rgba(253,91,1,0.45); }
        .lc-btn:active { transform:scale(0.98); }
        .lc-btn:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }

        .lc-spinner { width:17px; height:17px; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .lc-divider { height:1px; background:rgba(255,255,255,0.06); margin:1.25rem 0; }
        .lc-switch { text-align:center; font-size:12px; color:#555; }
        .lc-switch a { color:#fd5b01; font-weight:600; text-decoration:none; }
        .lc-switch a:hover { opacity:.8; }
        .lc-footer { text-align:center; font-size:11px; color:#444; margin-top:1.25rem; }
      `}</style>

      <div className="lc-page">

        {/* PAINEL ESQUERDO */}
        <div className="lc-left">
          <div className="lc-left-glow" />
          <div>
            <Image src="/logo.png" width={44} height={44} alt="TwoPlayers" style={{ position:"relative", zIndex:1, marginBottom:"1.5rem", display:"block" }} />
            <div className="lc-left-badge">Área exclusiva de prestadores</div>
            <div className="lc-left-quote">
              Gerencie seus<br/>
              <span>serviços</span> e conecte-se<br/>
              com seus fãs.
            </div>
          </div>
          <div className="lc-left-bottom">
            <div className="lc-left-icon">💡</div>
            <div className="lc-left-tip">
              <strong>Dica para prestadores</strong>
              Mantenha seus serviços atualizados para atrair mais agendamentos.
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="lc-right">
          <div className="lc-wrapper">

            <div className="lc-logo">
              <Image src="/logo.png" width={40} height={40} alt="TwoPlayers" />
              <span className="lc-logo-name">Two<span>Players</span></span>
            </div>

            <div><span className="lc-badge">Área do Prestador</span></div>

            <form onSubmit={handleLogin} noValidate>
              <div className="lc-form-header">
                <h2>Acesso colaborador</h2>
                <p>Entre com suas credenciais de prestador</p>
              </div>

              {error && <div className="lc-alert">{error}</div>}

              <div className="lc-field">
                <label className="lc-label">E-mail</label>
                <div className="lc-input-wrap">
                  <IconEmail />
                  <input className="lc-input" type="email" placeholder="seu@twoplayers.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>

              <div className="lc-field">
                <label className="lc-label">Senha</label>
                <div className="lc-input-wrap">
                  <IconLock />
                  <input className="lc-input" type={showPw?"text":"password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="lc-toggle-pw" onClick={() => setShowPw(p => !p)}><IconEye show={showPw} /></button>
                </div>
              </div>

              <div className="lc-field">
                <label className="lc-check-label" onClick={() => setRemember(p => !p)}>
                  <span className={`lc-checkmark ${remember?"checked":""}`} />
                  Manter conectado
                </label>
              </div>

              <button className="lc-btn" type="submit" disabled={loading}>
                {loading ? (
                  <svg className="lc-spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10"/>
                  </svg>
                ) : <>Entrar →</>}
              </button>
            </form>

            <div className="lc-divider" />
            <div className="lc-switch">
              É usuário comum? <a href="/login">Acessar como usuário</a>
            </div>
            <p className="lc-footer">© 2026 TwoPlayers. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </>
  );
}
