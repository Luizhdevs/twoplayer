-- Add EXPIRED value to AppointmentStatus enum
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Add expires_at column to appointments
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
