"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import {
  useMyAvailability,
  useSetAvailability,
  useMyBlocks,
  useCreateBlock,
  useDeleteBlock,
} from "@/hooks/useProviders";
import type { AvailabilityBlock } from "@/services/providers.service";

// ── Constantes ────────────────────────────────────────────────────────────────

const WEEKDAYS = [
  { label: "Segunda",  abbr: "Seg", value: 1 },
  { label: "Terça",    abbr: "Ter", value: 2 },
  { label: "Quarta",   abbr: "Qua", value: 3 },
  { label: "Quinta",   abbr: "Qui", value: 4 },
  { label: "Sexta",    abbr: "Sex", value: 5 },
  { label: "Sábado",   abbr: "Sáb", value: 6 },
  { label: "Domingo",  abbr: "Dom", value: 0 },
];

type DaySchedule = { enabled: boolean; startTime: string; endTime: string };

const DEFAULT_SCHEDULE: Record<number, DaySchedule> = Object.fromEntries(
  [0, 1, 2, 3, 4, 5, 6].map(w => [w, { enabled: false, startTime: "09:00", endTime: "18:00" }])
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function validRange(start: string, end: string) {
  return !!start && !!end && toMinutes(start) < toMinutes(end);
}

function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Mínimo para datetime-local input (agora + 1 min)
function nowLocalInput() {
  const d = new Date(Date.now() + 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Componente de linha de dia ────────────────────────────────────────────────

function DayRow({
  day,
  schedule,
  onChange,
  error,
}: {
  day: typeof WEEKDAYS[number];
  schedule: DaySchedule;
  onChange: (w: number, patch: Partial<DaySchedule>) => void;
  error?: string;
}) {
  return (
    <div style={{
      padding: "14px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 110 }}>
          <span style={{
            display: "inline-block",
            width: 36, height: 20,
            borderRadius: 10,
            background: schedule.enabled ? "#fd5b01" : "rgba(255,255,255,0.12)",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}>
            <span style={{
              position: "absolute",
              top: 2, left: schedule.enabled ? 18 : 2,
              width: 16, height: 16,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }} />
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={e => onChange(day.value, { enabled: e.target.checked })}
              style={{ display: "none" }}
            />
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: schedule.enabled ? "#f0f0f0" : "#555",
            transition: "color 0.2s",
            fontFamily: "'Sora', sans-serif",
          }}>
            {day.label}
          </span>
        </label>

        {/* Intervalo de tempo */}
        {schedule.enabled && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="time"
              value={schedule.startTime}
              onChange={e => onChange(day.value, { startTime: e.target.value })}
              className="av-time-input"
            />
            <span style={{ color: "#555", fontSize: 13, fontFamily: "'Sora',sans-serif" }}>→</span>
            <input
              type="time"
              value={schedule.endTime}
              onChange={e => onChange(day.value, { endTime: e.target.value })}
              className="av-time-input"
            />
          </div>
        )}

        {!schedule.enabled && (
          <span style={{ fontSize: 12, color: "#444", fontFamily: "'Sora',sans-serif" }}>
            Indisponível
          </span>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 11, color: "#f87171", marginTop: 6, fontFamily: "'Sora',sans-serif" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

// ── Componente de bloco ───────────────────────────────────────────────────────

function BlockItem({ block }: { block: AvailabilityBlock }) {
  const del = useDeleteBlock();

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "1rem 1.25rem",
      marginBottom: 10,
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-between", gap: 12,
      flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", fontFamily: "'Sora',sans-serif" }}>
            {fmtDatetime(block.startDatetime)}
          </span>
          <span style={{ color: "#555", fontSize: 12 }}>→</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", fontFamily: "'Sora',sans-serif" }}>
            {fmtDatetime(block.endDatetime)}
          </span>
        </div>
        {block.reason && (
          <p style={{ fontSize: 12, color: "#666", fontFamily: "'Sora',sans-serif" }}>
            {block.reason}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <button
          onClick={() => del.mutate(block.id)}
          disabled={del.isPending}
          style={{
            padding: "6px 14px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 8,
            color: "#f87171",
            fontFamily: "'Sora',sans-serif",
            fontSize: 12, fontWeight: 700,
            cursor: del.isPending ? "not-allowed" : "pointer",
            opacity: del.isPending ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {del.isPending ? "Excluindo..." : "Excluir"}
        </button>
        {del.error && (
          <span style={{ fontSize: 10, color: "#f87171", fontFamily: "'Sora',sans-serif" }}>
            ⚠️ {del.error.message}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const { dbUser, loading: authLoading } = useAuth();
  const { data: availability, isLoading: availLoading } = useMyAvailability();
  const { data: blocks,       isLoading: blocksLoading } = useMyBlocks();
  const setAvailability = useSetAvailability();
  const createBlock     = useCreateBlock();

  const [schedule,      setSchedule]      = useState<Record<number, DaySchedule>>(DEFAULT_SCHEDULE);
  const [scheduleInit,  setScheduleInit]  = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState<Record<number, string>>({});
  const [saveSuccess,   setSaveSuccess]   = useState(false);

  const [newStart,  setNewStart]  = useState("");
  const [newEnd,    setNewEnd]    = useState("");
  const [newReason, setNewReason] = useState("");
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});
  const [blockSuccess, setBlockSuccess] = useState(false);

  const minDatetime = nowLocalInput();

  // Popula estado local quando a disponibilidade carrega (apenas uma vez)
  useEffect(() => {
    if (!availability || scheduleInit) return;
    const updated = { ...DEFAULT_SCHEDULE };
    for (const rule of availability) {
      updated[rule.weekday] = {
        enabled:   true,
        startTime: rule.startTime,
        endTime:   rule.endTime,
      };
    }
    setSchedule(updated);
    setScheduleInit(true);
  }, [availability, scheduleInit]);

  // Reseta success após 3s
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [saveSuccess]);
  useEffect(() => {
    if (!blockSuccess) return;
    const t = setTimeout(() => setBlockSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [blockSuccess]);

  function updateDay(weekday: number, patch: Partial<DaySchedule>) {
    setSchedule(prev => ({ ...prev, [weekday]: { ...prev[weekday], ...patch } }));
    // Limpa erro deste dia ao editar
    setScheduleErrors(prev => { const n = { ...prev }; delete n[weekday]; return n; });
    setSaveSuccess(false);
  }

  function validateSchedule(): boolean {
    const errs: Record<number, string> = {};
    for (const { value: w } of WEEKDAYS) {
      const d = schedule[w];
      if (d.enabled && !validRange(d.startTime, d.endTime)) {
        errs[w] = "Horário inicial deve ser anterior ao horário final.";
      }
    }
    setScheduleErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validateSchedule()) return;
    const payload = WEEKDAYS
      .filter(d => schedule[d.value].enabled)
      .map(d => ({
        weekday:   d.value,
        startTime: schedule[d.value].startTime,
        endTime:   schedule[d.value].endTime,
      }));
    setAvailability.mutate(payload, {
      onSuccess: () => { setSaveSuccess(true); setScheduleInit(false); },
    });
  }

  function validateBlock(): boolean {
    const errs: Record<string, string> = {};
    if (!newStart) errs.start = "Informe a data e hora de início.";
    if (!newEnd)   errs.end   = "Informe a data e hora de fim.";
    if (!newReason.trim()) errs.reason = "Informe um motivo para o bloqueio.";
    if (newStart && newEnd && new Date(newStart) >= new Date(newEnd)) {
      errs.end = "Data/hora de fim deve ser posterior ao início.";
    }
    setBlockErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleCreateBlock() {
    if (!validateBlock()) return;
    createBlock.mutate(
      { startDateTime: newStart, endDateTime: newEnd, reason: newReason.trim() },
      {
        onSuccess: () => {
          setNewStart(""); setNewEnd(""); setNewReason("");
          setBlockErrors({});
          setBlockSuccess(true);
        },
      },
    );
  }

  // Guards
  if (authLoading) {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes av-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fd5b01", animation: "av-spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (dbUser?.role !== "PROVIDER") {
    return (
      <div style={{ background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Sora',sans-serif" }}>
        <p style={{ color: "#f87171", fontSize: 16 }}>Acesso restrito a prestadores.</p>
        <Link href="/home" style={{ color: "#fd5b01", textDecoration: "none", fontSize: 14 }}>← Voltar</Link>
      </div>
    );
  }

  const blockList = blocks ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes av-spin { to { transform: rotate(360deg); } }
        .av * { font-family:'Sora',sans-serif; box-sizing:border-box; }

        .av-page { background:#0d0d0d; min-height:100vh; padding:5rem 1.5rem 3rem; }
        .av-inner { max-width:640px; margin:0 auto; }

        .av-back { display:inline-flex; align-items:center; gap:6px; color:#555; font-size:13px; text-decoration:none; margin-bottom:1.5rem; transition:color 0.2s; }
        .av-back:hover { color:#fd5b01; }

        .av-title { font-size:24px; font-weight:800; color:#fff; letter-spacing:-0.03em; margin-bottom:4px; }
        .av-sub   { font-size:13px; color:#555; margin-bottom:2rem; }

        .av-card {
          background:#1a1a1a;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:18px; padding:1.75rem;
          margin-bottom:1.25rem;
        }

        .av-section-label {
          font-size:13px; font-weight:700; color:#aaa;
          text-transform:uppercase; letter-spacing:0.08em;
          margin-bottom:1.25rem;
          display:flex; align-items:center; gap:10px;
        }
        .av-section-label::before {
          content:''; display:block; width:3px; height:14px;
          background:#fd5b01; border-radius:2px; flex-shrink:0;
        }

        .av-time-input {
          padding:8px 12px;
          background:rgba(255,255,255,0.06);
          border:1.5px solid rgba(255,255,255,0.1);
          border-radius:8px;
          color:#f0f0f0;
          font-family:'Sora',sans-serif; font-size:13px;
          outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
          color-scheme:dark;
          width:110px;
        }
        .av-time-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }

        .av-datetime-input {
          width:100%; padding:11px 14px;
          background:rgba(255,255,255,0.06);
          border:1.5px solid rgba(255,255,255,0.1);
          border-radius:10px;
          color:#f0f0f0;
          font-family:'Sora',sans-serif; font-size:13px;
          outline:none; cursor:pointer;
          transition:border-color 0.2s, box-shadow 0.2s;
          color-scheme:dark;
        }
        .av-datetime-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .av-datetime-input.error { border-color:rgba(248,113,113,0.5); }

        .av-text-input {
          width:100%; padding:11px 14px;
          background:rgba(255,255,255,0.06);
          border:1.5px solid rgba(255,255,255,0.1);
          border-radius:10px;
          color:#f0f0f0;
          font-family:'Sora',sans-serif; font-size:13px;
          outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .av-text-input:focus { border-color:#fd5b01; box-shadow:0 0 0 3px rgba(253,91,1,0.12); }
        .av-text-input.error { border-color:rgba(248,113,113,0.5); }
        .av-text-input::placeholder { color:#444; }

        .av-label { font-size:11px; font-weight:700; color:#666; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; display:block; }
        .av-field { margin-bottom:14px; }
        .av-field-err { font-size:11px; color:#f87171; margin-top:4px; display:block; }

        .av-btn-primary {
          padding:12px 28px;
          background:#fd5b01; color:#fff; border:none;
          border-radius:10px;
          font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
          cursor:pointer;
          box-shadow:0 4px 16px rgba(253,91,1,0.35);
          transition:background 0.2s, opacity 0.2s;
          display:inline-flex; align-items:center; gap:8px;
        }
        .av-btn-primary:hover:not(:disabled) { background:#e04e00; }
        .av-btn-primary:disabled { opacity:0.4; cursor:not-allowed; box-shadow:none; }

        .av-btn-secondary {
          padding:12px 28px;
          background:rgba(253,91,1,0.1); color:#fd5b01;
          border:1.5px solid rgba(253,91,1,0.35);
          border-radius:10px;
          font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
          cursor:pointer;
          transition:background 0.2s, opacity 0.2s;
          display:inline-flex; align-items:center; gap:8px;
        }
        .av-btn-secondary:hover:not(:disabled) { background:rgba(253,91,1,0.18); }
        .av-btn-secondary:disabled { opacity:0.4; cursor:not-allowed; }

        .av-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.2); border-top-color:#fff; border-radius:50%; animation:av-spin 0.7s linear infinite; }

        .av-success-msg {
          display:inline-flex; align-items:center; gap:6px;
          font-size:13px; color:#4ade80; font-weight:600;
          animation:av-fadeIn 0.3s ease;
        }
        @keyframes av-fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        .av-empty { text-align:center; padding:1.5rem 0; color:#555; font-size:13px; }

        .av-loading { display:flex; align-items:center; justify-content:center; padding:1.5rem 0; gap:10px; color:#555; font-size:13px; }
        .av-loading-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.1); border-top-color:#fd5b01; border-radius:50%; animation:av-spin 0.7s linear infinite; }

        .av-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media (max-width:480px) { .av-grid2 { grid-template-columns:1fr; } }
      `}</style>

      <div className="av av-page">
        <div className="av-inner">
          <Link href={`/colaborador/${dbUser.id}/perfil`} className="av-back">
            ← Dashboard do prestador
          </Link>

          <h1 className="av-title">Minha Disponibilidade</h1>
          <p className="av-sub">Configure os horários em que você atende e crie bloqueios para períodos indisponíveis.</p>

          {/* ── SEÇÃO 1: DISPONIBILIDADE SEMANAL ── */}
          <div className="av-card">
            <div className="av-section-label">Disponibilidade Semanal</div>

            {availLoading ? (
              <div className="av-loading">
                <div className="av-loading-spinner" />
                Carregando disponibilidade...
              </div>
            ) : (
              <>
                {WEEKDAYS.map(day => (
                  <DayRow
                    key={day.value}
                    day={day}
                    schedule={schedule[day.value]}
                    onChange={updateDay}
                    error={scheduleErrors[day.value]}
                  />
                ))}

                {setAvailability.error && (
                  <p style={{ fontSize: 12, color: "#f87171", marginTop: 12, fontFamily: "'Sora',sans-serif" }}>
                    ⚠️ {setAvailability.error.message}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "1.5rem", flexWrap: "wrap" }}>
                  <button
                    className="av-btn-primary"
                    onClick={handleSave}
                    disabled={setAvailability.isPending}
                  >
                    {setAvailability.isPending
                      ? <><div className="av-spinner" /> Salvando...</>
                      : "Salvar Disponibilidade"
                    }
                  </button>

                  {saveSuccess && (
                    <span className="av-success-msg">✅ Disponibilidade salva!</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── SEÇÃO 2: BLOQUEIOS ── */}
          <div className="av-card">
            <div className="av-section-label">Bloqueios</div>
            <p style={{ fontSize: 13, color: "#666", marginBottom: "1.25rem", lineHeight: 1.6, fontFamily: "'Sora',sans-serif" }}>
              Bloqueie períodos em que você não estará disponível para atendimentos (férias, compromissos, etc).
            </p>

            {/* Lista de bloqueios existentes */}
            {blocksLoading ? (
              <div className="av-loading">
                <div className="av-loading-spinner" />
                Carregando bloqueios...
              </div>
            ) : blockList.length === 0 ? (
              <div className="av-empty">Nenhum bloqueio cadastrado.</div>
            ) : (
              blockList.map(b => <BlockItem key={b.id} block={b} />)
            )}

            {/* Divisor */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "1.5rem 0" }} />

            {/* Formulário de novo bloqueio */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "#aaa", marginBottom: "1rem", fontFamily: "'Sora',sans-serif" }}>
              Criar novo bloqueio
            </p>

            <div className="av-grid2">
              <div className="av-field">
                <label className="av-label">Início</label>
                <input
                  type="datetime-local"
                  className={`av-datetime-input${blockErrors.start ? " error" : ""}`}
                  value={newStart}
                  min={minDatetime}
                  onChange={e => { setNewStart(e.target.value); setBlockErrors(p => ({ ...p, start: "" })); setBlockSuccess(false); }}
                />
                {blockErrors.start && <span className="av-field-err">{blockErrors.start}</span>}
              </div>

              <div className="av-field">
                <label className="av-label">Fim</label>
                <input
                  type="datetime-local"
                  className={`av-datetime-input${blockErrors.end ? " error" : ""}`}
                  value={newEnd}
                  min={newStart || minDatetime}
                  onChange={e => { setNewEnd(e.target.value); setBlockErrors(p => ({ ...p, end: "" })); setBlockSuccess(false); }}
                />
                {blockErrors.end && <span className="av-field-err">{blockErrors.end}</span>}
              </div>
            </div>

            <div className="av-field">
              <label className="av-label">Motivo</label>
              <input
                type="text"
                placeholder="Ex: Férias, compromisso pessoal..."
                className={`av-text-input${blockErrors.reason ? " error" : ""}`}
                value={newReason}
                maxLength={120}
                onChange={e => { setNewReason(e.target.value); setBlockErrors(p => ({ ...p, reason: "" })); setBlockSuccess(false); }}
              />
              {blockErrors.reason && <span className="av-field-err">{blockErrors.reason}</span>}
            </div>

            {createBlock.error && (
              <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>
                ⚠️ {createBlock.error.message}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                className="av-btn-secondary"
                onClick={handleCreateBlock}
                disabled={createBlock.isPending}
              >
                {createBlock.isPending
                  ? <><div className="av-spinner" style={{ borderTopColor: "#fd5b01", borderColor: "rgba(253,91,1,0.2)" }} /> Criando...</>
                  : "Criar Bloqueio"
                }
              </button>

              {blockSuccess && (
                <span className="av-success-msg">✅ Bloqueio criado!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
