"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useAvailableSlots } from "@/hooks/useProviders";
import { useCreateAppointment } from "@/hooks/useAppointments";

type Step = "date" | "time" | "summary" | "success";

type Props = {
  providerId:      string;
  providerName?:   string;
  serviceId:       string;
  serviceTitle?:   string;
  servicePrice?:   number;
  serviceDuration?: number;
};

// Converte slot UTC "HH:mm" + dateStr para horário local do navegador
function utcSlotToLocal(dateStr: string, utcTime: string): string {
  const dt = new Date(`${dateStr}T${utcTime}:00.000Z`);
  return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Formata data para exibição local
function formatDateLocal(dateStr: string): string {
  const dt = new Date(`${dateStr}T12:00:00.000Z`);
  return dt.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

// Retorna a data de hoje no fuso do usuário como string YYYY-MM-DD
function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AgendarButton({
  providerId,
  providerName,
  serviceId,
  serviceTitle,
  servicePrice,
  serviceDuration,
}: Props) {
  const { dbUser } = useAuth();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(""); // UTC slot "HH:mm"
  const [erroData, setErroData] = useState("");

  const today = todayLocal();

  const {
    data:      slots = [],
    isLoading: slotsLoading,
    isFetching: slotsFetching,
  } = useAvailableSlots(providerId, selectedDate, serviceDuration);

  const createAppt = useCreateAppointment();

  // Label do horário convertido para local
  const localTime = useMemo(
    () => selectedSlot ? utcSlotToLocal(selectedDate, selectedSlot) : "",
    [selectedDate, selectedSlot],
  );

  // scheduledAt em UTC para enviar ao backend
  const scheduledAtUTC = selectedDate && selectedSlot
    ? `${selectedDate}T${selectedSlot}:00.000Z`
    : "";

  // Data e hora formatadas para exibição
  const formattedDate = selectedDate ? formatDateLocal(selectedDate) : "";

  function handleDateChange(value: string) {
    if (!value) return;
    if (value < today) {
      setErroData("Não é possível agendar em datas passadas.");
      return;
    }
    setErroData("");
    setSelectedDate(value);
    setSelectedSlot("");
    setStep("time");
  }

  function handleSelectSlot(slot: string) {
    setSelectedSlot(slot);
    setStep("summary");
  }

  function handleConfirm() {
    if (!scheduledAtUTC || !dbUser) return;
    createAppt.mutate(
      { userId: dbUser.id, serviceId, providerId, scheduledAt: scheduledAtUTC },
      {
        onSuccess: () => setStep("success"),
      },
    );
  }

  function handleFechar() {
    setShowModal(false);
    setStep("date");
    setSelectedDate("");
    setSelectedSlot("");
    setErroData("");
    createAppt.reset();
  }

  const loading = slotsLoading || slotsFetching;

  return (
    <>
      <style>{`
        @keyframes ag-fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes ag-popIn  { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ag-spin   { to{transform:rotate(360deg)} }

        .ag-btn {
          padding: 10px 20px; background: var(--brand,#fd5b01); color: #fff; border: none;
          border-radius: 9px; font-family: var(--font,'Sora',sans-serif); font-size: 13px;
          font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 14px rgba(253,91,1,0.32);
          transition: background .15s, transform .1s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ag-btn:hover  { background: var(--brand-hover,#e04e00); }
        .ag-btn:active { transform: scale(0.97); }

        .ag-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.82); z-index: 600;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          animation: ag-fadeIn 0.2s ease;
        }
        .ag-modal {
          background: var(--surface,#1a1a1a);
          border: 1px solid var(--border-2,rgba(255,255,255,0.12));
          border-radius: 20px; padding: 1.75rem; width: 100%; max-width: 440px;
          max-height: 92vh; overflow-y: auto; position: relative;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          animation: ag-popIn 0.25s ease;
          font-family: var(--font,'Sora',sans-serif);
        }
        .ag-close {
          position: absolute; top: 14px; right: 14px;
          background: rgba(255,255,255,0.07); border: none; border-radius: 7px;
          padding: 7px 11px; cursor: pointer; font-size: 14px; color: var(--t2,#aaa);
          transition: all .15s;
        }
        .ag-close:hover { background: rgba(253,91,1,0.15); color: #fd5b01; }

        /* Progress steps */
        .ag-steps { display: flex; align-items: center; gap: 0; margin-bottom: 1.5rem; }
        .ag-step { flex: 1; height: 3px; background: rgba(255,255,255,0.10); border-radius: 2px; transition: background 0.3s; }
        .ag-step.done   { background: var(--brand,#fd5b01); }
        .ag-step.active { background: rgba(253,91,1,0.45); }
        .ag-step-gap { width: 4px; }

        .ag-label    { font-size: 11px; font-weight: 700; color: var(--t3,#666); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: block; }
        .ag-title    { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.025em; margin-bottom: 4px; }
        .ag-subtitle { font-size: 13px; color: var(--t3,#666); margin-bottom: 1.5rem; }

        .ag-input-date {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 10px; font-family: var(--font,'Sora',sans-serif);
          font-size: 13px; color: #fff; outline: none; cursor: pointer;
          transition: border-color .2s; color-scheme: dark; margin-bottom: 4px;
        }
        .ag-input-date:focus { border-color: #fd5b01; box-shadow: 0 0 0 3px rgba(253,91,1,0.12); }
        .ag-input-date.erro  { border-color: #f87171; }
        .ag-erro { font-size: 11px; color: #f87171; margin-top: 4px; }

        .ag-slots-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 1.5rem 0; color: var(--t3,#666); font-size: 13px; }
        .ag-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.10); border-top-color: #fd5b01; border-radius: 50%; animation: ag-spin 0.7s linear infinite; flex-shrink: 0; }
        .ag-no-slots { text-align: center; padding: 1.5rem 0; color: var(--t3,#666); font-size: 13px; }

        .ag-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 0.75rem 0 1.25rem; }
        .ag-slot {
          padding: 10px 4px;
          background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 9px; font-family: var(--font,'Sora',sans-serif);
          font-size: 13px; font-weight: 600; color: var(--t2,#ccc);
          cursor: pointer; transition: all .15s; text-align: center;
        }
        .ag-slot:hover   { background: rgba(253,91,1,0.12); border-color: rgba(253,91,1,0.40); color: #fd5b01; }
        .ag-slot.selected { background: #fd5b01; border-color: #fd5b01; color: #fff; box-shadow: 0 4px 14px rgba(253,91,1,0.30); }

        .ag-summary-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
        .ag-summary-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
        .ag-summary-row:last-child { border-bottom: none; padding-bottom: 0; }
        .ag-summary-label { color: var(--t3,#666); }
        .ag-summary-value { color: var(--t1,#e0e0e0); font-weight: 600; text-align: right; }
        .ag-summary-price { color: var(--brand,#fd5b01); font-size: 18px; font-weight: 800; }

        .ag-tz-note { font-size: 11px; color: var(--t4,#555); text-align: center; margin-bottom: 1rem; }

        .ag-btn-primary {
          width: 100%; padding: 13px; background: var(--brand,#fd5b01); color: #fff;
          border: none; border-radius: 10px; font-family: var(--font,'Sora',sans-serif);
          font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: var(--shadow-brand,0 4px 20px rgba(253,91,1,0.35));
          transition: background .15s, transform .1s;
          display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none;
        }
        .ag-btn-primary:hover:not(:disabled)  { background: var(--brand-hover,#e04e00); }
        .ag-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .ag-btn-primary:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }

        .ag-btn-ghost {
          width: 100%; padding: 11px; background: transparent;
          border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px;
          color: var(--t3,#888); font-family: var(--font,'Sora',sans-serif);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; margin-top: 8px;
        }
        .ag-btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: var(--t2,#ccc); }

        .ag-back { background: none; border: none; color: var(--brand,#fd5b01); font-family: var(--font,'Sora',sans-serif); font-size: 12px; font-weight: 600; cursor: pointer; padding: 0 0 1rem; display: flex; align-items: center; gap: 4px; transition: opacity .15s; }
        .ag-back:hover { opacity: 0.7; }

        .ag-success { text-align: center; padding: 0.5rem 0; }
        .ag-success-icon { font-size: 48px; margin-bottom: 12px; }
        .ag-success h3 { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; }
        .ag-success p  { font-size: 13px; color: var(--t3,#888); line-height: 1.6; margin-bottom: 1.25rem; }
        .ag-expiry-note {
          font-size: 12px; color: #f59e0b;
          background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.20);
          border-radius: 8px; padding: 8px 12px; margin-bottom: 1.25rem;
        }
        .ag-login-warn { font-size: 11px; color: #f87171; text-align: center; margin-top: 8px; }
      `}</style>

      <button className="ag-btn" onClick={() => { setShowModal(true); setStep("date"); }}>
        📅 Agendar
      </button>

      {showModal && (
        <div className="ag-overlay" onClick={handleFechar}>
          <div className="ag-modal" onClick={e => e.stopPropagation()}>
            <button className="ag-close" onClick={handleFechar}>✕</button>

            {/* PROGRESS STEPS */}
            {step !== "success" && (
              <div className="ag-steps">
                <div className={`ag-step ${step !== "date" ? "done" : "active"}`} />
                <div className="ag-step-gap" />
                <div className={`ag-step ${step === "summary" ? "done" : step === "time" ? "active" : ""}`} />
                <div className="ag-step-gap" />
                <div className={`ag-step ${step === "summary" ? "active" : ""}`} />
              </div>
            )}

            {/* STEP 1: DATA */}
            {step === "date" && (
              <>
                <p className="ag-title">📅 Escolha a data</p>
                <p className="ag-subtitle">
                  {serviceTitle ? `${serviceTitle}${servicePrice != null ? ` · R$ ${servicePrice.toFixed(2)}` : ""}` : "Selecione uma data disponível"}
                </p>
                <label className="ag-label">Data do atendimento</label>
                <input
                  className={`ag-input-date${erroData ? " erro" : ""}`}
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => handleDateChange(e.target.value)}
                />
                {erroData && <p className="ag-erro">⚠️ {erroData}</p>}
                {!dbUser && <p className="ag-login-warn">Entre na sua conta para agendar.</p>}
              </>
            )}

            {/* STEP 2: HORÁRIOS */}
            {step === "time" && (
              <>
                <button className="ag-back" onClick={() => setStep("date")}>← Alterar data</button>
                <p className="ag-title">⏰ Escolha o horário</p>
                <p className="ag-subtitle" style={{ textTransform: "capitalize" }}>{formattedDate}</p>

                {loading && (
                  <div className="ag-slots-loading">
                    <div className="ag-spinner" />
                    Verificando disponibilidade...
                  </div>
                )}

                {!loading && slots.length === 0 && (
                  <div className="ag-no-slots">
                    <p style={{ fontSize: 22, marginBottom: 8 }}>📅</p>
                    <p style={{ fontWeight: 600, color: "#ccc", marginBottom: 6 }}>Sem horários disponíveis</p>
                    <p style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
                      Neste dia o prestador não tem disponibilidade ou está ausente.<br />
                      Por favor, escolha outra data.
                    </p>
                    <button className="ag-btn-ghost" onClick={() => setStep("date")}>← Escolher outra data</button>
                  </div>
                )}

                {!loading && slots.length > 0 && (
                  <>
                    <p className="ag-tz-note">
                      Horários no seu fuso local ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </p>
                    <div className="ag-grid">
                      {slots.map(slot => (
                        <button
                          key={slot}
                          className={`ag-slot${selectedSlot === slot ? " selected" : ""}`}
                          onClick={() => handleSelectSlot(slot)}
                        >
                          {utcSlotToLocal(selectedDate, slot)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* STEP 3: RESUMO */}
            {step === "summary" && (
              <>
                <button className="ag-back" onClick={() => setStep("time")}>← Alterar horário</button>
                <p className="ag-title">✅ Confirmar agendamento</p>
                <p className="ag-subtitle">Revise os detalhes antes de confirmar</p>

                <div className="ag-summary-box">
                  {providerName && (
                    <div className="ag-summary-row">
                      <span className="ag-summary-label">Prestador</span>
                      <span className="ag-summary-value">{providerName}</span>
                    </div>
                  )}
                  {serviceTitle && (
                    <div className="ag-summary-row">
                      <span className="ag-summary-label">Serviço</span>
                      <span className="ag-summary-value">{serviceTitle}</span>
                    </div>
                  )}
                  <div className="ag-summary-row">
                    <span className="ag-summary-label">Data</span>
                    <span className="ag-summary-value" style={{ textTransform: "capitalize", maxWidth: "55%" }}>{formattedDate}</span>
                  </div>
                  <div className="ag-summary-row">
                    <span className="ag-summary-label">Horário</span>
                    <span className="ag-summary-value">{localTime}</span>
                  </div>
                  {serviceDuration && (
                    <div className="ag-summary-row">
                      <span className="ag-summary-label">Duração</span>
                      <span className="ag-summary-value">{serviceDuration} min</span>
                    </div>
                  )}
                  {servicePrice != null && (
                    <div className="ag-summary-row">
                      <span className="ag-summary-label">Valor</span>
                      <span className="ag-summary-price">R$ {servicePrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="ag-expiry-note">
                  ⏳ Após confirmar, você tem <strong>30 minutos</strong> para completar o pagamento.
                </div>

                {createAppt.error && (
                  <p className="ag-erro" style={{ marginBottom: 10 }}>⚠️ {createAppt.error.message}</p>
                )}

                <button
                  className="ag-btn-primary"
                  disabled={createAppt.isPending || !dbUser}
                  onClick={handleConfirm}
                >
                  {createAppt.isPending
                    ? <><div className="ag-spinner" /> Confirmando...</>
                    : "Confirmar agendamento →"}
                </button>
                {!dbUser && <p className="ag-login-warn">Entre na sua conta para agendar.</p>}
              </>
            )}

            {/* STEP 4: SUCESSO */}
            {step === "success" && createAppt.data && (
              <div className="ag-success">
                <div className="ag-success-icon">🎉</div>
                <h3>Agendamento criado!</h3>
                <p>
                  <strong style={{ color: "#fff" }}>{serviceTitle}</strong> com{" "}
                  <strong style={{ color: "#fff" }}>{providerName ?? "o prestador"}</strong>
                  <br />
                  <span style={{ textTransform: "capitalize" }}>{formattedDate}</span> às {localTime}
                </p>
                <div className="ag-expiry-note">
                  ⏳ Complete o pagamento em <strong>30 minutos</strong> para garantir sua reserva.
                </div>
                <a
                  href={`/checkout/${createAppt.data.id}`}
                  className="ag-btn-primary"
                  style={{ marginBottom: 8 }}
                >
                  🔒 Pagar agora →
                </a>
                <a
                  href="/appointments"
                  className="ag-btn-primary"
                  style={{ background: "rgba(255,255,255,0.08)", boxShadow: "none", marginBottom: 8 }}
                >
                  Ver meus agendamentos
                </a>
                <button className="ag-btn-ghost" onClick={handleFechar}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
