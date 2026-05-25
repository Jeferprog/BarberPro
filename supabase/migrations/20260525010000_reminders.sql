-- Add reminder_hours setting (how many hours before appointment to notify)
ALTER TABLE public.barbershop_settings
  ADD COLUMN IF NOT EXISTS reminder_hours INT NOT NULL DEFAULT 2;

-- Track which appointments already got a reminder
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON public.appointments(starts_at, reminder_sent)
  WHERE status = 'scheduled' AND reminder_sent = false;
