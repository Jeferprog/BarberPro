-- Allow barbershops to customize their reminder message template
-- Placeholders: {servico}, {barbeiro}, {horario}, {data}, {barbearia}
ALTER TABLE public.barbershop_settings
  ADD COLUMN IF NOT EXISTS reminder_message TEXT NOT NULL DEFAULT 'Ola! Lembrete: voce tem {servico} com {barbeiro} agendado para {horario} ({data}). Te esperamos!';
