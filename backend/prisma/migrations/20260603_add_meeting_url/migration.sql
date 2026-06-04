-- Migration: add meeting_url to appointments
-- Gerada em: 2026-06-03
-- Aplicar com: npx prisma migrate dev --name add_meeting_url
-- OU diretamente no banco:

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS meeting_url TEXT;
