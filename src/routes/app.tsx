import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Phone, Calendar, Clock, ChevronRight, ArrowLeft, X, Scissors, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { getBarbershopId, formatBRL } from "@/lib/barbershop";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "BarberPro — Cliente" },
      { name: "description", content: "Agende seu horário na barbearia." },
    ],
  }),
  component: ClientApp,
});

type Screen = "login" | "home" | "booking" | "appointments";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number };
type Barber  = { id: string; name: string; photo_url: string | null };
type Appointment = {
  id: string;
  starts_at: string;
  status: string;
  services: { name: string; price_cents: number } | null;
  barbers:  { name: string } | null;
};

function ClientApp() {
  const [screen, setScreen]     = useState<Screen>("login");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");

  return (
    <MobileShell>
      {screen === "login" && (
        <Login
          onLogin={(id, name) => { setClientId(id); setClientName(name); setScreen("home"); }}
        />
      )}
      {screen === "home" && (
        <Home
          name={clientName}
          clientId={clientId!}
          onBook={() => setScreen("booking")}
          onAppointments={() => setScreen("appointments")}
        />
      )}
      {screen === "booking" && (
        <Booking
          clientId={clientId!}
          onBack={() => setScreen("home")}
          onDone={() => setScreen("appointments")}
        />
      )}
      {screen === "appointments" && (
        <MyAppointments clientId={clientId!} onBack={() => setScreen("home")} />
      )}
    </MobileShell>
  );
}

/* ---------------- LOGIN ---------------- */
function Login({ onLogin }: { onLogin: (id: string, name: string) => void }) {
  const [phone, setPhone] = useState("");
  const [name,  setName]  = useState("");
  const [loading, setLoading] = useState(false);
  const [needName, setNeedName] = useState(false);

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    return v;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) { toast.error("Telefone inválido"); return; }
    if (needName && !name.trim()) { toast.error("Informe seu nome"); return; }
    if (loading) return;
    
    setLoading(true);
    try {
      const shopId = await getBarbershopId();
      // Busca cliente existente
      const { data: existing } = await supabase
        .from("clients")
        .select("id, name")
        .eq("phone", cleaned)
        .maybeSingle();

      if (existing) {
        toast.success(`Bem-vindo de volta, ${existing.name}!`);
        onLogin(existing.id, existing.name);
        return;
      }
      // Novo cliente — precisa de nome
      if (!needName) { setNeedName(true); setLoading(false); return; }
      const { data: created, error } = await supabase
        .from("clients")
        .insert({ phone: cleaned, name: name.trim() })
        .select("id, name")
        .single();
      if (error) throw error;
      toast.success(`Bem-vindo, ${created.name}!`);
      onLogin(created.id, created.name);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <Link to="/" className="text-muted-foreground text-sm flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          <Scissors className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold">Bem-vindo</h1>
        <p className="text-muted-foreground mt-2">Entre com seu telefone para continuar</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div className="mt-6">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Telefone</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="mt-2 w-full bg-white text-black h-14 px-4 rounded-xl border-2 border-primary/20 focus:border-primary outline-none"
            />
          </div>

          {needName && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Seu nome</label>
              <div className="mt-2 flex items-center gap-3 bg-card rounded-2xl px-4 py-4 border border-border">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como você se chama?"
                  className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {needName ? "Criar conta" : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function Home({ name, clientId, onBook, onAppointments }: {
  name: string; clientId: string;
  onBook: () => void; onAppointments: () => void;
}) {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, starts_at, status, services(name, price_cents), barbers(name)")
        .eq("client_id", clientId)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(2);
      if (data) setUpcoming(data as unknown as Appointment[]);
    })();
  }, [clientId]);

  return (
    <div className="px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h1 className="text-2xl font-bold">{name} 👋</h1>
        </div>
        <Link to="/" className="h-10 w-10 rounded-full bg-card flex items-center justify-center text-muted-foreground">✕</Link>
      </div>

      <button
        onClick={onBook}
        className="mt-8 w-full p-6 rounded-3xl text-left text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
      >
        <Scissors className="absolute -right-4 -bottom-4 h-28 w-28 opacity-20" />
        <div className="text-sm opacity-80">Pronto para um novo visual?</div>
        <div className="text-2xl font-bold mt-1">Agendar Agora</div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
          Começar <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Próximos Agendamentos</h2>
          <button onClick={onAppointments} className="text-xs text-primary">Ver todos</button>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground text-sm">
            Nenhum agendamento futuro.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- APPOINTMENT CARD ---------------- */
function AppointmentCard({ appt, onCancel }: { appt: Appointment; onCancel?: () => void }) {
  const dt = new Date(appt.starts_at);
  const dateStr = dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-primary font-medium uppercase tracking-wider">{dateStr}</div>
          <div className="font-semibold mt-1">{appt.services?.name ?? "—"}</div>
          <div className="text-sm text-muted-foreground mt-0.5">com {appt.barbers?.name ?? "—"}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary font-semibold">
            <Clock className="h-4 w-4" /> {timeStr}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {appt.services ? formatBRL(appt.services.price_cents) : "—"}
          </div>
        </div>
      </div>
      {onCancel && appt.status === "scheduled" && (
        <button
          onClick={onCancel}
          className="mt-4 w-full py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-1"
        >
          <X className="h-4 w-4" /> Cancelar agendamento
        </button>
      )}
      {appt.status === "cancelled" && (
        <div className="mt-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">Cancelado</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- BOOKING ---------------- */
function Booking({ clientId, onBack, onDone }: { clientId: string; onBack: () => void; onDone: () => void }) {
  const [step, setStep]           = useState(1);
  const [service, setService]     = useState<Service | null>(null);
  const [barber, setBarber]       = useState<Barber | null>(null);
  const [date, setDate]           = useState<string>("");
  const [slot, setSlot]           = useState<string | null>(null);
  const [services, setServices]   = useState<Service[]>([]);
  const [barbers, setBarbers]     = useState<Barber[]>([]);
  const [slots, setSlots]         = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [shopId, setShopId]       = useState<string | null>(null);

  // Gera próximos 7 dias
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    getBarbershopId().then(setShopId);
  }, []);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, duration_minutes, price_cents")
        .eq("barbershop_id", shopId)
        .eq("active", true)
        .order("name");
      if (data) setServices(data as Service[]);
    })();
  }, [shopId]);

  useEffect(() => {
    if (!shopId || !service) return;
    (async () => {
      const { data } = await supabase
        .from("barbers")
        .select("id, name, photo_url")
        .eq("barbershop_id", shopId)
        .eq("active", true)
        .order("name");
      if (data) setBarbers(data as Barber[]);
    })();
  }, [shopId, service]);

  useEffect(() => {
    if (!barber || !date || !service) return;
    setLoading(true);
    setSlots([]);
    setSlot(null);
    (async () => {
      const { data, error } = await supabase
        .rpc("get_available_slots", {
          p_barber_id: barber.id,
          p_date: date,
          p_duration: service.duration_minutes,
        });
      if (!error && data) setSlots(data.map((r: { slot_time: string }) => r.slot_time.slice(0, 5)));
      setLoading(false);
    })();
  }, [barber, date, service]);

  const confirm = async () => {
    if (!service || !barber || !date || !slot || !shopId) return;
    setSaving(true);
    try {
      const starts = new Date(`${date}T${slot}:00`);
      const ends   = new Date(starts.getTime() + service.duration_minutes * 60000);
      const { error } = await supabase.from("appointments").insert({
        barbershop_id: shopId,
        barber_id:     barber.id,
        service_id:    service.id,
        client_id:     clientId,
        starts_at:     starts.toISOString(),
        ends_at:       ends.toISOString(),
        status:        "scheduled",
      });
      if (error) throw error;
      toast.success("Agendamento confirmado!");
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep((s) => s + 1);
  const canContinue = (step === 1 && !!service) || (step === 2 && !!barber) || (step === 3 && !!slot);

  return (
    <div className="px-6 py-8 pb-24">
      <div className="flex items-center gap-3">
        <button
          onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}
          className="h-10 w-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs text-muted-foreground">Passo {step} de 3</div>
          <div className="font-semibold">
            {step === 1 ? "Escolha o serviço" : step === 2 ? "Escolha o barbeiro" : "Escolha o horário"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-card"}`} />
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {step === 1 && services.map((s) => (
          <button
            key={s.id}
            onClick={() => setService(s)}
            className={`w-full p-5 rounded-2xl bg-card text-left flex items-center justify-between transition-all ${service?.id === s.id ? "ring-2 ring-primary" : ""}`}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.duration_minutes} min</div>
            </div>
            <div className="text-primary font-semibold">{formatBRL(s.price_cents)}</div>
          </button>
        ))}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {barbers.map((b) => (
              <button
                key={b.id}
                onClick={() => setBarber(b)}
                className={`p-4 rounded-2xl bg-card text-center transition-all ${barber?.id === b.id ? "ring-2 ring-primary" : ""}`}
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {b.photo_url ? (
                  <img src={b.photo_url} alt={b.name} className="h-20 w-20 rounded-full mx-auto object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-full mx-auto bg-card-elevated flex items-center justify-center text-2xl font-bold text-primary">
                    {b.name[0]}
                  </div>
                )}
                <div className="font-medium mt-3 text-sm">{b.name}</div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
              {dates.map((d) => {
                const label = new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
                return (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`px-4 py-2.5 rounded-xl whitespace-nowrap text-sm flex-shrink-0 ${date === d ? "bg-primary text-primary-foreground font-semibold" : "bg-card text-muted-foreground"}`}
                  >
                    <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {!date && (
              <p className="text-center text-muted-foreground text-sm mt-4">Selecione uma data</p>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!loading && date && slots.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-4">Nenhum horário disponível neste dia</p>
            )}

            {!loading && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSlot(t)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${slot === t ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <button
        disabled={!canContinue || saving}
        onClick={step === 3 ? confirm : next}
        className="fixed bottom-6 left-6 right-6 max-w-[382px] mx-auto py-4 rounded-2xl font-semibold text-primary-foreground disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {step === 3 ? "Confirmar Agendamento" : "Continuar"}
      </button>
    </div>
  );
}

/* ---------------- MY APPOINTMENTS ---------------- */
function MyAppointments({ clientId, onBack }: { clientId: string; onBack: () => void }) {
  const [items, setItems] = useState<Appointment[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("id, starts_at, status, services(name, price_cents), barbers(name)")
      .eq("client_id", clientId)
      .order("starts_at", { ascending: false });
    if (data) setItems(data as unknown as Appointment[]);
  };

  useEffect(() => { load(); }, [clientId]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast.error("Erro ao cancelar"); return; }
    toast.success("Agendamento cancelado");
    setItems((arr) => arr?.map((a) => a.id === id ? { ...a, status: "cancelled" } : a) ?? null);
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Meus Agendamentos</h1>
      </div>

      <div className="mt-8 space-y-3">
        {!items && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {items?.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">Nenhum agendamento encontrado</div>
        )}
        {items?.map((a) => (
          <AppointmentCard
            key={a.id}
            appt={a}
            onCancel={a.status === "scheduled" ? () => cancel(a.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
