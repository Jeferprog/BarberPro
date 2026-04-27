
-- Status enum for appointments
CREATE TYPE public.appointment_status AS ENUM ('scheduled','arrived','completed','no_show','cancelled');

CREATE TABLE public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_barbers_shop ON public.barbers(barbershop_id);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_shop ON public.services(barbershop_id);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_shop ON public.clients(barbershop_id);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_shop_date ON public.appointments(barbershop_id, scheduled_at);

-- Enable RLS
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- TEMPORARY permissive policies (no auth yet — pre-launch prototype)
CREATE POLICY "public read barbershops"    ON public.barbershops    FOR SELECT USING (true);
CREATE POLICY "public write barbershops"   ON public.barbershops    FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read barbers"        ON public.barbers        FOR SELECT USING (true);
CREATE POLICY "public write barbers"       ON public.barbers        FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read services"       ON public.services       FOR SELECT USING (true);
CREATE POLICY "public write services"      ON public.services       FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read clients"        ON public.clients        FOR SELECT USING (true);
CREATE POLICY "public write clients"       ON public.clients        FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read appointments"   ON public.appointments   FOR SELECT USING (true);
CREATE POLICY "public write appointments"  ON public.appointments   FOR ALL    USING (true) WITH CHECK (true);

-- Storage bucket for barber photos
INSERT INTO storage.buckets (id, name, public) VALUES ('barber-photos','barber-photos',true);

CREATE POLICY "public read barber photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barber-photos');

CREATE POLICY "public upload barber photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'barber-photos');

CREATE POLICY "public update barber photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'barber-photos');

CREATE POLICY "public delete barber photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'barber-photos');
