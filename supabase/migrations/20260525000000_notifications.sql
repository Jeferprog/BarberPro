-- Notifications table (in-app notification center)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_client ON public.notifications(client_id, read, created_at DESC);

-- Push subscriptions (Web Push API)
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_push_subs_client ON public.push_subscriptions(client_id);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "public write notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public read push_subs" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "public write push_subs" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for instant notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
