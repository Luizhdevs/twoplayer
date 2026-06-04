import { AppointmentStatus } from '@prisma/client';

/** Dias sem resposta do cliente até auto-liberação do escrow */
export const AUTO_RELEASE_DAYS = 7;

/** Mapeamento completo da máquina de estados do appointment */
export const STATE_TRANSITIONS: Record<
  string,
  { from: AppointmentStatus; to: AppointmentStatus; actor: 'PROVIDER' | 'CLIENT' | 'SYSTEM' }
> = {
  confirm: { from: 'PAID',                         to: 'CONFIRMED',                   actor: 'PROVIDER' },
  start:   { from: 'CONFIRMED',                    to: 'IN_PROGRESS',                 actor: 'PROVIDER' },
  finish:  { from: 'IN_PROGRESS',                  to: 'AWAITING_CLIENT_CONFIRMATION', actor: 'PROVIDER' },
  approve: { from: 'AWAITING_CLIENT_CONFIRMATION', to: 'COMPLETED',                   actor: 'CLIENT'   },
};

/** Ações de auditoria */
export const ACTIONS = {
  CONFIRM:      'PROVIDER_CONFIRM',
  START:        'PROVIDER_START',
  FINISH:       'PROVIDER_FINISH',
  APPROVE:      'CLIENT_APPROVE',
  AUTO_RELEASE: 'SYSTEM_AUTO_RELEASE',
  ESCROW_HELD:  'ESCROW_HELD',
  ESCROW_RELEASED: 'ESCROW_RELEASED',
} as const;
