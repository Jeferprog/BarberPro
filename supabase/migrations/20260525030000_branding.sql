-- Branding columns for barbershop customization
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT NOT NULL DEFAULT '#C9A84C',
  ADD COLUMN IF NOT EXISTS text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS font_family TEXT NOT NULL DEFAULT 'Inter';

-- Storage bucket for barbershop logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('barbershop-logos', 'barbershop-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read barbershop logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barbershop-logos');

CREATE POLICY "public upload barbershop logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'barbershop-logos');

CREATE POLICY "public update barbershop logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'barbershop-logos');

CREATE POLICY "public delete barbershop logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'barbershop-logos');
