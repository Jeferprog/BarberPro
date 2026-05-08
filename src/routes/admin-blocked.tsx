import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar, Users, Scissors, BarChart3, Clock,
  Check, UserCheck, UserX, TrendingUp, DollarSign, Plus,
  Loader2, Trash2, X, Pencil, Settings, AlertTriangle, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { getBarbershopId, formatBRL } from "@/lib/barbershop";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "BarberPro — Painel da Barbearia" },
      { name: "description", content: "Gestao completa da sua barbearia." },
    ],
  }),
  component: AdminApp,
});

type Tab = "agenda" | "barbeiros" | "servicos" | "configuracoes" | "relatorio";
type AppointmentStatus = "scheduled" | "arrived" | "completed" | "no_show" | "cancelled";

type Barber = { id: string; name: string; photo_url: string | null; active: boolean };
type Service = { id: string; name: string; duration_minutes: number; price_cents: number };
type AppointmentRow = {
  id: string;
  starts_at: string;
  status: AppointmentStatus;
  photo_url?: string | null;
  penalty_charged_cents?: number;
  clients: { id: string; name: string } | null;
  barbers: { name: string } | null;
  services: { name: string; price_cents: number } | null;
};

const ADMIN_PASSWORD = "suasenha";

function AdminApp() {
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem("admin_auth") === ADMIN_PASSWORD);
  const [pwInput, setPwInput] = useState("");
  const [tab, setTab] = useState<Tab>("agenda");
  const [shopId, setShopId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ reason: string; blocked_at: string } | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      try {
        const id = await getBarbershopId();
        setShopId(id);
        
        // Verifica se a barbearia está ativa
        const { data: shop } = await supabase
          .from('barbershops')
          .select('active, blocked_reason, blocked_at')
          .eq('id', id)
          .single();

        if (shop && !shop.active) {
          setBlocked({
            reason: shop.blocked_reason || 'Assinatura vencida',
            blocked_at: shop.blocked_at || new Date().toISOString(),
          });
        }
      } catch (e: any) {
        toast.error(e.message ?? "Erro ao carregar barbearia");
      } finally {
        setCheckingAccess(false);
      }
    })();
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Painel da Barbearia</h1>
            <p className="text-muted-foreground text-sm mt-2">Acesso restrito</p>
          </div>
          <input type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && pwInput === ADMIN_PASSWORD) { sessionStorage.setItem("admin_auth", ADMIN_PASSWORD); setAuthorized(true); } }}
            placeholder="Senha de acesso" className="w-full bg-card text-foreground h-14 px-5 rounded-2xl border-2 border-border focus:border-primary outline-none text-base" />
          <button onClick={() => { if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem("admin_auth", ADMIN_PASSWORD); setAuthorized(true); } else setPwInput(""); }}
            className="w-full py-4 rounded-2xl font-bold text-primary-foreground" style={{ background: "var(--gradient-gold)" }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (blocked) {
    return <BlockedScreen reason={blocked.reason} blockedAt={blocked.blocked_at} />;
  }

  return (
    <MobileShell withBottomNav>
      <div className="px-6 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Painel</p>
            <h1 className="text-2xl font-bold">
              {tab === "agenda" && "Agenda do Dia"}
              {tab === "barbeiros" && "Barbeiros"}
              {tab === "servicos" && "Servicos"}
              {tab === "configuracoes" && "Configuracoes"}
              {tab === "relatorio" && "Relatorio"}
            </h1>
          </div>
          <Link to="/" className="h-10 w-10 rounded-full bg-card flex items-center justify-center text-muted-foreground">X</Link>
        </div>
        <div className="mt-8 pb-4">
          {!shopId ? <Loading /> : (
            <>
              {tab === "agenda" && <AgendaTab shopId={shopId} />}
              {tab === "barbeiros" && <BarbersTab shopId={shopId} />}
              {tab === "servicos" && <ServicesTab shopId={shopId} />}
              {tab === "configuracoes" && <ConfigTab shopId={shopId} />}
              {tab === "relatorio" && <ReportTab shopId={shopId} />}
            </>
          )}
        </div>
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </MobileShell>
  );
}

function BlockedScreen({ reason, blockedAt }: { reason: string; blockedAt: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="h-20 w-20 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Acesso Bloqueado</h1>
          <p className="text-muted-foreground mb-6">{reason}</p>

          <div className="bg-destructive/10 rounded-2xl p-4 mb-6">
            <p className="text-sm text-destructive font-medium mb-2">Data do bloqueio:</p>
            <p className="text-sm text-muted-foreground">
              {new Date(blockedAt).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="bg-card-elevated rounded-xl p-4">
              <p className="text-sm font-semibold mb-1">Para reativar sua conta:</p>
              <p className="text-xs text-muted-foreground">Entre em contato pelo WhatsApp</p>
              <a 
                href="https://wa.me/5551999999999?text=Olá, preciso reativar minha conta BarberPro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 w-full py-2.5 rounded-xl bg-success text-success-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-success/90 transition"
              >
                Falar no WhatsApp
              </a>
            </div>

            <div className="bg-card-elevated rounded-xl p-4">
              <p className="text-sm font-semibold mb-1">Outras formas de contato:</p>
              <p className="text-xs text-muted-foreground mt-2">📧 Email: suporte@barberpro.com.br</p>
              <p className="text-xs text-muted-foreground mt-1">📞 Tel: (51) 99999-9999</p>
            </div>
          </div>

          <Link 
            to="/" 
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center py-12 text-sm text-muted-foreground">{children}</div>;
}

/* ---------------- AGENDA ---------------- */
function AgendaTab({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<AppointmentRow[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [finalizeModal, setFinalizeModal] = useState<AppointmentRow | null>(null);

  const load = async () => {
    const start = new Date(selectedDate + "T00:00:00");
    const end = new Date(selectedDate + "T23:59:59");
    const { data, error } = await supabase
      .from("appointments")
      .select("id, starts_at, status, photo_url, penalty_charged_cents, clients ( id, name ), barbers ( name ), services ( name, price_cents )")
      .eq("barbershop_id", shopId)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at", { ascending: true });
    if (error) { toast.error("Erro ao carregar agenda"); return; }
    setItems(data as unknown as AppointmentRow[]);
  };

  useEffect(() => { load(); }, [shopId, selectedDate]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    if (status === "completed") {
      const appt = items?.find((a) => a.id === id);
      if (appt) { setFinalizeModal(appt); return; }
    }
    const prev = items;
    setItems((arr) => arr?.map((a) => a.id === id ? { ...a, status } : a) ?? null);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); setItems(prev); }
    else toast.success("Status atualizado");
  };

  const finalize = async (id: string, file: File | null, chargePenalty: boolean, pendingPenaltyCents: number, clientId: string) => {
    try {
      let photo_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${shopId}/${id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("appointment-photos").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("appointment-photos").getPublicUrl(path);
        photo_url = data.publicUrl;
      }
      const penaltyCharged = chargePenalty ? pendingPenaltyCents : 0;
      const { error } = await supabase.from("appointments").update({ status: "completed", photo_url, penalty_charged_cents: penaltyCharged }).eq("id", id);
      if (error) throw error;
      if (chargePenalty && pendingPenaltyCents > 0) {
        await supabase.from("client_penalties").update({ status: "collected", collected_at_appointment_id: id }).eq("client_id", clientId).eq("barbershop_id", shopId).eq("status", "pending");
      } else if (!chargePenalty && pendingPenaltyCents > 0) {
        await supabase.from("client_penalties").update({ status: "waived" }).eq("client_id", clientId).eq("barbershop_id", shopId).eq("status", "pending");
      }
      setItems((arr) => arr?.map((a) => a.id === id ? { ...a, status: "completed" as AppointmentStatus, photo_url, penalty_charged_cents: penaltyCharged } : a) ?? null);
      toast.success("Atendimento finalizado!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao finalizar");
    } finally {
      setFinalizeModal(null);
    }
  };

  if (!items) return <Loading />;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(d.toLocaleDateString("en-CA")); }} className="h-9 w-9 rounded-xl bg-card flex items-center justify-center text-muted-foreground">&#8249;</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none text-center" />
          <button onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(d.toLocaleDateString("en-CA")); }} className="h-9 w-9 rounded-xl bg-card flex items-center justify-center text-muted-foreground">&#8250;</button>
        </div>
        {items.length === 0 && <Empty>Nenhum agendamento para este dia</Empty>}
        {items.map((a) => {
          const time = new Date(a.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={a.id} className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-primary font-semibold"><Clock className="h-4 w-4" /> {time}</div>
                  <div className="font-semibold mt-2">{a.clients?.name ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">{a.services?.name ?? "—"} &bull; {a.barbers?.name ?? "—"}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={a.status} />
                  <div className="text-xs text-muted-foreground mt-2">{a.services ? formatBRL(a.services.price_cents) : "—"}</div>
                </div>
              </div>
              <PenaltyBadge clientId={a.clients?.id ?? ""} shopId={shopId} appointmentId={a.id} status={a.status} />
              {(a.status === "scheduled" || a.status === "arrived") && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ActionBtn active={a.status === "arrived"} onClick={() => updateStatus(a.id, "arrived")} label="Chegou" />
                  <ActionBtn onClick={() => updateStatus(a.id, "completed")} label="Finalizado" variant="success" />
                  <ActionBtn onClick={() => updateStatus(a.id, "no_show")} label="Faltou" variant="danger" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {finalizeModal && (
        <FinalizeModal
          appt={finalizeModal}
          shopId={shopId}
          onClose={() => setFinalizeModal(null)}
          onConfirm={(file, chargePenalty, pendingCents) => finalize(finalizeModal.id, file, chargePenalty, pendingCents, finalizeModal.clients?.id ?? "")}
        />
      )}
    </>
  );
}

function PenaltyBadge({ clientId, shopId, appointmentId, status }: { clientId: string; shopId: string; appointmentId: string; status: AppointmentStatus }) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!clientId || status === "completed" || status === "cancelled") return;
    (async () => {
      const { data } = await supabase.from("client_penalties").select("amount_cents").eq("client_id", clientId).eq("barbershop_id", shopId).eq("status", "pending");
      if (data && data.length > 0) {
        setTotal(data.reduce((s, p) => s + p.amount_cents, 0));
      }
    })();
  }, [clientId, shopId, appointmentId, status]);

  if (!total) return null;
  return (
    <div className="mt-3 flex items-center gap-2 bg-warning/10 rounded-xl px-3 py-2">
      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
      <p className="text-xs text-warning font-medium">Multa pendente: {formatBRL(total)}</p>
    </div>
  );
}

function FinalizeModal({ appt, shopId, onClose, onConfirm }: {
  appt: AppointmentRow;
  shopId: string;
  onClose: () => void;
  onConfirm: (file: File | null, chargePenalty: boolean, pendingCents: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [chargePenalty, setChargePenalty] = useState(true);
  const [pendingCents, setPendingCents] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appt.clients?.id) return;
    (async () => {
      const { data } = await supabase.from("client_penalties").select("amount_cents").eq("client_id", appt.clients!.id).eq("barbershop_id", shopId).eq("status", "pending");
      if (data) setPendingCents(data.reduce((s, p) => s + p.amount_cents, 0));
    })();
  }, [appt.clients?.id, shopId]);

  const serviceCents = appt.services?.price_cents ?? 0;
  const totalCents = serviceCents + (chargePenalty ? pendingCents : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-3xl p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Finalizar Atendimento</h2>

        {pendingCents > 0 && (
          <div className="bg-card-elevated rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold">Resumo do pagamento</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{appt.services?.name ?? "Servico"}</span><span>{formatBRL(serviceCents)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-warning flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Multa pendente</span><span className="text-warning">{formatBRL(pendingCents)}</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>Total</span><span className="text-primary">{formatBRL(totalCents)}</span></div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">Cobrar multa neste atendimento?</span>
              <button onClick={() => setChargePenalty((v) => !v)} className={`relative h-7 w-12 rounded-full transition-colors ${chargePenalty ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${chargePenalty ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {!chargePenalty && <p className="text-xs text-muted-foreground">A multa sera dispensada para este cliente.</p>}
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground mb-2">Foto do resultado (opcional)</p>
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium" />
          {file && <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-40 object-cover rounded-2xl mt-2" />}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-3 rounded-xl bg-card-elevated text-muted-foreground font-medium">Cancelar</button>
          <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm(file, chargePenalty, pendingCents); }}
            className="py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, active, variant = "default" }: { label: string; onClick: () => void; active?: boolean; variant?: "default" | "success" | "danger" }) {
  const base = "py-2.5 rounded-xl text-xs font-medium transition-colors";
  const styles = { default: active ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-card-elevated", success: "bg-success/15 text-success hover:bg-success/25", danger: "bg-destructive/15 text-destructive hover:bg-destructive/25" }[variant];
  return <button onClick={onClick} className={`${base} ${styles}`}>{label}</button>;
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { label: string; cls: string }> = {
    scheduled: { label: "Agendado", cls: "bg-primary/15 text-primary" },
    arrived: { label: "Chegou", cls: "bg-warning/15 text-warning" },
    completed: { label: "Finalizado", cls: "bg-success/15 text-success" },
    no_show: { label: "Faltou", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status];
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${m.cls}`}>{m.label}</span>;
}

/* [TODO: Resto do código permanece igual - BarbersTab, ServicesTab, ConfigTab, ReportTab, etc] */
/* Copie todo o resto do admin.tsx anterior aqui */

function BarbersTab({ shopId }: { shopId: string }) {
  const [list, setList] = useState<Barber[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.from("barbers").select("id, name, photo_url, active").eq("barbershop_id", shopId).order("name", { ascending: true });
    if (error) { toast.error("Erro ao carregar barbeiros"); return; }
    setList(data as Barber[]);
  };
  useEffect(() => { load(); }, [shopId]);
  const toggle = async (b: Barber) => {
    const prev = list;
    setList((arr) => arr?.map((x) => x.id === b.id ? { ...x, active: !x.active } : x) ?? null);
    const { error } = await supabase.from("barbers").update({ active: !b.active }).eq("id", b.id);
    if (error) { toast.error("Erro ao atualizar"); setList(prev); }
  };
  const remove = async (id: string) => {
    if (!confirm("Remover este barbeiro?")) return;
    const { error } = await supabase.from("barbers").delete().eq("id", id);
    if (error) { toast.error("Nao foi possivel remover"); return; }
    toast.success("Barbeiro removido");
    setList((arr) => arr?.filter((x) => x.id !== id) ?? null);
  };
  return (
    <div>
      <button onClick={() => setShowModal(true)} className="w-full mb-4 py-3.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center gap-2 text-sm hover:bg-card transition">
        <Plus className="h-4 w-4" /> Adicionar barbeiro
      </button>
      {!list ? <Loading /> : list.length === 0 ? <Empty>Nenhum barbeiro cadastrado</Empty> : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="bg-card rounded-2xl p-4 flex items-center gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              {b.photo_url ? <img src={b.photo_url} alt={b.name} className="h-14 w-14 rounded-full object-cover" /> : <div className="h-14 w-14 rounded-full bg-card-elevated flex items-center justify-center text-primary font-semibold">{b.name[0]}</div>}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{b.name}</div>
                <div className="text-xs mt-1">{b.active ? <span className="text-success flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Ativo</span> : <span className="text-muted-foreground flex items-center gap-1"><UserX className="h-3.5 w-3.5" /> Inativo</span>}</div>
              </div>
              <button onClick={() => toggle(b)} className={`relative h-7 w-12 rounded-full transition-colors ${b.active ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${b.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      {showModal && <BarberModal shopId={shopId} onClose={() => setShowModal(false)} onCreated={(b) => { setList((arr) => [...(arr ?? []), b]); setShowModal(false); }} />}
    </div>
  );
}

function BarberModal({ shopId, onClose, onCreated }: { shopId: string; onClose: () => void; onCreated: (b: Barber) => void }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim()) { toast.error("Informe o nome"); return; }
    setSaving(true);
    try {
      let photo_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("barber-photos").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("barber-photos").getPublicUrl(path);
        photo_url = data.publicUrl;
      }
      const { data, error } = await supabase.from("barbers").insert({ barbershop_id: shopId, name: name.trim(), photo_url, active: true }).select("id, name, photo_url, active").single();
      if (error) throw error;
      toast.success("Barbeiro adicionado");
      onCreated(data as Barber);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Novo barbeiro" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nome"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none" placeholder="Ex.: Rafael Silva" /></Field>
        <Field label="Foto (opcional)"><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium" /></Field>
        <button disabled={saving} onClick={submit} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</button>
      </div>
    </Modal>
  );
}

function ServicesTab({ shopId }: { shopId: string }) {
  const [list, setList] = useState<Service[] | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.from("services").select("id, name, duration_minutes, price_cents").eq("barbershop_id", shopId).order("name", { ascending: true });
    if (error) { toast.error("Erro ao carregar servicos"); return; }
    setList(data as Service[]);
  };
  useEffect(() => { load(); }, [shopId]);
  const remove = async (id: string) => {
    if (!confirm("Remover este servico?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) { toast.error("Nao foi possivel remover"); return; }
    toast.success("Servico removido");
    setList((arr) => arr?.filter((s) => s.id !== id) ?? null);
  };
  return (
    <div>
      <button onClick={() => setCreating(true)} className="w-full mb-4 py-3.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center gap-2 text-sm hover:bg-card transition">
        <Plus className="h-4 w-4" /> Adicionar servico
      </button>
      {!list ? <Loading /> : list.length === 0 ? <Empty>Nenhum servico cadastrado</Empty> : (
        <div className="space-y-3">
          {list.map((s) => (
            <div key={s.id} className="bg-card rounded-2xl p-5 flex items-center justify-between gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration_minutes} min</div>
              </div>
              <div className="text-primary font-semibold">{formatBRL(s.price_cents)}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(s)} className="text-muted-foreground hover:text-primary p-2"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <ServiceModal shopId={shopId} initial={editing ?? undefined} onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={(s, isNew) => { setList((arr) => { if (!arr) return [s]; return isNew ? [...arr, s] : arr.map((x) => x.id === s.id ? s : x); }); setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}

function ServiceModal({ shopId, initial, onClose, onSaved }: { shopId: string; initial?: Service; onClose: () => void; onSaved: (s: Service, isNew: boolean) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [duration, setDuration] = useState<number>(initial?.duration_minutes ?? 30);
  const [price, setPrice] = useState<string>(initial ? (initial.price_cents / 100).toFixed(2) : "");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim()) { toast.error("Informe o nome"); return; }
    const priceNum = parseFloat(price.replace(",", "."));
    if (isNaN(priceNum) || priceNum < 0) { toast.error("Preco invalido"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), duration_minutes: duration, price_cents: Math.round(priceNum * 100) };
      if (initial) {
        const { data, error } = await supabase.from("services").update(payload).eq("id", initial.id).select("id, name, duration_minutes, price_cents").single();
        if (error) throw error;
        toast.success("Servico atualizado"); onSaved(data as Service, false);
      } else {
        const { data, error } = await supabase.from("services").insert({ barbershop_id: shopId, ...payload }).select("id, name, duration_minutes, price_cents").single();
        if (error) throw error;
        toast.success("Servico adicionado"); onSaved(data as Service, true);
      }
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={initial ? "Editar servico" : "Novo servico"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nome do servico"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none" placeholder="Ex.: Corte + Barba" /></Field>
        <Field label="Duracao (min)"><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={5} step={5} className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none" placeholder="Ex: 20" /></Field>
        <Field label="Preco (R$)"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none" placeholder="50.00" /></Field>
        <button disabled={saving} onClick={submit} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</button>
      </div>
    </Modal>
  );
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
type WorkingHour = { id: string; barber_id: string; day_of_week: number; start_time: string; end_time: string };

function ConfigTab({ shopId }: { shopId: string }) {
  const [section, setSection] = useState<"horarios" | "cancelamento">("horarios");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setSection("horarios")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${section === "horarios" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>Horarios</button>
        <button onClick={() => setSection("cancelamento")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${section === "cancelamento" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>Cancelamento</button>
      </div>
      {section === "horarios" && <HoursSection shopId={shopId} />}
      {section === "cancelamento" && <CancellationSection shopId={shopId} />}
    </div>
  );
}

function HoursSection({ shopId }: { shopId: string }) {
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<number, { active: boolean; start: string; end: string }>>({});
  const loadBarbers = async () => {
    const { data, error } = await supabase.from("barbers").select("id, name, photo_url, active").eq("barbershop_id", shopId).eq("active", true).order("name", { ascending: true });
    if (error) { toast.error("Erro ao carregar barbeiros"); return; }
    setBarbers(data as Barber[]);
  };
  const loadHours = async (barberId: string) => {
    const { data, error } = await supabase.from("working_hours").select("*").eq("barber_id", barberId);
    if (error) { toast.error("Erro ao carregar horarios"); return; }
    const newDraft: Record<number, { active: boolean; start: string; end: string }> = {};
    for (let d = 0; d < 7; d++) {
      const found = (data as WorkingHour[]).find((h) => h.day_of_week === d);
      newDraft[d] = { active: !!found, start: found?.start_time?.slice(0, 5) ?? "09:00", end: found?.end_time?.slice(0, 5) ?? "18:00" };
    }
    setDraft(newDraft);
  };
  useEffect(() => { loadBarbers(); }, [shopId]);
  useEffect(() => { if (selected) loadHours(selected); }, [selected]);
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase.from("working_hours").delete().eq("barber_id", selected);
      const toInsert = Object.entries(draft).filter(([, v]) => v.active).map(([day, v]) => ({ barber_id: selected, day_of_week: Number(day), start_time: v.start, end_time: v.end }));
      if (toInsert.length > 0) { const { error } = await supabase.from("working_hours").insert(toInsert); if (error) throw error; }
      toast.success("Horarios salvos!");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };
  if (!barbers) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Selecione o barbeiro</p>
        <div className="flex gap-2 flex-wrap">
          {barbers.map((b) => <button key={b.id} onClick={() => setSelected(b.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selected === b.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-card-elevated"}`}>{b.name}</button>)}
        </div>
      </div>
      {selected && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Dias e horarios</p>
          {DAYS.map((day, idx) => (
            <div key={idx} className="bg-card rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{day}</span>
                <button onClick={() => setDraft((d) => ({ ...d, [idx]: { ...d[idx], active: !d[idx]?.active } }))} className={`relative h-7 w-12 rounded-full transition-colors ${draft[idx]?.active ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${draft[idx]?.active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              {draft[idx]?.active && (
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Inicio</p><input type="time" value={draft[idx]?.start ?? "09:00"} onChange={(e) => setDraft((d) => ({ ...d, [idx]: { ...d[idx], start: e.target.value } }))} className="w-full bg-background rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" /></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Fim</p><input type="time" value={draft[idx]?.end ?? "18:00"} onChange={(e) => setDraft((d) => ({ ...d, [idx]: { ...d[idx], end: e.target.value } }))} className="w-full bg-background rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" /></div>
                </div>
              )}
            </div>
          ))}
          <button disabled={saving} onClick={save} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Horarios</button>
        </div>
      )}
      {!selected && barbers.length > 0 && <Empty>Selecione um barbeiro para configurar os horarios</Empty>}
      {barbers.length === 0 && <Empty>Cadastre barbeiros primeiro</Empty>}
    </div>
  );
}

function CancellationSection({ shopId }: { shopId: string }) {
  const [hours, setHours] = useState<number>(2);
  const [fee, setFee] = useState<string>("0.00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("barbershop_settings").select("cancellation_hours, cancellation_fee_cents").eq("barbershop_id", shopId).maybeSingle();
      if (data) { setHours(data.cancellation_hours); setFee((data.cancellation_fee_cents / 100).toFixed(2)); }
      setLoading(false);
    })();
  }, [shopId]);
  const save = async () => {
    const feeNum = parseFloat(fee.replace(",", "."));
    if (isNaN(feeNum) || feeNum < 0) { toast.error("Valor de penalidade invalido"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("barbershop_settings").upsert({ barbershop_id: shopId, cancellation_hours: hours, cancellation_fee_cents: Math.round(feeNum * 100), updated_at: new Date().toISOString() }, { onConflict: "barbershop_id" });
      if (error) throw error;
      toast.success("Politica de cancelamento salva!");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  };
  if (loading) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Prazo minimo para cancelamento</p>
          <p className="text-xs text-muted-foreground mb-3">Cancelamentos feitos com menos de X horas de antecedencia gerao penalidade</p>
          <div className="flex items-center gap-3">
            <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} min={0} step={1} className="w-24 bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none text-center font-semibold" />
            <span className="text-sm text-muted-foreground">horas antes do agendamento</span>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Valor da penalidade</p>
          <p className="text-xs text-muted-foreground mb-3">Cobrado no proximo atendimento. Use 0 para nao cobrar</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">R$</span>
            <input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" className="w-32 bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none font-semibold" placeholder="0.00" />
          </div>
        </div>
        <div className="bg-primary/10 rounded-xl p-3">
          <p className="text-xs text-primary font-medium">Politica atual:</p>
          <p className="text-xs text-muted-foreground mt-1">{hours === 0 ? "Cancelamentos podem gerar penalidade a qualquer momento" : `Cancelamentos com menos de ${hours}h de antecedencia`}{parseFloat(fee) > 0 ? ` gerao cobranca de R$${parseFloat(fee).toFixed(2)} no proximo atendimento` : " nao geram penalidade financeira"}.</p>
        </div>
      </div>
      <button disabled={saving} onClick={save} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Politica</button>
    </div>
  );
}

function ReportTab({ shopId }: { shopId: string }) {
  const [today, setToday] = useState<{ total: number; revenue: number; completed: number; penalties: number } | null>(null);
  const [week, setWeek] = useState<{ total: number; revenue: number; penalties: number } | null>(null);
  useEffect(() => {
    (async () => {
      const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
      const startWeek = new Date(); startWeek.setDate(startWeek.getDate() - 6); startWeek.setHours(0, 0, 0, 0);
      const fetchRange = async (from: Date, to: Date) => {
        const { data, error } = await supabase.from("appointments").select("status, services ( price_cents ), penalty_charged_cents").eq("barbershop_id", shopId).gte("starts_at", from.toISOString()).lte("starts_at", to.toISOString());
        if (error) { toast.error("Erro ao carregar relatorio"); return null; }
        return data as Array<{ status: string; services: { price_cents: number } | null; penalty_charged_cents: number }>;
      };
      const [todayRows, weekRows] = await Promise.all([fetchRange(startToday, endToday), fetchRange(startWeek, endToday)]);
      if (todayRows) {
        const valid = todayRows.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
        const completed = todayRows.filter((a) => a.status === "completed");
        setToday({ total: valid.length, completed: completed.length, revenue: completed.reduce((s, a) => s + (a.services?.price_cents ?? 0), 0), penalties: completed.reduce((s, a) => s + (a.penalty_charged_cents ?? 0), 0) });
      }
      if (weekRows) {
        const completed = weekRows.filter((a) => a.status === "completed");
        const valid = weekRows.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
        setWeek({ total: valid.length, revenue: completed.reduce((s, a) => s + (a.services?.price_cents ?? 0), 0), penalties: completed.reduce((s, a) => s + (a.penalty_charged_cents ?? 0), 0) });
      }
    })();
  }, [shopId]);
  if (!today || !week) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Agendamentos hoje" value={today.total.toString()} />
        <StatCard icon={<Check className="h-5 w-5" />} label="Finalizados hoje" value={today.completed.toString()} />
      </div>
      <div className="rounded-3xl p-6 text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}>
        <DollarSign className="absolute -right-4 -bottom-4 h-28 w-28 opacity-20" />
        <div className="text-sm opacity-80 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Faturamento de Hoje</div>
        <div className="text-4xl font-bold mt-2">{formatBRL(today.revenue + today.penalties)}</div>
        {today.penalties > 0 && <div className="text-xs opacity-80 mt-1">Servicos: {formatBRL(today.revenue)} + Multas: {formatBRL(today.penalties)}</div>}
        <div className="text-xs opacity-70 mt-1">Atualizado em tempo real</div>
      </div>
      <div className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="font-semibold mb-4">Ultimos 7 dias</div>
        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Agendamentos</span><span className="font-semibold">{week.total}</span></div>
        <div className="flex items-center justify-between text-sm mt-2"><span className="text-muted-foreground">Servicos</span><span className="font-semibold">{formatBRL(week.revenue)}</span></div>
        {week.penalties > 0 && <div className="flex items-center justify-between text-sm mt-2"><span className="text-muted-foreground">Multas cobradas</span><span className="text-warning font-semibold">{formatBRL(week.penalties)}</span></div>}
        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-border"><span className="text-muted-foreground font-medium">Total</span><span className="text-primary font-semibold">{formatBRL(week.revenue + week.penalties)}</span></div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">{icon}</div>
      <div className="text-2xl font-bold mt-3">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-3xl p-6" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-background flex items-center justify-center text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { key: "agenda", label: "Agenda", icon: <Calendar className="h-5 w-5" /> },
    { key: "barbeiros", label: "Barbeiros", icon: <Users className="h-5 w-5" /> },
    { key: "servicos", label: "Servicos", icon: <Scissors className="h-5 w-5" /> },
    { key: "configuracoes", label: "Config", icon: <Settings className="h-5 w-5" /> },
    { key: "relatorio", label: "Relatorio", icon: <BarChart3 className="h-5 w-5" /> },
  ], []);
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around py-2">
        {items.map((it) => {
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => onChange(it.key)} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
              {it.icon}
              <span className="text-[10px] font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
