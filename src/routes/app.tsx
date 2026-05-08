import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, Clock, ChevronRight, ArrowLeft, X, Scissors, Loader2, AlertTriangle } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { getBarbershopId, formatBRL } from "@/lib/barbershop";
import { toast } from "sonner";
import { InstallPWA } from "@/components/InstallPWA";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "BarberPro — Cliente" },
      { name: "description", content: "Agende seu horario na barbearia." },
    ],
  }),
  component: ClientApp,
});

type Screen = "login" | "home" | "booking" | "appointments";
type Service = { id: string; name: string; duration_minutes: number; price_cents: number };
type Barber  = { id: string; name: string; photo_url: string | null };
type Appointment = {
  id: string; starts_at: string; status: string;
  photo_url?: string | null; has_penalty?: boolean;
  services: { name: string; price_cents: number } | null;
  barbers: { name: string } | null;
};

const CLIENT_SESSION_MS = 2 * 60 * 60 * 1000;

function getClientSession(): { id: string; name: string } | null {
  try {
    const expiry = localStorage.getItem("client_auth_expiry");
    const id = localStorage.getItem("client_id");
    const name = localStorage.getItem("client_name");
    if (!expiry || !id || !name) return null;
    if (Date.now() > Number(expiry)) return null;
    return { id, name };
  } catch { return null; }
}

function saveClientSession(id: string, name: string) {
  localStorage.setItem("client_id", id);
  localStorage.setItem("client_name", name);
  localStorage.setItem("client_auth_expiry", String(Date.now() + CLIENT_SESSION_MS));
}

function ClientApp() {
  const [screen, setScreen] = useState<Screen>(() => getClientSession() ? "home" : "login");
  const [clientId, setClientId] = useState<string | null>(() => getClientSession()?.id ?? null);
  const [clientName, setClientName] = useState(() => getClientSession()?.name ?? "");
  return (
    <>
      <MobileShell>
        {screen === "login" && <Login onLogin={(id, name) => { saveClientSession(id, name); setClientId(id); setClientName(name); setScreen("home"); }} />}
        {screen === "home" && <Home name={clientName} clientId={clientId!} onBook={() => setScreen("booking")} onAppointments={() => setScreen("appointments")} />}
        {screen === "booking" && <Booking clientId={clientId!} onBack={() => setScreen("home")} onDone={() => setScreen("appointments")} />}
        {screen === "appointments" && <MyAppointments clientId={clientId!} onBack={() => setScreen("home")} />}
      </MobileShell>
      <InstallPWA />
    </>
  );
}

/* ---------------- LOGIN ---------------- */
function Login({ onLogin }: { onLogin: (id: string, name: string) => void }) {
  const phoneRef = useRef<HTMLInputElement>(null);
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needName, setNeedName] = useState(false);

  const formatPhone = useCallback((v: string) => {
    const n = v.replace(/\D/g, "");
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
    if (n.length <= 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`;
  }, []);

  const handlePhoneInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prevLen = input.value.length;
    const formatted = formatPhone(input.value);
    setPhoneDisplay(formatted);
    requestAnimationFrame(() => { if (input && formatted.length >= prevLen) input.setSelectionRange(formatted.length, formatted.length); });
  }, [formatPhone]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = phoneDisplay.replace(/\D/g, "");
    if (cleaned.length < 10) { toast.error("Telefone invalido. Informe o DDD e o numero."); return; }
    if (loading) return;
    if (!needName) { setNeedName(true); return; }
    if (!name.trim()) { toast.error("Por favor, informe seu nome para continuar."); return; }
    setLoading(true);
    try {
      const { data: existing } = await supabase.from("clients").select("id, name").eq("phone", cleaned).maybeSingle();
      if (existing) {
        const inf = name.trim().toLowerCase(); const cad = existing.name.toLowerCase();
        if (!cad.includes(inf) && !inf.includes(cad)) { toast.error("Nome nao confere com o cadastro."); setLoading(false); return; }
        toast.success(`Bem-vindo de volta, ${existing.name}!`);
        onLogin(existing.id, existing.name); return;
      }
      const { data: created, error: insertError } = await supabase.from("clients").insert({ phone: cleaned, name: name.trim() }).select("id, name").single();
      if (insertError) throw insertError;
      toast.success(`Bem-vindo, ${created.name}!`);
      onLogin(created.id, created.name);
    } catch (e: any) { toast.error(e.message || "Erro ao tentar entrar"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col px-6 py-8" style={{ minHeight: "100%" }}>
      <Link to="/" className="text-muted-foreground text-sm flex items-center gap-1" style={{ touchAction: "manipulation" }}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8">
        <div className="h-20 w-20 rounded-3xl flex items-center justify-center mb-8 mx-auto" style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)", transform: "rotate(-5deg)" }}>
          <Scissors className="h-10 w-10 text-primary-foreground" />
        </div>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">BarberPro</h1>
          <p className="text-muted-foreground mt-3 text-lg">{needName ? "So mais um passo..." : "Agende seu estilo em segundos"}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="phone-input" className="text-xs text-muted-foreground uppercase tracking-widest font-bold ml-1">Telefone</label>
            <input id="phone-input" ref={phoneRef} type="tel" inputMode="numeric" autoComplete="tel" value={phoneDisplay} onChange={handlePhoneInput} placeholder="(00) 00000-0000" disabled={loading} style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }} className="w-full bg-card text-foreground h-16 px-6 rounded-2xl border-2 border-border focus:border-primary outline-none text-lg font-medium placeholder:text-muted-foreground/30" />
          </div>
          {needName && (
            <div className="space-y-2">
              <label htmlFor="name-input" className="text-xs text-muted-foreground uppercase tracking-widest font-bold ml-1">Seu Nome (como cadastrado)</label>
              <input id="name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" disabled={loading} autoFocus style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }} className="w-full bg-card text-foreground h-16 px-6 rounded-2xl border-2 border-border focus:border-primary outline-none text-lg font-medium placeholder:text-muted-foreground/30" />
            </div>
          )}
          <button type="submit" disabled={loading || (phoneDisplay.replace(/\D/g, "").length < 10)} className="w-full py-5 rounded-2xl font-bold text-lg text-primary-foreground flex items-center justify-center gap-3 disabled:opacity-40 active:scale-[0.97] transition-all mt-4" style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>{needName ? "Concluir Cadastro" : "Entrar Agora"}<ChevronRight className="h-5 w-5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function Home({ name, clientId, onBook, onAppointments }: { name: string; clientId: string; onBook: () => void; onAppointments: () => void }) {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("appointments").select("id, starts_at, status, services(name, price_cents), barbers(name)").eq("client_id", clientId).eq("status", "scheduled").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(2);
      if (data) setUpcoming(data as unknown as Appointment[]);
    })();
  }, [clientId]);
  return (
    <div className="px-6 py-10">
      <div className="flex items-center justify-between">
        <div><p className="text-muted-foreground text-sm">Ola,</p><h1 className="text-2xl font-bold">{name}</h1></div>
        <Link to="/" className="h-10 w-10 rounded-full bg-card flex items-center justify-center text-muted-foreground">X</Link>
      </div>
      <button onClick={onBook} className="mt-8 w-full p-6 rounded-3xl text-left text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}>
        <Scissors className="absolute -right-4 -bottom-4 h-28 w-28 opacity-20" />
        <div className="text-sm opacity-80">Pronto para um novo visual?</div>
        <div className="text-2xl font-bold mt-1">Agendar Agora</div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">Comecar <ChevronRight className="h-4 w-4" /></div>
      </button>
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Proximos Agendamentos</h2>
          <button onClick={onAppointments} className="text-xs text-primary">Ver todos</button>
        </div>
        {upcoming.length === 0 ? <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground text-sm">Nenhum agendamento futuro.</div> : <div className="space-y-3">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}</div>}
      </div>
    </div>
  );
}

/* ---------------- APPOINTMENT CARD ---------------- */
function AppointmentCard({ appt, onCancel, showPhoto }: { appt: Appointment; onCancel?: () => void; showPhoto?: boolean }) {
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
          <div className="flex items-center gap-1 text-primary font-semibold"><Clock className="h-4 w-4" /> {timeStr}</div>
          <div className="text-xs text-muted-foreground mt-1">{appt.services ? formatBRL(appt.services.price_cents) : "—"}</div>
        </div>
      </div>
      {onCancel && appt.status === "scheduled" && (
        <button onClick={onCancel} className="mt-4 w-full py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-1">
          <X className="h-4 w-4" /> Cancelar agendamento
        </button>
      )}
      {appt.status === "cancelled" && <div className="mt-3"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">Cancelado</span></div>}
      {showPhoto && appt.photo_url && <div className="mt-4"><img src={appt.photo_url} alt="Foto do corte" className="w-full rounded-2xl object-cover max-h-64" /></div>}
    </div>
  );
}

/* ---------------- BOOKING ---------------- */
function Booking({ clientId, onBack, onDone }: { clientId: string; onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState<string>("");
  const [slot, setSlot] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [pendingPenalty, setPendingPenalty] = useState(0);

  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split("T")[0]; });

  useEffect(() => { getBarbershopId().then(setShopId); }, []);

  // Busca multas pendentes do cliente ao abrir o booking
  useEffect(() => {
    if (!shopId || !clientId) return;
    (async () => {
      const { data } = await supabase.from("client_penalties").select("amount_cents").eq("client_id", clientId).eq("barbershop_id", shopId).eq("status", "pending");
      if (data) setPendingPenalty(data.reduce((s, p) => s + p.amount_cents, 0));
    })();
  }, [shopId, clientId]);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const { data } = await supabase.from("services").select("id, name, duration_minutes, price_cents").eq("barbershop_id", shopId).eq("active", true).order("name");
      if (data) setServices(data as Service[]);
    })();
  }, [shopId]);

  useEffect(() => {
    if (!shopId || !service) return;
    (async () => {
      const { data } = await supabase.from("barbers").select("id, name, photo_url").eq("barbershop_id", shopId).eq("active", true).order("name");
      if (data) setBarbers(data as Barber[]);
    })();
  }, [shopId, service]);

  useEffect(() => {
    if (!barber || !date || !service) return;
    setLoading(true); setSlots([]); setSlot(null);
    (async () => {
      const { data, error } = await supabase.rpc("get_available_slots", { p_barber_id: barber.id, p_date: date, p_duration: service.duration_minutes });
      if (!error && data) setSlots(data.map((r: { slot_time: string }) => r.slot_time.slice(0, 5)));
      setLoading(false);
    })();
  }, [barber, date, service]);

  const confirm = async () => {
    if (!service || !barber || !date || !slot || !shopId) return;
    setSaving(true);
    try {
      const starts = new Date(`${date}T${slot}:00`);
      const ends = new Date(starts.getTime() + service.duration_minutes * 60000);
      const { error } = await supabase.from("appointments").insert({ barbershop_id: shopId, barber_id: barber.id, service_id: service.id, client_id: clientId, starts_at: starts.toISOString(), ends_at: ends.toISOString(), status: "scheduled" });
      if (error) throw error;
      toast.success("Agendamento confirmado!");
      onDone();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao agendar"); }
    finally { setSaving(false); }
  };

  const next = () => setStep((s) => s + 1);
  const canContinue = (step === 1 && !!service) || (step === 2 && !!barber) || (step === 3 && !!slot);
  const isLastStep = step === 3;
  const serviceCents = service?.price_cents ?? 0;
  const totalCents = serviceCents + pendingPenalty;

  return (
    <div className="px-6 py-8 pb-36">
      <div className="flex items-center gap-3">
        <button onClick={step === 1 ? onBack : () => setStep((s) => s - 1)} className="h-10 w-10 rounded-full bg-card flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <div className="text-xs text-muted-foreground">Passo {step} de 3</div>
          <div className="font-semibold">{step === 1 ? "Escolha o servico" : step === 2 ? "Escolha o barbeiro" : "Escolha o horario"}</div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {[1,2,3].map((n) => <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-card"}`} />)}
      </div>

      <div className="mt-8 space-y-3">
        {step === 1 && services.map((s) => (
          <button key={s.id} onClick={() => setService(s)} className={`w-full p-5 rounded-2xl bg-card text-left flex items-center justify-between transition-all ${service?.id === s.id ? "ring-2 ring-primary" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
            <div><div className="font-semibold">{s.name}</div><div className="text-xs text-muted-foreground mt-1">{s.duration_minutes} min</div></div>
            <div className="text-primary font-semibold">{formatBRL(s.price_cents)}</div>
          </button>
        ))}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {barbers.map((b) => (
              <button key={b.id} onClick={() => setBarber(b)} className={`p-4 rounded-2xl bg-card text-center transition-all ${barber?.id === b.id ? "ring-2 ring-primary" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
                {b.photo_url ? <img src={b.photo_url} alt={b.name} className="h-20 w-20 rounded-full mx-auto object-cover" /> : <div className="h-20 w-20 rounded-full mx-auto bg-card-elevated flex items-center justify-center text-2xl font-bold text-primary">{b.name[0]}</div>}
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
                  <button key={d} onClick={() => setDate(d)} className={`px-4 py-2.5 rounded-xl whitespace-nowrap text-sm flex-shrink-0 ${date === d ? "bg-primary text-primary-foreground font-semibold" : "bg-card text-muted-foreground"}`}>
                    <Calendar className="h-3.5 w-3.5 inline mr-1.5" />{label}
                  </button>
                );
              })}
            </div>
            {!date && <p className="text-center text-muted-foreground text-sm mt-4">Selecione uma data</p>}
            {loading && <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loading && date && slots.length === 0 && <p className="text-center text-muted-foreground text-sm mt-4">Nenhum horario disponivel neste dia</p>}
            {!loading && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                {slots.map((t) => (
                  <button key={t} onClick={() => setSlot(t)} className={`py-3 rounded-xl text-sm font-medium transition-all ${slot === t ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>{t}</button>
                ))}
              </div>
            )}

            {/* Resumo de pagamento com penalidade */}
            {slot && pendingPenalty > 0 && (
              <div className="mt-4 bg-card rounded-2xl p-4 space-y-2" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-sm font-semibold">Resumo do pagamento</p>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{service?.name}</span><span>{formatBRL(serviceCents)}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-warning flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Multa pendente</span>
                  <span className="text-warning">{formatBRL(pendingPenalty)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total a pagar</span><span className="text-primary">{formatBRL(totalCents)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">A multa sera cobrada pelo barbeiro no dia do atendimento.</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6 max-w-[382px] mx-auto space-y-2">
        <button disabled={!canContinue || saving} onClick={isLastStep ? confirm : next}
          className="w-full py-4 rounded-2xl font-semibold text-primary-foreground disabled:opacity-40 transition-all flex items-center justify-center gap-3"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLastStep ? (pendingPenalty > 0 ? `Confirmar — ${formatBRL(totalCents)}` : "Confirmar Agendamento") : "Continuar"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- MY APPOINTMENTS ---------------- */
function MyAppointments({ clientId, onBack }: { clientId: string; onBack: () => void }) {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{ id: string; starts_at: string } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("appointments").select("id, starts_at, status, photo_url, has_penalty, services(name, price_cents), barbers(name)").eq("client_id", clientId).order("starts_at", { ascending: false });
      if (data) {
        const all = data as unknown as Appointment[];
        setUpcoming(all.filter((a) => a.status === "scheduled" || a.status === "arrived"));
        setHistory(all.filter((a) => a.status === "completed"));
      }
      setLoading(false);
    })();
  }, [clientId]);

  const doCancel = async (id: string, hasPenalty: boolean) => {
    const shopId = await getBarbershopId();
    const appt = upcoming.find((a) => a.id === id);

    const { error } = await supabase.from("appointments").update({ status: "cancelled", has_penalty: hasPenalty }).eq("id", id);
    if (error) { toast.error("Erro ao cancelar"); return; }

    // Se tiver penalidade, registra na tabela client_penalties
    if (hasPenalty && shopId && appt) {
      const { data: settings } = await supabase.from("barbershop_settings").select("cancellation_fee_cents").eq("barbershop_id", shopId).maybeSingle();
      if (settings && settings.cancellation_fee_cents > 0) {
        await supabase.from("client_penalties").insert({ client_id: clientId, barbershop_id: shopId, source_appointment_id: id, amount_cents: settings.cancellation_fee_cents });
      }
    }

    toast.success(hasPenalty ? "Cancelado. Multa sera cobrada no proximo atendimento." : "Agendamento cancelado.");
    setUpcoming((arr) => arr.filter((a) => a.id !== id));
    setCancelModal(null);
  };

  return (
    <div className="px-6 py-8 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-card flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Meus Agendamentos</h1>
      </div>

      {loading && <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {!loading && (
        <>
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Proximos</h2>
            {upcoming.length === 0 ? (
              <div className="bg-card rounded-2xl p-5 text-center text-muted-foreground text-sm">Nenhum agendamento futuro</div>
            ) : (
              <div className="space-y-3">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} onCancel={() => setCancelModal({ id: a.id, starts_at: a.starts_at })} />)}</div>
            )}
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Historico</h2>
            {history.length === 0 ? (
              <div className="bg-card rounded-2xl p-5 text-center text-muted-foreground text-sm">Nenhum atendimento finalizado ainda</div>
            ) : (
              <div className="space-y-3">{history.map((a) => <AppointmentCard key={a.id} appt={a} showPhoto />)}</div>
            )}
          </div>
        </>
      )}

      {cancelModal && (
        <CancelModal startsAt={cancelModal.starts_at} onClose={() => setCancelModal(null)} onConfirm={(hasPenalty) => doCancel(cancelModal.id, hasPenalty)} />
      )}
    </div>
  );
}

/* ---------------- CANCEL MODAL ---------------- */
function CancelModal({ startsAt, onClose, onConfirm }: { startsAt: string; onClose: () => void; onConfirm: (hasPenalty: boolean) => void }) {
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [penalty, setPenalty] = useState(false);
  const [feeFormatted, setFeeFormatted] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const shopId = await getBarbershopId();
        const { data } = await supabase.from("barbershop_settings").select("cancellation_hours, cancellation_fee_cents").eq("barbershop_id", shopId).maybeSingle();
        if (data) {
          const hoursUntil = (new Date(startsAt).getTime() - Date.now()) / (1000 * 60 * 60);
          const hasPenalty = hoursUntil < data.cancellation_hours && data.cancellation_fee_cents > 0;
          setPenalty(hasPenalty);
          setFeeFormatted(formatBRL(data.cancellation_fee_cents));
        }
      } finally { setLoadingPolicy(false); }
    })();
  }, [startsAt]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-3xl p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0"><X className="h-5 w-5 text-destructive" /></div>
          <h2 className="text-lg font-bold">Cancelar Agendamento</h2>
        </div>

        {loadingPolicy ? (
          <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : penalty ? (
          <div className="bg-warning/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" /><p className="text-sm font-semibold text-warning">Cancelamento fora do prazo</p></div>
            <p className="text-sm text-muted-foreground">Este cancelamento esta dentro do prazo minimo. Uma multa de <span className="font-semibold text-foreground">{feeFormatted}</span> sera cobrada no seu proximo atendimento.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tem certeza que deseja cancelar este agendamento?</p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={onClose} className="py-3 rounded-xl bg-card-elevated text-muted-foreground font-medium">Voltar</button>
          <button onClick={() => onConfirm(penalty)} className="py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold">
            {penalty ? "Confirmar mesmo assim" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
