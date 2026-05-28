"use client";

import { useState } from "react";

const agendamentosRealizados: string[] = [];

export default function AgendarButton() {
  const [showModal, setShowModal]       = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmed, setConfirmed]       = useState(false);
  const [erroData, setErroData]         = useState("");

  const horarios = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00"];
  const today   = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  function isHorarioOcupado(h: string) { return agendamentosRealizados.includes(`${selectedDate}|${h}`); }
  function isHorarioPassado(h: string) { return selectedDate === today && h <= nowTime; }

  function handleDataChange(value: string) {
    if (value < today) { setErroData("Não é possível agendar em datas passadas."); setSelectedDate(""); setSelectedTime(""); return; }
    setErroData(""); setSelectedDate(value); setSelectedTime("");
  }

  function handleFinalizar() {
    if (!selectedDate || !selectedTime) return;
    agendamentosRealizados.push(`${selectedDate}|${selectedTime}`);
    setConfirmed(true);
  }

  function handleFechar() {
    setShowModal(false); setSelectedDate(""); setSelectedTime(""); setConfirmed(false); setErroData("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        @keyframes ag-fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes ag-popIn  { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }

        .ag-btn { padding:10px 20px; background:#fd5b01; color:#fff; border:none; border-radius:8px; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:flex; align-items:center; gap:6px; }
        .ag-btn:hover  { background:#d94d00; box-shadow:0 6px 16px rgba(253,91,1,0.4); }
        .ag-btn:active { transform:scale(0.97); }

        .ag-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:600; display:flex; align-items:center; justify-content:center; padding:1rem; animation:ag-fadeIn 0.2s ease; }
        .ag-modal { background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:2rem; width:100%; max-width:420px; position:relative; box-shadow:0 24px 64px rgba(0,0,0,0.6); animation:ag-popIn 0.25s ease; font-family:'Sora',sans-serif; }
        .ag-close { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.08); border:none; border-radius:6px; padding:6px 10px; cursor:pointer; font-size:14px; color:#aaa; transition:all .15s; }
        .ag-close:hover { background:#fd5b01; color:#fff; }

        .ag-title    { font-size:18px; font-weight:700; color:#fff; letter-spacing:-0.02em; margin-bottom:4px; }
        .ag-subtitle { font-size:13px; color:#777; margin-bottom:1.5rem; }
        .ag-label    { font-size:11px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; display:block; }

        .ag-input-date { width:100%; padding:11px 14px; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.1); border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; color:#fff; outline:none; cursor:pointer; transition:border-color .2s,box-shadow .2s; margin-bottom:4px; }
        .ag-input-date:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .ag-input-date.erro { border-color:#f87171; }

        .ag-erro-msg { font-size:11px; color:#f87171; margin-bottom:1rem; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:8px; padding:8px 12px; }

        .ag-times-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:1.5rem; margin-top:.75rem; }
        .ag-time-btn  { padding:9px 4px; background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.08); border-radius:8px; font-family:'Sora',sans-serif; font-size:12px; font-weight:600; color:#ccc; cursor:pointer; transition:all .15s; text-align:center; }
        .ag-time-btn:hover:not(:disabled) { background:rgba(253,91,1,0.12); border-color:rgba(253,91,1,0.4); color:#fd5b01; }
        .ag-time-btn.selected { background:#fd5b01; border-color:#fd5b01; color:#fff; box-shadow:0 2px 8px rgba(253,91,1,0.3); }
        .ag-time-btn.ocupado  { background:rgba(248,113,113,0.08); border-color:rgba(248,113,113,0.25); color:#f87171; cursor:not-allowed; opacity:.6; }
        .ag-time-btn:disabled { opacity:.3; cursor:not-allowed; }

        .ag-legenda { display:flex; gap:12px; margin-bottom:1rem; flex-wrap:wrap; }
        .ag-legenda-item { display:flex; align-items:center; gap:5px; font-size:10px; color:#666; }
        .ag-legenda-dot { width:10px; height:10px; border-radius:3px; }

        .ag-summary { background:rgba(253,91,1,0.08); border:1px solid rgba(253,91,1,0.15); border-radius:10px; padding:12px 14px; margin-bottom:1.25rem; font-size:13px; color:#ccc; display:flex; flex-direction:column; gap:4px; }
        .ag-summary strong { color:#fd5b01; }

        .ag-finalizar { width:100%; padding:12px; background:#fd5b01; color:#fff; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(253,91,1,0.3); transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .ag-finalizar:hover:not(:disabled) { background:#d94d00; }
        .ag-finalizar:active:not(:disabled) { transform:scale(0.98); }
        .ag-finalizar:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }

        .ag-success { text-align:center; padding:1rem 0; }
        .ag-success-icon { font-size:48px; margin-bottom:12px; }
        .ag-success h3  { font-size:18px; font-weight:700; color:#fff; letter-spacing:-0.02em; margin-bottom:8px; }
        .ag-success p   { font-size:13px; color:#888; line-height:1.6; margin-bottom:1.5rem; }
        .ag-success-detail { background:rgba(253,91,1,0.08); border:1px solid rgba(253,91,1,0.15); border-radius:10px; padding:12px 16px; margin-bottom:1.5rem; font-size:13px; color:#ccc; display:flex; flex-direction:column; gap:6px; }
        .ag-success-detail span  { display:flex; align-items:center; gap:8px; }
        .ag-success-detail strong { color:#fd5b01; }
      `}</style>

      <button className="ag-btn" onClick={() => setShowModal(true)}>📅 Agendar</button>

      {showModal && (
        <div className="ag-overlay" onClick={handleFechar}>
          <div className="ag-modal" onClick={e => e.stopPropagation()}>
            <button className="ag-close" onClick={handleFechar}>✕</button>

            {confirmed ? (
              <div className="ag-success">
                <div className="ag-success-icon">✅</div>
                <h3>Agendamento confirmado!</h3>
                <p>Seu horário foi reservado com sucesso.</p>
                <div className="ag-success-detail">
                  <span>📅 <span>Data: <strong>{new Date(selectedDate+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</strong></span></span>
                  <span>⏰ <span>Horário: <strong>{selectedTime}</strong></span></span>
                </div>
                <button className="ag-finalizar" onClick={handleFechar}>Fechar</button>
              </div>
            ) : (
              <>
                <p className="ag-title">📅 Agendar horário</p>
                <p className="ag-subtitle">Escolha uma data e um horário disponível</p>

                <label className="ag-label">1. Escolha a data</label>
                <input className={`ag-input-date ${erroData ? "erro" : ""}`} type="date" min={today} value={selectedDate} onChange={e => handleDataChange(e.target.value)} />
                {erroData && <div className="ag-erro-msg">⚠️ {erroData}</div>}

                <label className="ag-label" style={{ opacity: selectedDate ? 1 : 0.4, marginTop:".75rem" }}>
                  2. Escolha o horário{!selectedDate && <span style={{ fontSize:10, fontWeight:400, textTransform:"none" }}> (escolha a data primeiro)</span>}
                </label>

                {selectedDate && (
                  <div className="ag-legenda">
                    <div className="ag-legenda-item"><div className="ag-legenda-dot" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)" }}/>Disponível</div>
                    <div className="ag-legenda-item"><div className="ag-legenda-dot" style={{ background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)" }}/>Indisponível</div>
                    <div className="ag-legenda-item"><div className="ag-legenda-dot" style={{ background:"#fd5b01" }}/>Selecionado</div>
                  </div>
                )}

                <div className="ag-times-grid">
                  {horarios.map(h => {
                    const ocupado = isHorarioOcupado(h);
                    const passado = isHorarioPassado(h);
                    const indisponivel = ocupado || passado;
                    return (
                      <button key={h}
                        className={`ag-time-btn ${selectedTime === h ? "selected" : ""} ${indisponivel ? "ocupado" : ""}`}
                        disabled={!selectedDate || indisponivel}
                        onClick={() => setSelectedTime(h)}
                      >
                        {h}
                        {ocupado && <span style={{ display:"block", fontSize:8 }}>Ocupado</span>}
                        {passado && !ocupado && <span style={{ display:"block", fontSize:8 }}>Passou</span>}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && selectedTime && (
                  <div className="ag-summary">
                    <span>📅 <strong>{new Date(selectedDate+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</strong></span>
                    <span>⏰ <strong>{selectedTime}</strong></span>
                  </div>
                )}

                <button className="ag-finalizar" disabled={!selectedDate || !selectedTime} onClick={handleFinalizar}>
                  Confirmar agendamento →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
