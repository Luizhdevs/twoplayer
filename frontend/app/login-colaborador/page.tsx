"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from "@/lib/firebase";
import { api } from "@/lib/api";

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
  const router = useRouter();
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showReset,  setShowReset]  = useState(false);
  const [recEmail,   setRecEmail]   = useState("");
  const [recResult,  setRecResult]  = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);

    // Step 1: Firebase auth
    let token: string;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      token = await cred.user.getIdToken();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("E-mail ou senha incorretos.");
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente novamente mais tarde.");
      } else if (code === "auth/invalid-email") {
        setError("Formato de e-mail inválido.");
      } else {
        setError("Erro ao autenticar. Verifique sua conexão e tente novamente.");
      }
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Sync user in DB (ignore 409 = already exists)
    try {
      const fbUser = auth.currentUser!;
      await api.post("/users", {
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName ?? email.split("@")[0],
      });
    } catch { /* 409 ok */ }

    // Step 3: Fetch user and validate role
    let dbUserId: string;
    try {
      const res = await api.get<{ id: string; role: string } | { data: { id: string; role: string } }>("/users/me", { headers });
      const user = (res.data as { data?: { id: string; role: string } }).data ?? res.data as { id: string; role: string };
      if (!user?.id) {
        setError("Usuário não encontrado no sistema.");
        await auth.signOut();
        setLoading(false);
        return;
      }
      if (user.role !== "PROVIDER") {
        setError("Esta conta não possui acesso de colaborador.");
        await auth.signOut();
        setLoading(false);
        return;
      }
      dbUserId = user.id;
    } catch {
      setError("Não foi possível verificar sua conta. Tente novamente.");
      await auth.signOut();
      setLoading(false);
      return;
    }

    // Step 4: Fetch provider profile
    // /providers/me returns { data: { data: { id, ... } } } due to double wrapping
    // (service returns {data: provider}, global interceptor wraps again in {data: ...})
    try {
      const res = await api.get("/providers/me", { headers });
      const raw = res.data?.data;
      const provider = raw?.data ?? raw; // handle both single and double wrapping
      if (!provider?.id) {
        setError("Perfil de colaborador não encontrado. Entre em contato com o suporte.");
        await auth.signOut();
        setLoading(false);
        return;
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
      await auth.signOut();
      setLoading(false);
      return;
    }

    // Step 5: Redirect using USER ID (page param is userId)
    router.push(`/colaborador/${dbUserId}/perfil`);
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
        .lc-forgot { font-size:11px; color:#fd5b01; text-decoration:none; font-weight:500; }
        .lc-forgot:hover { opacity:.75; }
        .lc-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:500; display:flex; align-items:center; justify-content:center; padding:1rem; animation:lcFade .2s ease; }
        @keyframes lcFade { from{opacity:0} to{opacity:1} }
        .lc-modal { background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:2rem; width:100%; max-width:420px; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.6); animation:lcPop .25s ease; }
        @keyframes lcPop { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .lc-modal-close { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; border-radius:6px; color:#aaa; font-size:14px; cursor:pointer; padding:6px 10px; transition:all .15s; }
        .lc-modal-close:hover { background:#fd5b01; color:#fff; }
        .lc-modal h3 { font-size:18px; font-weight:700; margin-bottom:6px; color:#fff; }
        .lc-modal > p { font-size:13px; color:#777; }
        .lc-rec-result { padding:10px 14px; border-radius:8px; font-size:13px; margin-top:.75rem; }
        .lc-rec-success { background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.2); color:#4ade80; }
        .lc-rec-error   { background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); color:#f87171; }
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
                  <input className="lc-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" suppressHydrationWarning />
                </div>
              </div>

              <div className="lc-field">
                <label className="lc-label" style={{ display:"flex", justifyContent:"space-between" }}>
                  Senha
                  <a href="#" className="lc-forgot" onClick={e => { e.preventDefault(); setShowReset(true); setRecResult(null); setRecEmail(""); }}>Esqueceu a senha?</a>
                </label>
                <div className="lc-input-wrap">
                  <IconLock />
                  <input className="lc-input" type={showPw?"text":"password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" className="lc-toggle-pw" onClick={() => setShowPw(p => !p)}><IconEye show={showPw} /></button>
                </div>
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

      {showReset && (
        <div className="lc-overlay" onClick={() => setShowReset(false)}>
          <div className="lc-modal" onClick={e => e.stopPropagation()}>
            <button className="lc-modal-close" onClick={() => setShowReset(false)}>✕</button>
            <h3>Recuperar senha</h3>
            <p>Digite seu e-mail cadastrado.</p>
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#666", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>E-mail</label>
              <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
                <IconEmail />
                <input
                  className="lc-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={recEmail}
                  onChange={e => setRecEmail(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
            </div>
            {recResult && (
              <div className={`lc-rec-result ${recResult.type === "success" ? "lc-rec-success" : "lc-rec-error"}`}>
                {recResult.msg}
              </div>
            )}
            <button className="lc-btn" style={{ marginTop: "0.75rem" }} onClick={handleRecuperar}>
              Enviar link
            </button>
          </div>
        </div>
      )}
    </>
  );
}
