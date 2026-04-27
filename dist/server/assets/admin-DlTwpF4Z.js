import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Clock, Plus, UserCheck, UserX, Trash2, Pencil, Calendar, Check, DollarSign, TrendingUp, Users, Scissors, BarChart3, X } from "lucide-react";
import { toast } from "sonner";
import { M as MobileShell } from "./MobileShell-CjviHgqT.js";
import { g as getBarbershopId, f as formatBRL, s as supabase } from "./barbershop-CNXjeCZp.js";
import "@supabase/supabase-js";
function AdminApp() {
  const [tab, setTab] = useState("agenda");
  const [shopId, setShopId] = useState(null);
  useEffect(() => {
    getBarbershopId().then(setShopId).catch((e) => toast.error(e.message ?? "Erro ao carregar barbearia"));
  }, []);
  return /* @__PURE__ */ jsxs(MobileShell, { withBottomNav: true, children: [
    /* @__PURE__ */ jsxs("div", { className: "px-6 pt-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: "Painel" }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
            tab === "agenda" && "Agenda do Dia",
            tab === "barbeiros" && "Barbeiros",
            tab === "servicos" && "Serviços",
            tab === "horarios" && "Horários",
            tab === "relatorio" && "Relatório"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/", className: "h-10 w-10 rounded-full bg-card flex items-center justify-center text-muted-foreground", children: "✕" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 pb-4", children: !shopId ? /* @__PURE__ */ jsx(Loading, {}) : /* @__PURE__ */ jsxs(Fragment, { children: [
        tab === "agenda" && /* @__PURE__ */ jsx(AgendaTab, { shopId }),
        tab === "barbeiros" && /* @__PURE__ */ jsx(BarbersTab, { shopId }),
        tab === "servicos" && /* @__PURE__ */ jsx(ServicesTab, { shopId }),
        tab === "horarios" && /* @__PURE__ */ jsx(HoursTab, { shopId }),
        tab === "relatorio" && /* @__PURE__ */ jsx(ReportTab, { shopId })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(BottomNav, { tab, onChange: setTab })
  ] });
}
function Loading() {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-16 text-muted-foreground", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin" }) });
}
function Empty({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-sm text-muted-foreground", children });
}
function AgendaTab({
  shopId
}) {
  const [items, setItems] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA")
    // YYYY-MM-DD no fuso local
  );
  const load = async () => {
    const start = /* @__PURE__ */ new Date(selectedDate + "T00:00:00");
    const end = /* @__PURE__ */ new Date(selectedDate + "T23:59:59");
    const {
      data,
      error
    } = await supabase.from("appointments").select(`
        id, starts_at, status,
        clients ( name ),
        barbers ( name ),
        services ( name, price_cents )
      `).eq("barbershop_id", shopId).gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString()).order("starts_at", {
      ascending: true
    });
    if (error) {
      toast.error("Erro ao carregar agenda");
      return;
    }
    setItems(data);
  };
  useEffect(() => {
    load();
  }, [shopId, selectedDate]);
  const updateStatus = async (id, status) => {
    const prev = items;
    setItems((arr) => arr?.map((a) => a.id === id ? {
      ...a,
      status
    } : a) ?? null);
    const {
      error
    } = await supabase.from("appointments").update({
      status
    }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
      setItems(prev);
    } else {
      toast.success("Status atualizado");
    }
  };
  if (!items) return /* @__PURE__ */ jsx(Loading, {});
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        const d = /* @__PURE__ */ new Date(selectedDate + "T12:00:00");
        d.setDate(d.getDate() - 1);
        setSelectedDate(d.toLocaleDateString("en-CA"));
      }, className: "h-9 w-9 rounded-xl bg-card flex items-center justify-center text-muted-foreground", children: "‹" }),
      /* @__PURE__ */ jsx("input", { type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "flex-1 bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none text-center" }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        const d = /* @__PURE__ */ new Date(selectedDate + "T12:00:00");
        d.setDate(d.getDate() + 1);
        setSelectedDate(d.toLocaleDateString("en-CA"));
      }, className: "h-9 w-9 rounded-xl bg-card flex items-center justify-center text-muted-foreground", children: "›" })
    ] }),
    items.length === 0 && /* @__PURE__ */ jsx(Empty, { children: "Nenhum agendamento para este dia" }),
    items.map((a) => {
      const time = new Date(a.starts_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });
      return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-5", style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-primary font-semibold", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
              " ",
              time
            ] }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold mt-2", children: a.clients?.name ?? "—" }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
              a.services?.name ?? "—",
              " • ",
              a.barbers?.name ?? "—"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx(StatusBadge, { status: a.status }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-2", children: a.services ? formatBRL(a.services.price_cents) : "—" })
          ] })
        ] }),
        (a.status === "scheduled" || a.status === "arrived") && /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2", children: [
          /* @__PURE__ */ jsx(ActionBtn, { active: a.status === "arrived", onClick: () => updateStatus(a.id, "arrived"), label: "Chegou" }),
          /* @__PURE__ */ jsx(ActionBtn, { onClick: () => updateStatus(a.id, "completed"), label: "Finalizado", variant: "success" }),
          /* @__PURE__ */ jsx(ActionBtn, { onClick: () => updateStatus(a.id, "no_show"), label: "Faltou", variant: "danger" })
        ] })
      ] }, a.id);
    })
  ] });
}
function ActionBtn({
  label,
  onClick,
  active,
  variant = "default"
}) {
  const base = "py-2.5 rounded-xl text-xs font-medium transition-colors";
  const styles = {
    default: active ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-card-elevated",
    success: "bg-success/15 text-success hover:bg-success/25",
    danger: "bg-destructive/15 text-destructive hover:bg-destructive/25"
  }[variant];
  return /* @__PURE__ */ jsx("button", { onClick, className: `${base} ${styles}`, children: label });
}
function StatusBadge({
  status
}) {
  const map = {
    scheduled: {
      label: "Agendado",
      cls: "bg-primary/15 text-primary"
    },
    arrived: {
      label: "Chegou",
      cls: "bg-warning/15 text-warning"
    },
    completed: {
      label: "Finalizado",
      cls: "bg-success/15 text-success"
    },
    no_show: {
      label: "Faltou",
      cls: "bg-destructive/15 text-destructive"
    },
    cancelled: {
      label: "Cancelado",
      cls: "bg-muted text-muted-foreground"
    }
  };
  const m = map[status];
  return /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${m.cls}`, children: m.label });
}
function BarbersTab({
  shopId
}) {
  const [list, setList] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const load = async () => {
    const {
      data,
      error
    } = await supabase.from("barbers").select("id, name, photo_url, active").eq("barbershop_id", shopId).order("name", {
      ascending: true
    });
    if (error) {
      toast.error("Erro ao carregar barbeiros");
      return;
    }
    setList(data);
  };
  useEffect(() => {
    load();
  }, [shopId]);
  const toggle = async (b) => {
    const prev = list;
    setList((arr) => arr?.map((x) => x.id === b.id ? {
      ...x,
      active: !x.active
    } : x) ?? null);
    const {
      error
    } = await supabase.from("barbers").update({
      active: !b.active
    }).eq("id", b.id);
    if (error) {
      toast.error("Erro ao atualizar");
      setList(prev);
    }
  };
  const remove = async (id) => {
    if (!confirm("Remover este barbeiro?")) return;
    const {
      error
    } = await supabase.from("barbers").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    toast.success("Barbeiro removido");
    setList((arr) => arr?.filter((x) => x.id !== id) ?? null);
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("button", { onClick: () => setShowModal(true), className: "w-full mb-4 py-3.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center gap-2 text-sm hover:bg-card transition", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Adicionar barbeiro"
    ] }),
    !list ? /* @__PURE__ */ jsx(Loading, {}) : list.length === 0 ? /* @__PURE__ */ jsx(Empty, { children: "Nenhum barbeiro cadastrado" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: list.map((b) => /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-4 flex items-center gap-4", style: {
      boxShadow: "var(--shadow-card)"
    }, children: [
      b.photo_url ? /* @__PURE__ */ jsx("img", { src: b.photo_url, alt: b.name, className: "h-14 w-14 rounded-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "h-14 w-14 rounded-full bg-card-elevated flex items-center justify-center text-primary font-semibold", children: b.name[0] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold truncate", children: b.name }),
        /* @__PURE__ */ jsx("div", { className: "text-xs mt-1", children: b.active ? /* @__PURE__ */ jsxs("span", { className: "text-success flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(UserCheck, { className: "h-3.5 w-3.5" }),
          " Ativo"
        ] }) : /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(UserX, { className: "h-3.5 w-3.5" }),
          " Inativo"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => toggle(b), className: `relative h-7 w-12 rounded-full transition-colors ${b.active ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${b.active ? "translate-x-5" : "translate-x-0.5"}` }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => remove(b.id), className: "text-muted-foreground hover:text-destructive p-2", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
    ] }, b.id)) }),
    showModal && /* @__PURE__ */ jsx(BarberModal, { shopId, onClose: () => setShowModal(false), onCreated: (b) => {
      setList((arr) => [...arr ?? [], b]);
      setShowModal(false);
    } })
  ] });
}
function BarberModal({
  shopId,
  onClose,
  onCreated
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome");
      return;
    }
    setSaving(true);
    try {
      let photo_url = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
        const {
          error: upErr
        } = await supabase.storage.from("barber-photos").upload(path, file);
        if (upErr) throw upErr;
        const {
          data: data2
        } = supabase.storage.from("barber-photos").getPublicUrl(path);
        photo_url = data2.publicUrl;
      }
      const {
        data,
        error
      } = await supabase.from("barbers").insert({
        barbershop_id: shopId,
        name: name.trim(),
        photo_url,
        active: true
      }).select("id, name, photo_url, active").single();
      if (error) throw error;
      toast.success("Barbeiro adicionado");
      onCreated(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx(Modal, { title: "Novo barbeiro", onClose, children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(Field, { label: "Nome", children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none", placeholder: "Ex.: Rafael Silva" }) }),
    /* @__PURE__ */ jsx(Field, { label: "Foto (opcional)", children: /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", onChange: (e) => setFile(e.target.files?.[0] ?? null), className: "w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium" }) }),
    /* @__PURE__ */ jsxs("button", { disabled: saving, onClick: submit, className: "w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2", children: [
      saving && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      " Salvar"
    ] })
  ] }) });
}
function ServicesTab({
  shopId
}) {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const load = async () => {
    const {
      data,
      error
    } = await supabase.from("services").select("id, name, duration_minutes, price_cents").eq("barbershop_id", shopId).order("name", {
      ascending: true
    });
    if (error) {
      toast.error("Erro ao carregar serviços");
      return;
    }
    setList(data);
  };
  useEffect(() => {
    load();
  }, [shopId]);
  const remove = async (id) => {
    if (!confirm("Remover este serviço?")) return;
    const {
      error
    } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    toast.success("Serviço removido");
    setList((arr) => arr?.filter((s) => s.id !== id) ?? null);
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("button", { onClick: () => setCreating(true), className: "w-full mb-4 py-3.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center gap-2 text-sm hover:bg-card transition", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Adicionar serviço"
    ] }),
    !list ? /* @__PURE__ */ jsx(Loading, {}) : list.length === 0 ? /* @__PURE__ */ jsx(Empty, { children: "Nenhum serviço cadastrado" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: list.map((s) => /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-5 flex items-center justify-between gap-3", style: {
      boxShadow: "var(--shadow-card)"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold truncate", children: s.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
          " ",
          s.duration_minutes,
          " min"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-primary font-semibold", children: formatBRL(s.price_cents) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setEditing(s), className: "text-muted-foreground hover:text-primary p-2", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => remove(s.id), className: "text-muted-foreground hover:text-destructive p-2", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
      ] })
    ] }, s.id)) }),
    (creating || editing) && /* @__PURE__ */ jsx(ServiceModal, { shopId, initial: editing ?? void 0, onClose: () => {
      setCreating(false);
      setEditing(null);
    }, onSaved: (s, isNew) => {
      setList((arr) => {
        if (!arr) return [s];
        return isNew ? [...arr, s] : arr.map((x) => x.id === s.id ? s : x);
      });
      setCreating(false);
      setEditing(null);
    } })
  ] });
}
function ServiceModal({
  shopId,
  initial,
  onClose,
  onSaved
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 30);
  const [price, setPrice] = useState(initial ? (initial.price_cents / 100).toFixed(2) : "");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome");
      return;
    }
    const priceNum = parseFloat(price.replace(",", "."));
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Preço inválido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        duration_minutes: duration,
        price_cents: Math.round(priceNum * 100)
      };
      if (initial) {
        const {
          data,
          error
        } = await supabase.from("services").update(payload).eq("id", initial.id).select("id, name, duration_minutes, price_cents").single();
        if (error) throw error;
        toast.success("Serviço atualizado");
        onSaved(data, false);
      } else {
        const {
          data,
          error
        } = await supabase.from("services").insert({
          barbershop_id: shopId,
          ...payload
        }).select("id, name, duration_minutes, price_cents").single();
        if (error) throw error;
        toast.success("Serviço adicionado");
        onSaved(data, true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx(Modal, { title: initial ? "Editar serviço" : "Novo serviço", onClose, children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(Field, { label: "Nome do serviço", children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none", placeholder: "Ex.: Corte + Barba" }) }),
    /* @__PURE__ */ jsx(Field, { label: "Duração (min)", children: /* @__PURE__ */ jsx("input", { type: "number", value: duration, onChange: (e) => setDuration(Number(e.target.value)), min: 5, step: 5, className: "w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none", placeholder: "Ex: 20" }) }),
    /* @__PURE__ */ jsx(Field, { label: "Preço (R$)", children: /* @__PURE__ */ jsx("input", { value: price, onChange: (e) => setPrice(e.target.value), inputMode: "decimal", className: "w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none", placeholder: "50.00" }) }),
    /* @__PURE__ */ jsxs("button", { disabled: saving, onClick: submit, className: "w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2", children: [
      saving && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      " Salvar"
    ] })
  ] }) });
}
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function HoursTab({
  shopId
}) {
  const [barbers, setBarbers] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hours, setHours] = useState([]);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const loadBarbers = async () => {
    const {
      data,
      error
    } = await supabase.from("barbers").select("id, name, photo_url, active").eq("barbershop_id", shopId).eq("active", true).order("name", {
      ascending: true
    });
    if (error) {
      toast.error("Erro ao carregar barbeiros");
      return;
    }
    setBarbers(data);
  };
  const loadHours = async (barberId) => {
    const {
      data,
      error
    } = await supabase.from("working_hours").select("*").eq("barber_id", barberId);
    if (error) {
      toast.error("Erro ao carregar horários");
      return;
    }
    setHours(data);
    const newDraft = {};
    for (let d = 0; d < 7; d++) {
      const found = data.find((h) => h.day_of_week === d);
      newDraft[d] = {
        active: !!found,
        start: found?.start_time?.slice(0, 5) ?? "09:00",
        end: found?.end_time?.slice(0, 5) ?? "18:00"
      };
    }
    setDraft(newDraft);
  };
  useEffect(() => {
    loadBarbers();
  }, [shopId]);
  useEffect(() => {
    if (selected) loadHours(selected);
  }, [selected]);
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase.from("working_hours").delete().eq("barber_id", selected);
      const toInsert = Object.entries(draft).filter(([, v]) => v.active).map(([day, v]) => ({
        barber_id: selected,
        day_of_week: Number(day),
        start_time: v.start,
        end_time: v.end
      }));
      if (toInsert.length > 0) {
        const {
          error
        } = await supabase.from("working_hours").insert(toInsert);
        if (error) throw error;
      }
      toast.success("Horários salvos com sucesso!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };
  if (!barbers) return /* @__PURE__ */ jsx(Loading, {});
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Selecione o barbeiro" }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: barbers.map((b) => /* @__PURE__ */ jsx("button", { onClick: () => setSelected(b.id), className: `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selected === b.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-card-elevated"}`, children: b.name }, b.id)) })
    ] }),
    selected && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Dias e horários" }),
      DAYS.map((day, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-4", style: {
        boxShadow: "var(--shadow-card)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: day }),
          /* @__PURE__ */ jsx("button", { onClick: () => setDraft((d) => ({
            ...d,
            [idx]: {
              ...d[idx],
              active: !d[idx]?.active
            }
          })), className: `relative h-7 w-12 rounded-full transition-colors ${draft[idx]?.active ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${draft[idx]?.active ? "translate-x-5" : "translate-x-0.5"}` }) })
        ] }),
        draft[idx]?.active && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-1", children: "Início" }),
            /* @__PURE__ */ jsx("input", { type: "time", value: draft[idx]?.start ?? "09:00", onChange: (e) => setDraft((d) => ({
              ...d,
              [idx]: {
                ...d[idx],
                start: e.target.value
              }
            })), className: "w-full bg-background rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-1", children: "Fim" }),
            /* @__PURE__ */ jsx("input", { type: "time", value: draft[idx]?.end ?? "18:00", onChange: (e) => setDraft((d) => ({
              ...d,
              [idx]: {
                ...d[idx],
                end: e.target.value
              }
            })), className: "w-full bg-background rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" })
          ] })
        ] })
      ] }, idx)),
      /* @__PURE__ */ jsxs("button", { disabled: saving, onClick: save, className: "w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2", children: [
        saving && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Salvar Horários"
      ] })
    ] }),
    !selected && barbers.length > 0 && /* @__PURE__ */ jsx(Empty, { children: "Selecione um barbeiro para configurar os horários" }),
    barbers.length === 0 && /* @__PURE__ */ jsx(Empty, { children: "Cadastre barbeiros primeiro" })
  ] });
}
function ReportTab({
  shopId
}) {
  const [today, setToday] = useState(null);
  const [week, setWeek] = useState(null);
  useEffect(() => {
    (async () => {
      const startToday = /* @__PURE__ */ new Date();
      startToday.setHours(0, 0, 0, 0);
      const endToday = /* @__PURE__ */ new Date();
      endToday.setHours(23, 59, 59, 999);
      const startWeek = /* @__PURE__ */ new Date();
      startWeek.setDate(startWeek.getDate() - 6);
      startWeek.setHours(0, 0, 0, 0);
      const fetchRange = async (from, to) => {
        const {
          data,
          error
        } = await supabase.from("appointments").select(`status, services ( price_cents )`).eq("barbershop_id", shopId).gte("starts_at", from.toISOString()).lte("starts_at", to.toISOString());
        if (error) {
          toast.error("Erro ao carregar relatório");
          return null;
        }
        return data;
      };
      const [todayRows, weekRows] = await Promise.all([fetchRange(startToday, endToday), fetchRange(startWeek, endToday)]);
      if (todayRows) {
        const valid = todayRows.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
        const completedRows = todayRows.filter((a) => a.status === "completed");
        setToday({
          total: valid.length,
          completed: completedRows.length,
          revenue: completedRows.reduce((s, a) => s + (a.services?.price_cents ?? 0), 0)
        });
      }
      if (weekRows) {
        const completedRows = weekRows.filter((a) => a.status === "completed");
        const valid = weekRows.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
        setWeek({
          total: valid.length,
          revenue: completedRows.reduce((s, a) => s + (a.services?.price_cents ?? 0), 0)
        });
      }
    })();
  }, [shopId]);
  if (!today || !week) return /* @__PURE__ */ jsx(Loading, {});
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" }), label: "Agendamentos hoje", value: today.total.toString() }),
      /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Check, { className: "h-5 w-5" }), label: "Finalizados hoje", value: today.completed.toString() })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl p-6 text-primary-foreground relative overflow-hidden", style: {
      background: "var(--gradient-gold)",
      boxShadow: "var(--shadow-gold)"
    }, children: [
      /* @__PURE__ */ jsx(DollarSign, { className: "absolute -right-4 -bottom-4 h-28 w-28 opacity-20" }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm opacity-80 flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" }),
        " Faturamento de Hoje"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold mt-2", children: formatBRL(today.revenue) }),
      /* @__PURE__ */ jsx("div", { className: "text-xs opacity-70 mt-2", children: "Atualizado em tempo real" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-5", style: {
      boxShadow: "var(--shadow-card)"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "font-semibold mb-4", children: "Últimos 7 dias" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Agendamentos" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: week.total })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm mt-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Faturamento" }),
        /* @__PURE__ */ jsx("span", { className: "text-primary font-semibold", children: formatBRL(week.revenue) })
      ] })
    ] })
  ] });
}
function StatCard({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-4", style: {
    boxShadow: "var(--shadow-card)"
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center", children: icon }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold mt-3", children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label })
  ] });
}
function Modal({
  title,
  onClose,
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md bg-card rounded-3xl p-6", style: {
    boxShadow: "var(--shadow-card)"
  }, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: title }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "h-9 w-9 rounded-full bg-background flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
    ] }),
    children
  ] }) });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-2", children })
  ] });
}
function BottomNav({
  tab,
  onChange
}) {
  const items = useMemo(() => [{
    key: "agenda",
    label: "Agenda",
    icon: /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" })
  }, {
    key: "barbeiros",
    label: "Barbeiros",
    icon: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" })
  }, {
    key: "servicos",
    label: "Serviços",
    icon: /* @__PURE__ */ jsx(Scissors, { className: "h-5 w-5" })
  }, {
    key: "horarios",
    label: "Horários",
    icon: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" })
  }, {
    key: "relatorio",
    label: "Relatório",
    icon: /* @__PURE__ */ jsx(BarChart3, { className: "h-5 w-5" })
  }], []);
  return /* @__PURE__ */ jsx("nav", { className: "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur border-t border-border", style: {
    paddingBottom: "env(safe-area-inset-bottom)"
  }, children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-around py-2", children: items.map((it) => {
    const active = tab === it.key;
    return /* @__PURE__ */ jsxs("button", { onClick: () => onChange(it.key), className: `flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${active ? "text-primary" : "text-muted-foreground"}`, children: [
      it.icon,
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium", children: it.label })
    ] }, it.key);
  }) }) });
}
export {
  AdminApp as component
};
