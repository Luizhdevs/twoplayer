"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAppointment } from "@/hooks/useAppointments";
import { useSimulateSuccess } from "@/hooks/usePayments";

type PaymentMethod = "pix" | "card";

export default function CheckoutPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();

  const { data: appt, isLoading, isError } = useAppointment(appointmentId);
  const simulate = useSimulateSuccess();

  const [method, setMethod] = useState<PaymentMethod>("pix");

  // Loading
  if (isLoading) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes ck-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fd5b01", animation: "ck-spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Error / not found
  if (isError || !appt) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Sora',sans-serif" }}>
        <p style={{ color: "#f87171", fontSize: 16 }}>Agendamento não encontrado.</p>
        <Link href="/appointments" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>← Meus agendamentos</Link>
      </div>
    );
  }

  // Já foi pago
  if (appt.status !== "PENDING_PAYMENT") {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Sora',sans-serif", padding: "2rem" }}>
        <div style={{ fontSize: 48 }}>
          {appt.status === "PAID" || appt.status === "CONFIRMED" || appt.status === "COMPLETED" ? "✅" : "ℹ️"}
        </div>
        <p style={{ color: "#f0f0f0", fontSize: 18, fontWeight: 700, textAlign: "center" }}>
          {appt.status === "PAID"       ? "Pagamento já aprovado!"         :
           appt.status === "CANCELLED"  ? "Este agendamento foi cancelado." :
           "Este agendamento não requer pagamento agora."}
        </p>
        <Link href={`/appointments/${appointmentId}`} style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          Ver agendamento →
        </Link>
      </div>
    );
  }

  const providerName = appt.provider?.user?.name ?? "Prestador";
  const avatarUrl    = appt.provider?.user?.avatarUrl ?? null;
  const amount       = (appt.amount / 100).toFixed(2);
  const date = new Date(appt.scheduledAt).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  function handlePay() {
    simulate.mutate(appointmentId, {
      onSuccess: () => {
        setTimeout(() => router.push(`/appointments/${appointmentId}`), 2000);
      },
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes ck-spin   { to { transform: rotate(360deg); } }
        @keyframes ck-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ck * { font-family:'Sora',sans-serif; box-sizing:border-box; }
        .ck-page { background:#0d0d0d; min-height:100vh; padding:3rem 1.5rem; display:flex; flex-direction:column; align-items:center; }
        .ck-inner { width:100%; max-width:480px; }
        .ck-back { display:inline-flex; align-items:center; gap:6px; color:#555; font-size:13px; text-decoration:none; margin-bottom:1.5rem; transition:color 0.2s; }
        .ck-back:hover { color:#fd5b01; }

        /* Cabeçalho */
        .ck-header { text-align:center; margin-bottom:2rem; }
        .ck-header-icon { font-size:36px; margin-bottom:8px; }
        .ck-title { font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.03em; }
        .ck-subtitle { font-size:13px; color:#555; margin-top:4px; }

        /* Cards */
        .ck-card {
          background:#1a1a1a;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:18px; padding:1.5rem;
          margin-bottom:1rem;
        }
        .ck-section-label {
          font-size:11px; font-weight:700; color:#555;
          text-transform:uppercase; letter-spacing:0.08em;
          margin-bottom:1rem; display:flex; align-items:center; gap:8px;
        }
        .ck-section-label::before { content:''; width:3px; height:12px; background:#fd5b01; border-radius:2px; }

        /* Resumo do agendamento */
        .ck-summary-row { display:flex; justify-content:space-between; align-items:flex-start; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .ck-summary-row:last-child { border-bottom:none; padding-bottom:0; }
        .ck-summary-label { font-size:12px; color:#666; }
        .ck-summary-value { font-size:13px; color:#e0e0e0; font-weight:500; text-align:right; max-width:65%; }
        .ck-amount { font-size:24px; font-weight:800; color:#fd5b01; }

        /* Seleção de método */
        .ck-method {
          display:flex; align-items:center; gap:14px;
          padding:14px; border-radius:12px;
          border:1.5px solid rgba(255,255,255,0.07);
          cursor:pointer; margin-bottom:10px;
          transition:border-color 0.2s, background 0.2s;
          background:rgba(255,255,255,0.02);
        }
        .ck-method.selected { border-color:#fd5b01; background:rgba(253,91,1,0.07); }
        .ck-method:hover:not(.selected) { border-color:rgba(255,255,255,0.15); }
        .ck-method-radio {
          width:18px; height:18px; border-radius:50%; flex-shrink:0;
          border:2px solid rgba(255,255,255,0.2);
          display:flex; align-items:center; justify-content:center;
          transition:border-color 0.2s;
        }
        .ck-method.selected .ck-method-radio { border-color:#fd5b01; }
        .ck-method-radio-dot {
          width:8px; height:8px; border-radius:50%; background:#fd5b01;
          transition:opacity 0.2s;
        }
        .ck-method-icon { font-size:22px; }
        .ck-method-label { font-size:14px; font-weight:600; color:#e0e0e0; }
        .ck-method-desc  { font-size:11px; color:#555; margin-top:2px; }
        .ck-sandbox-badge {
          margin-left:auto;
          font-size:9px; font-weight:700; color:#fd5b01;
          background:rgba(253,91,1,0.1); border:1px solid rgba(253,91,1,0.25);
          padding:2px 8px; border-radius:4px; letter-spacing:0.06em;
          text-transform:uppercase; white-space:nowrap;
        }

        /* Botão pagar */
        .ck-pay-btn {
          width:100%; padding:16px;
          background:#fd5b01; color:#fff; border:none;
          border-radius:12px;
          font-family:'Sora',sans-serif; font-size:16px; font-weight:800;
          cursor:pointer;
          box-shadow:0 6px 24px rgba(253,91,1,0.4);
          transition:background 0.2s, transform 0.1s, opacity 0.2s;
          display:flex; align-items:center; justify-content:center; gap:10px;
        }
        .ck-pay-btn:hover:not(:disabled) { background:#e04e00; transform:translateY(-1px); }
        .ck-pay-btn:active:not(:disabled) { transform:scale(0.99); }
        .ck-pay-btn:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; }

        .ck-spinner { width:18px; height:18px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:ck-spin 0.7s linear infinite; }

        /* Sucesso */
        .ck-success { text-align:center; padding:0.5rem 0; animation:ck-fadeIn 0.4s ease; }
        .ck-success-icon { font-size:52px; margin-bottom:12px; }
        .ck-success-title { font-size:20px; font-weight:800; color:#fff; letter-spacing:-0.02em; margin-bottom:8px; }
        .ck-success-sub   { font-size:13px; color:#888; line-height:1.6; margin-bottom:1.5rem; }
        .ck-success-info  {
          background:rgba(74,222,128,0.07); border:1px solid rgba(74,222,128,0.2);
          border-radius:12px; padding:14px 16px; margin-bottom:1.5rem;
          font-size:12px; color:#4ade80; text-align:left; line-height:1.7;
          display:flex; align-items:flex-start; gap:10px;
        }
        .ck-success-link {
          display:inline-flex; align-items:center; gap:8px;
          background:#fd5b01; color:#fff; text-decoration:none;
          padding:13px 28px; border-radius:10px;
          font-size:14px; font-weight:700;
          box-shadow:0 4px 16px rgba(253,91,1,0.35);
          transition:background 0.2s;
        }
        .ck-success-link:hover { background:#e04e00; }

        /* Erro */
        .ck-error { background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:10px; padding:12px 14px; font-size:13px; color:#f87171; margin-top:12px; }

        /* Aviso modo simulado */
        .ck-notice {
          background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2);
          border-radius:10px; padding:12px 14px;
          font-size:12px; color:#f59e0b; display:flex; gap:8px; align-items:flex-start;
        }
      `}</style>

      <div className="ck ck-page">
        <div className="ck-inner">
          <Link href={`/appointments/${appointmentId}`} className="ck-back">
            ← Voltar ao agendamento
          </Link>

          {simulate.isSuccess ? (
            /* ── SUCESSO ── */
            <div className="ck-card" style={{ textAlign: "center" }}>
              <div className="ck-success">
                <div className="ck-success-icon">✅</div>
                <h2 className="ck-success-title">Pagamento aprovado!</h2>
                <p className="ck-success-sub">
                  Seu pagamento foi processado com sucesso.<br />
                  Redirecionando para o agendamento...
                </p>
                <div className="ck-success-info">
                  <span>🔒</span>
                  <span>
                    <strong>Valor retido em garantia</strong><br />
                    R$ {amount} foi retido em escrow e será liberado ao prestador após a conclusão e aprovação do serviço.
                  </span>
                </div>
                <Link href={`/appointments/${appointmentId}`} className="ck-success-link">
                  Ver agendamento →
                </Link>
              </div>
            </div>
          ) : (
            /* ── FORMULÁRIO ── */
            <>
              <div className="ck-header">
                <div className="ck-header-icon">🔐</div>
                <h1 className="ck-title">Finalizar Pagamento</h1>
                <p className="ck-subtitle">Revise os dados e escolha o método de pagamento</p>
              </div>

              {/* Resumo */}
              <div className="ck-card">
                <div className="ck-section-label">Resumo do agendamento</div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0, border: "2px solid rgba(253,91,1,0.3)", background: "#111" }}>
                    {avatarUrl
                      ? <Image src={avatarUrl} fill alt={providerName} style={{ objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#fd5b01,#ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>
                          {providerName[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>{providerName}</p>
                    <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>{appt.service?.title ?? "Serviço"}</p>
                  </div>
                </div>

                <div className="ck-summary-row">
                  <span className="ck-summary-label">Data</span>
                  <span className="ck-summary-value" style={{ textTransform: "capitalize" }}>{date}</span>
                </div>
                <div className="ck-summary-row">
                  <span className="ck-summary-label">Serviço</span>
                  <span className="ck-summary-value">{appt.service?.title ?? "—"}</span>
                </div>
                {appt.service?.duration && (
                  <div className="ck-summary-row">
                    <span className="ck-summary-label">Duração</span>
                    <span className="ck-summary-value">{appt.service.duration} min</span>
                  </div>
                )}
                <div className="ck-summary-row">
                  <span className="ck-summary-label">Total</span>
                  <span className="ck-amount">R$ {amount}</span>
                </div>
              </div>

              {/* Método de pagamento */}
              <div className="ck-card">
                <div className="ck-section-label">Método de pagamento</div>

                {(["pix", "card"] as PaymentMethod[]).map(m => (
                  <div
                    key={m}
                    className={`ck-method${method === m ? " selected" : ""}`}
                    onClick={() => setMethod(m)}
                  >
                    <div className="ck-method-radio">
                      <div className="ck-method-radio-dot" style={{ opacity: method === m ? 1 : 0 }} />
                    </div>
                    <span className="ck-method-icon">{m === "pix" ? "🟩" : "💳"}</span>
                    <div>
                      <p className="ck-method-label">{m === "pix" ? "PIX" : "Cartão de crédito"}</p>
                      <p className="ck-method-desc">
                        {m === "pix"
                          ? "Aprovação instantânea"
                          : "Parcelamento disponível"}
                      </p>
                    </div>
                    <span className="ck-sandbox-badge">Simulado</span>
                  </div>
                ))}
              </div>

              {/* Aviso modo acadêmico */}
              <div className="ck-notice" style={{ marginBottom: "1rem" }}>
                <span>🎓</span>
                <span>
                  <strong>Modo acadêmico:</strong> nenhum valor real será cobrado. O pagamento é simulado para demonstração do fluxo de escrow.
                </span>
              </div>

              {/* Erro */}
              {simulate.error && (
                <div className="ck-error">⚠️ {simulate.error.message}</div>
              )}

              {/* Botão pagar */}
              <button
                className="ck-pay-btn"
                onClick={handlePay}
                disabled={simulate.isPending}
              >
                {simulate.isPending
                  ? <><div className="ck-spinner" /> Processando...</>
                  : <>🔒 Pagar Agora · R$ {amount}</>
                }
              </button>

              <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 12, lineHeight: 1.6, fontFamily: "'Sora',sans-serif" }}>
                Ao pagar, o valor é retido em garantia e liberado ao prestador somente após conclusão e aprovação do serviço.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
