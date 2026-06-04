"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useAvailableSlots } from "@/hooks/useProviders";
import { useCreateAppointment } from "@/hooks/useAppointments";

type Props = {
  providerId:    string;
  serviceId:     string;
  serviceTitle?: string;
  servicePrice?: number;
};

export default function AgendarButton({
  providerId,
  serviceId,
  serviceTitle,
  servicePrice,
}: Props) {
  const { dbUser } = useAuth();

  const [showModal,    setShowModal]    = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [erroData,     setErroData]     = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Slots reais da API (só ativa quando data selecionada)
  const {
    data:      slots = [],
    isLoading: slotsLoading,
    isFetching: slotsFetching,
  } = useAvailableSlots(providerId, selectedDate);

  // Mutation de criação
  const createAppt = useCreateAppointment();

  function handleDataChange(value: string) {
    if (value < today) {
      setErroData("Não é possível agendar em datas passadas.");
      setSelectedDate("");
      setSelectedTime("");
      return;
    }
    setErroData("");
    setSelectedDate(value);
    setSelectedTime("");
  }

  function handleFinalizar() {
    if (!selectedDate || !selectedTime || !dbUser) return;
    // Slots do backend são UTC HH:mm → scheduledAt em UTC
    const scheduledAt = `${selectedDate}T${selectedTime}:00.000Z`;
    createAppt.mutate({ userId: dbUser.id, serviceId, providerId, scheduledAt });
  }

  function handleFechar() {
    setShowModal(false);
    setSelectedDate("");
    setSelectedTime("");
    setErroData("");
    createAppt.reset();
  }

  const confirmed = createAppt.isSuccess;
  const apptErr   = createAppt.error?.message;
  const loading   = slotsLoading || slotsFetching;

  const formattedDate = selectedDate
    ? new Date(selectedDate + "T00:00:00.000Z").toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", timeZone: "UTC",
      })
    : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        @keyframes ag-fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes ag-popIn  { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes ag-spin   { to{transform:rotate(360deg)} }

        .ag-btn { padding:10px 20px; background:#fd5b01; color:#fff; border:none; border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:flex; align-items:center; gap:6px; }
        .ag-btn:hover  { background:#d94d00; box-shadow:0 6px 16px rgba(253,91,1,0.4); }
        .ag-btn:active { transform:scale(0.97); }

        .ag-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:600; display:flex; align-items:center; justify-content:center; padding:1rem; animation:ag-fadeIn 0.2s ease; }
        .ag-modal { background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:2rem; width:100%; max-width:420px; max-height:90vh; overflow-y:auto; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.6); animation:ag-popIn 0.25s ease; font-family:'Sora',sans-serif; }
        .ag-close { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-size:14px; color:#aaa; transition:all .15s; }
        .ag-close:hover { background:#fd5b01; color:#fff; }

        .ag-title    { font-size:18px; font-weight:700; color:#fff; letter-spacing:-0.02em; margin-bottom:4px; }
        .ag-subtitle { font-size:13px; color:#777; margin-bottom:1.5rem; }
        .ag-label    { font-size:11px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; display:block; }

        .ag-input-date { width:100%; padding:11px 14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; color:#fff; outline:none; cursor:pointer; transition:border-color .2s,box-shadow .2s; margin-bottom:4px; color-scheme:dark; }
        .ag-input-date:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .ag-input-date.erro  { border-color:#f87171; }

        .ag-erro-msg { font-size:11px; color:#f87171; margin-bottom:1rem; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:8px; padding:8px 12px; }

        .ag-slots-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:1.25rem 0; color:#666; font-size:13px; }
        .ag-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.1); border-top-color:#fd5b01; border-radius:50%; animation:ag-spin 0.7s linear infinite; flex-shrink:0; }
        .ag-no-slots { text-align:center; padding:1.25rem 0; color:#f87171; font-size:13px; }

        .ag-times-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:0.75rem 0 1.5rem; }
        .ag-time-btn  { padding:9px 4px; background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.08); border-radius:8px; font-family:'Sora',sans-serif; font-size:12px; font-weight:600; color:#ccc; cursor:pointer; transition:all .15s; text-align:center; }
        .ag-time-btn:hover { background:rgba(253,91,1,0.12); border-color:rgba(253,91,1,0.4); color:#fd5b01; }
        .ag-time-btn.selected { background:#fd5b01; border-color:#fd5b01; color:#fff; box-shadow:0 2px 8px rgba(253,91,1,0.3); }

        .ag-summary { background:rgba(253,91,1,0.08); border:1px solid rgba(253,91,1,0.15); border-radius:10px; padding:12px 14px; margin-bottom:1.25rem; font-size:13px; color:#ccc; display:flex; flex-direction:column; gap:4px; }
        .ag-summary strong { color:#fd5b01; }

        .ag-finalizar { width:100%; padding:12px; background:#fd5b01; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; }
        .ag-finalizar:hover:not(:disabled) { background:#d94d00; }
        .ag-finalizar:active:not(:disabled) { transform:scale(0.98); }
        .ag-finalizar:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }

        .ag-success { text-align:center; padding:1rem 0; }
        .ag-success-icon { font-size:48px; margin-bottom:12px; }
        .ag-success h3  { font-size:18px; font-weight:700; color:#fff; letter-spacing:-0.02em; margin-bottom:8px; }
        .ag-success p   { font-size:13px; color:#888; line-height:1.6; margin-bottom:1.5rem; }
        .ag-success-detail { background:rgba(253,91,1,0.08); border:1px solid rgba(253,91,1,0.15); border-radius:10px; padding:12px 16px; margin-bottom:1rem; font-size:13px; color:#ccc; display:flex; flex-direction:column; gap:6px; }
        .ag-success-detail span  { display:flex; align-items:center; gap:8px; }
        .ag-success-detail strong { color:#fd5b01; }
        .ag-login-warn { font-size:11px; color:#f87171; text-align:center; margin-top:8px; }
      `}</style>

      <button className="ag-btn" onClick={() => setShowModal(true)}>📅 Agendar</button>

      {showModal && (
        <div className="ag-overlay" onClick={handleFechar}>
          <div className="ag-modal" onClick={e => e.stopPropagation()}>
            <button className="ag-close" onClick={handleFechar}>✕</button>

            {/* ── SUCESSO ── */}
            {confirmed ? (
              <div className="ag-success">
                <div className="ag-success-icon">✅</div>
                <h3>Agendamento criado!</h3>
                <p>Seu horário foi reservado com sucesso. Acompanhe o status nos seus agendamentos.</p>
                <div className="ag-success-detail">
                  <span>📅 <span>Data: <strong>{formattedDate}</strong></span></span>
                  <span>⏰ <span>Horário: <strong>{selectedTime} (UTC)</strong></span></span>
                  {serviceTitle && (
                    <span>🎯 <span>Serviço: <strong>{serviceTitle}</strong></span></span>
                  )}
                </div>
                {createAppt.data?.id && (
                  <a href={`/checkout/${createAppt.data.id}`} className="ag-finalizar" style={{ marginBottom: 8 }}>
                    🔒 Pagar agora →
                  </a>
                )}
                <a href="/appointments" className="ag-finalizar" style={{ marginBottom: 8, background: "rgba(255,255,255,0.08)", boxShadow: "none" }}>
                  Ver meus agendamentos
                </a>
                <button className="ag-finalizar" onClick={handleFechar} style={{ background: "rgba(255,255,255,0.08)", boxShadow: "none" }}>
                  Fechar
                </button>
              </div>
            ) : (
              /* ── FORMULÁRIO ── */
              <>
                <p className="ag-title">📅 Agendar horário</p>
                <p className="ag-subtitle">
                  {serviceTitle
                    ? `${serviceTitle}${servicePrice != null ? ` · R$ ${servicePrice.toFixed(2)}` : ""}`
                    : "Escolha uma data e horário disponível"}
                </p>

                {/* DATA */}
                <label className="ag-label">1. Escolha a data</label>
                <input
                  className={`ag-input-date${erroData ? " erro" : ""}`}
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={e => handleDataChange(e.target.value)}
                />
                {erroData && <div className="ag-erro-msg">⚠️ {erroData}</div>}

                {/* HORÁRIOS */}
                <label
                  className="ag-label"
                  style={{ opacity: selectedDate ? 1 : 0.4, marginTop: ".75rem" }}
                >
                  2. Escolha o horário
                  {!selectedDate && (
                    <span style={{ fontSize: 10, fontWeight: 400, textTransform: "none" }}>
                      {" "}(escolha a data primeiro)
                    </span>
                  )}
                </label>

                {selectedDate && loading && (
                  <div className="ag-slots-loading">
                    <div className="ag-spinner" />
                    Verificando disponibilidade...
                  </div>
                )}

                {selectedDate && !loading && slots.length === 0 && (
                  <div className="ag-no-slots">
                    Sem horários disponíveis nesta data.
                  </div>
                )}

                {selectedDate && !loading && slots.length > 0 && (
                  <div className="ag-times-grid">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        className={`ag-time-btn${selectedTime === slot ? " selected" : ""}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}

                {/* ERRO DE CRIAÇÃO */}
                {apptErr && (
                  <div className="ag-erro-msg" style={{ marginTop: ".5rem" }}>⚠️ {apptErr}</div>
                )}

                {/* RESUMO */}
                {selectedDate && selectedTime && (
                  <div className="ag-summary">
                    <span>📅 <strong>{formattedDate}</strong></span>
                    <span>⏰ <strong>{selectedTime} (UTC)</strong></span>
                    {servicePrice != null && (
                      <span>💰 <strong>R$ {servicePrice.toFixed(2)}</strong></span>
                    )}
                  </div>
                )}

                <button
                  className="ag-finalizar"
                  disabled={!selectedDate || !selectedTime || createAppt.isPending || !dbUser}
                  onClick={handleFinalizar}
                >
                  {createAppt.isPending ? (
                    <><div className="ag-spinner" /> Confirmando...</>
                  ) : (
                    "Confirmar agendamento →"
                  )}
                </button>

                {!dbUser && (
                  <p className="ag-login-warn">Faça login para agendar.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
