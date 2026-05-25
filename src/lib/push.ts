import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC_KEY;
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export async function subscribeToPush(clientId: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const permission = await getPushPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        client_id: clientId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" }
    );

    return !error;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }
  } catch {}
}

export type NotificationType = "reminder" | "status_change" | "announcement" | "penalty" | "general";

export type AppNotification = {
  id: string;
  client_id: string;
  barbershop_id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
};

export async function createNotification(params: {
  clientId: string;
  barbershopId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}): Promise<void> {
  await supabase.from("notifications").insert({
    client_id: params.clientId,
    barbershop_id: params.barbershopId,
    title: params.title,
    body: params.body,
    type: params.type,
    data: params.data ?? null,
  });

  try {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("client_id", params.clientId);

    if (subs && subs.length > 0) {
      await supabase.functions.invoke("send-push", {
        body: {
          subscriptions: subs,
          title: params.title,
          body: params.body,
          data: { type: params.type, ...params.data },
        },
      });
    }
  } catch {}
}

export async function createBulkNotification(params: {
  barbershopId: string;
  title: string;
  body: string;
  type: NotificationType;
}): Promise<number> {
  const { data: clients } = await supabase
    .from("clients")
    .select("id")
    .limit(500);

  if (!clients || clients.length === 0) return 0;

  const rows = clients.map((c) => ({
    client_id: c.id,
    barbershop_id: params.barbershopId,
    title: params.title,
    body: params.body,
    type: params.type,
  }));

  await supabase.from("notifications").insert(rows);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("client_id", clients.map((c) => c.id));

  if (subs && subs.length > 0) {
    try {
      await supabase.functions.invoke("send-push", {
        body: {
          subscriptions: subs,
          title: params.title,
          body: params.body,
          data: { type: params.type },
        },
      });
    } catch {}
  }

  return clients.length;
}
