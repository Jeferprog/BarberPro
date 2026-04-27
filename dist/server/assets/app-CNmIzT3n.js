import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Scissors, Phone, Loader2, ChevronRight, Calendar, Clock, X } from "lucide-react";
import { M as MobileShell } from "./MobileShell-CjviHgqT.js";
import { s as supabase, g as getBarbershopId, f as formatBRL } from "./barbershop-CNXjeCZp.js";
import { toast } from "sonner";
import "@supabase/supabase-js";
function ClientApp() {
  const [screen, setScreen] = useState("login");
  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState("");
  return /* @__PURE__ */ jsxs(MobileShell, { children: [
    screen === "login" && /* @__PURE__ */ jsx(Login, { onLogin: (id, name) => {
      setClientId(id);
      setClientName(name);
      setScreen("home");
    } }),
    screen === "home" && /* @__PURE__ */ jsx(Home, { name: clientName, clientId, onBook: () => setScreen("booking"), onAppointments: () => setScreen("appointments") }),
    screen === "booking" && /* @__PURE__ */ jsx(Booking, { clientId, onBack: () => setScreen("home"), onDone: () => setScreen("appointments") }),
    screen === "appointments" && /* @__PURE__ */ jsx(MyAppointments, { clientId, onBack: () => setScreen("home") })
  ] });
}
function Login({
  onLogin
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needName, setNeedName] = useState(false);
  const handleSubmit = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast.error("Telefone inválido");
      return;
    }
    if (needName && !name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setLoading(true);
    try {
      const shopId = await getBarbershopId();
      const {
        data: existing
      } = await supabase.from("clients").select("id, name").eq("phone", cleaned).maybeSingle();
      if (existing) {
        toast.success(`Bem-vindo de volta, ${existing.name}!`);
        onLogin(existing.id, existing.name);
        return;
      }
      if (!needName) {
        setNeedName(true);
        setLoading(false);
        return;
      }
      const {
        data: created,
        error
      } = await supabase.from("clients").insert({
        phone: cleaned,
        name: name.trim()
      }).select("id, name").single();
      if (error) throw error;
      toast.success(`Bem-vindo, ${created.name}!`);
      onLogin(created.id, created.name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen px-6 py-12", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "text-muted-foreground text-sm flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Voltar"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-center", children: [
      /* @__PURE__ */ jsx("div", { className: "h-16 w-16 rounded-2xl flex items-center justify-center mb-6", style: {
        background: "var(--gradient-gold)",
        boxShadow: "var(--shadow-gold)"
      }, children: /* @__PURE__ */ jsx(Scissors, { className: "h-8 w-8 text-primary-foreground" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Bem-vindo" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Entre com seu telefone para continuar" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-10 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: "Telefone" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-3 bg-card rounded-2xl px-4 py-4", children: [
            /* @__PURE__ */ jsx(Phone, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("input", { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "(11) 99999-9999", className: "bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground" })
          ] })
        ] }),
        needName && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: "Seu nome" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center gap-3 bg-card rounded-2xl px-4 py-4", children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Como você se chama?", className: "bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground" }) })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleSubmit, disabled: loading, className: "w-full py-4 rounded-2xl font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50", style: {
          background: "var(--gradient-gold)",
          boxShadow: "var(--shadow-gold)"
        }, children: [
          loading && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
          needName ? "Criar conta" : "Continuar"
        ] })
      ] })
    ] })
  ] });
}
function Home({
  name,
  clientId,
  onBook,
  onAppointments
}) {
  const [upcoming, setUpcoming] = useState([]);
  useEffect(() => {
    (async () => {
      const {
        data
      } = await supabase.from("appointments").select("id, starts_at, status, services(name, price_cents), barbers(name)").eq("client_id", clientId).eq("status", "scheduled").gte("starts_at", (/* @__PURE__ */ new Date()).toISOString()).order("starts_at", {
        ascending: true
      }).limit(2);
      if (data) setUpcoming(data);
    })();
  }, [clientId]);
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Olá," }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
          name,
          " 👋"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/", className: "h-10 w-10 rounded-full bg-card flex items-center justify-center text-muted-foreground", children: "✕" })
    ] }),
    /* @__PURE__ */ jsxs("button", { onClick: onBook, className: "mt-8 w-full p-6 rounded-3xl text-left text-primary-foreground relative overflow-hidden", style: {
      background: "var(--gradient-gold)",
      boxShadow: "var(--shadow-gold)"
    }, children: [
      /* @__PURE__ */ jsx(Scissors, { className: "absolute -right-4 -bottom-4 h-28 w-28 opacity-20" }),
      /* @__PURE__ */ jsx("div", { className: "text-sm opacity-80", children: "Pronto para um novo visual?" }),
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold mt-1", children: "Agendar Agora" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 inline-flex items-center gap-1 text-sm font-medium", children: [
        "Começar ",
        /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Próximos Agendamentos" }),
        /* @__PURE__ */ jsx("button", { onClick: onAppointments, className: "text-xs text-primary", children: "Ver todos" })
      ] }),
      upcoming.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-card rounded-2xl p-6 text-center text-muted-foreground text-sm", children: "Nenhum agendamento futuro." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: upcoming.map((a) => /* @__PURE__ */ jsx(AppointmentCard, { appt: a }, a.id)) })
    ] })
  ] });
}
function AppointmentCard({
  appt,
  onCancel
}) {
  const dt = new Date(appt.starts_at);
  const dateStr = dt.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
  const timeStr = dt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-5", style: {
    boxShadow: "var(--shadow-card)"
  }, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-primary font-medium uppercase tracking-wider", children: dateStr }),
        /* @__PURE__ */ jsx("div", { className: "font-semibold mt-1", children: appt.services?.name ?? "—" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mt-0.5", children: [
          "com ",
          appt.barbers?.name ?? "—"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-primary font-semibold", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
          " ",
          timeStr
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: appt.services ? formatBRL(appt.services.price_cents) : "—" })
      ] })
    ] }),
    onCancel && appt.status === "scheduled" && /* @__PURE__ */ jsxs("button", { onClick: onCancel, className: "mt-4 w-full py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-1", children: [
      /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
      " Cancelar agendamento"
    ] }),
    appt.status === "cancelled" && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground", children: "Cancelado" }) })
  ] });
}
function Booking({
  clientId,
  onBack,
  onDone
}) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [barber, setBarber] = useState(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState(null);
  const dates = Array.from({
    length: 7
  }, (_, i) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  useEffect(() => {
    getBarbershopId().then(setShopId);
  }, []);
  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const {
        data
      } = await supabase.from("services").select("id, name, duration_minutes, price_cents").eq("barbershop_id", shopId).eq("active", true).order("name");
      if (data) setServices(data);
    })();
  }, [shopId]);
  useEffect(() => {
    if (!shopId || !service) return;
    (async () => {
      const {
        data
      } = await supabase.from("barbers").select("id, name, photo_url").eq("barbershop_id", shopId).eq("active", true).order("name");
      if (data) setBarbers(data);
    })();
  }, [shopId, service]);
  useEffect(() => {
    if (!barber || !date || !service) return;
    setLoading(true);
    setSlots([]);
    setSlot(null);
    (async () => {
      const {
        data,
        error
      } = await supabase.rpc("get_available_slots", {
        p_barber_id: barber.id,
        p_date: date,
        p_duration: service.duration_minutes
      });
      if (!error && data) setSlots(data.map((r) => r.slot_time.slice(0, 5)));
      setLoading(false);
    })();
  }, [barber, date, service]);
  const confirm = async () => {
    if (!service || !barber || !date || !slot || !shopId) return;
    setSaving(true);
    try {
      const starts = /* @__PURE__ */ new Date(`${date}T${slot}:00`);
      const ends = new Date(starts.getTime() + service.duration_minutes * 6e4);
      const {
        error
      } = await supabase.from("appointments").insert({
        barbershop_id: shopId,
        barber_id: barber.id,
        service_id: service.id,
        client_id: clientId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: "scheduled"
      });
      if (error) throw error;
      toast.success("Agendamento confirmado!");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setSaving(false);
    }
  };
  const next = () => setStep((s) => s + 1);
  const canContinue = step === 1 && !!service || step === 2 && !!barber || step === 3 && !!slot;
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8 pb-24", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: step === 1 ? onBack : () => setStep((s) => s - 1), className: "h-10 w-10 rounded-full bg-card flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Passo ",
          step,
          " de 3"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: step === 1 ? "Escolha o serviço" : step === 2 ? "Escolha o barbeiro" : "Escolha o horário" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-5 flex gap-2", children: [1, 2, 3].map((n) => /* @__PURE__ */ jsx("div", { className: `h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-card"}` }, n)) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-3", children: [
      step === 1 && services.map((s) => /* @__PURE__ */ jsxs("button", { onClick: () => setService(s), className: `w-full p-5 rounded-2xl bg-card text-left flex items-center justify-between transition-all ${service?.id === s.id ? "ring-2 ring-primary" : ""}`, style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: s.name }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
            s.duration_minutes,
            " min"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-primary font-semibold", children: formatBRL(s.price_cents) })
      ] }, s.id)),
      step === 2 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: barbers.map((b) => /* @__PURE__ */ jsxs("button", { onClick: () => setBarber(b), className: `p-4 rounded-2xl bg-card text-center transition-all ${barber?.id === b.id ? "ring-2 ring-primary" : ""}`, style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        b.photo_url ? /* @__PURE__ */ jsx("img", { src: b.photo_url, alt: b.name, className: "h-20 w-20 rounded-full mx-auto object-cover" }) : /* @__PURE__ */ jsx("div", { className: "h-20 w-20 rounded-full mx-auto bg-card-elevated flex items-center justify-center text-2xl font-bold text-primary", children: b.name[0] }),
        /* @__PURE__ */ jsx("div", { className: "font-medium mt-3 text-sm", children: b.name })
      ] }, b.id)) }),
      step === 3 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto pb-2 -mx-6 px-6", children: dates.map((d) => {
          const label = (/* @__PURE__ */ new Date(d + "T12:00:00")).toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit"
          });
          return /* @__PURE__ */ jsxs("button", { onClick: () => setDate(d), className: `px-4 py-2.5 rounded-xl whitespace-nowrap text-sm flex-shrink-0 ${date === d ? "bg-primary text-primary-foreground font-semibold" : "bg-card text-muted-foreground"}`, children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5 inline mr-1.5" }),
            label
          ] }, d);
        }) }),
        !date && /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground text-sm mt-4", children: "Selecione uma data" }),
        loading && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }),
        !loading && date && slots.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground text-sm mt-4", children: "Nenhum horário disponível neste dia" }),
        !loading && slots.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2.5 mt-4", children: slots.map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setSlot(t), className: `py-3 rounded-xl text-sm font-medium transition-all ${slot === t ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`, children: t }, t)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("button", { disabled: !canContinue || saving, onClick: step === 3 ? confirm : next, className: "fixed bottom-6 left-6 right-6 max-w-[382px] mx-auto py-4 rounded-2xl font-semibold text-primary-foreground disabled:opacity-40 transition-all flex items-center justify-center gap-2", style: {
      background: "var(--gradient-gold)",
      boxShadow: "var(--shadow-gold)"
    }, children: [
      saving && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      step === 3 ? "Confirmar Agendamento" : "Continuar"
    ] })
  ] });
}
function MyAppointments({
  clientId,
  onBack
}) {
  const [items, setItems] = useState(null);
  const load = async () => {
    const {
      data
    } = await supabase.from("appointments").select("id, starts_at, status, services(name, price_cents), barbers(name)").eq("client_id", clientId).order("starts_at", {
      ascending: false
    });
    if (data) setItems(data);
  };
  useEffect(() => {
    load();
  }, [clientId]);
  const cancel = async (id) => {
    const {
      error
    } = await supabase.from("appointments").update({
      status: "cancelled"
    }).eq("id", id);
    if (error) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Agendamento cancelado");
    setItems((arr) => arr?.map((a) => a.id === id ? {
      ...a,
      status: "cancelled"
    } : a) ?? null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: onBack, className: "h-10 w-10 rounded-full bg-card flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Meus Agendamentos" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-3", children: [
      !items && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-16", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) }),
      items?.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground text-sm py-12", children: "Nenhum agendamento encontrado" }),
      items?.map((a) => /* @__PURE__ */ jsx(AppointmentCard, { appt: a, onCancel: a.status === "scheduled" ? () => cancel(a.id) : void 0 }, a.id))
    ] })
  ] });
}
export {
  ClientApp as component
};
