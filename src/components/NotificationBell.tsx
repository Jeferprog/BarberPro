import { useState, useEffect, useCallback } from "react";
import { Bell, X, Check, CheckCheck, Calendar, AlertTriangle, Megaphone, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppNotification, NotificationType } from "@/lib/push";

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  reminder: { icon: Calendar, color: "text-primary" },
  status_change: { icon: Info, color: "text-blue-400" },
  announcement: { icon: Megaphone, color: "text-primary" },
  penalty: { icon: AlertTriangle, color: "text-warning" },
  general: { icon: Bell, color: "text-muted-foreground" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data as AppNotification[]);
      setUnread(data.filter((n) => !n.read).length);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          setNotifications((prev) => [n, ...prev]);
          setUnread((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((arr) => arr.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-10 w-10 rounded-full bg-card flex items-center justify-center text-muted-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] bg-background rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col"
            style={{ boxShadow: "var(--shadow-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-bold">Notificacoes</h2>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-card transition"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Ler todas
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-full bg-card flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Nenhuma notificacao</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} onRead={() => markAsRead(n.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: () => void }) {
  const config = TYPE_CONFIG[notification.type as NotificationType] ?? TYPE_CONFIG.general;
  const Icon = config.icon;

  return (
    <button
      onClick={() => {
        if (!notification.read) onRead();
      }}
      className={`w-full text-left px-6 py-4 flex items-start gap-4 transition-colors ${
        notification.read ? "opacity-60" : "bg-card/50"
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-card ${config.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate">{notification.title}</p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
            {timeAgo(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
      </div>
      {!notification.read && <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
    </button>
  );
}
