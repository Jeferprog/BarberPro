import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get all barbershops with their reminder settings
    const { data: shops } = await supabase
      .from("barbershop_settings")
      .select("barbershop_id, reminder_hours");

    if (!shops || shops.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No shops configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;

    for (const shop of shops) {
      if (!shop.reminder_hours || shop.reminder_hours <= 0) continue;

      // 2. Find appointments within the reminder window that haven't been reminded
      const now = new Date();
      const reminderCutoff = new Date(now.getTime() + shop.reminder_hours * 60 * 60 * 1000);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, starts_at, client_id, services(name), barbers(name)")
        .eq("barbershop_id", shop.barbershop_id)
        .eq("status", "scheduled")
        .eq("reminder_sent", false)
        .gte("starts_at", now.toISOString())
        .lte("starts_at", reminderCutoff.toISOString());

      if (!appointments || appointments.length === 0) continue;

      // 3. Create notifications and mark as reminded
      for (const appt of appointments) {
        const startsAt = new Date(appt.starts_at);
        const timeStr = startsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        const dateStr = startsAt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
        const serviceName = (appt.services as any)?.name ?? "servico";
        const barberName = (appt.barbers as any)?.name ?? "barbeiro";

        // Insert in-app notification
        await supabase.from("notifications").insert({
          client_id: appt.client_id,
          barbershop_id: shop.barbershop_id,
          title: "Lembrete de agendamento",
          body: `Voce tem ${serviceName} com ${barberName} hoje as ${timeStr} (${dateStr}). Ate la!`,
          type: "reminder",
          data: { appointment_id: appt.id },
        });

        // Send push notification
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("client_id", appt.client_id);

        if (subs && subs.length > 0) {
          try {
            await supabase.functions.invoke("send-push", {
              body: {
                subscriptions: subs,
                title: "Lembrete de agendamento",
                body: `${serviceName} com ${barberName} hoje as ${timeStr}. Ate la!`,
                data: { type: "reminder", appointment_id: appt.id },
              },
            });
          } catch { /* push is best-effort */ }
        }

        // Mark as reminded
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appt.id);

        totalSent++;
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
