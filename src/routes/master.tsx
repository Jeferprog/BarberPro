import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Lock, Unlock, Plus, Search, Building2, Calendar,
  DollarSign, Users, Loader2, X, Check, AlertTriangle,
  Eye, EyeOff, Copy, ChevronRight, ChevronLeft, Scissors,
  Clock, Trash2, Pencil, Bell, UserPlus, Upload, Palette, Image
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/barbershop";

export const Route = createFileRoute("/master")({
  head: () => ({
    meta: [
      { title: "BarberPro — Painel Master" },
      { name: "description", content: "Gestão completa de todas as barbearias" },
    ],
  }),
  component: MasterPanel,
});

type Barbershop = {
  id: string;
  name: string;
  active: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  created_at: string;
  due_date: string | null;
  logo_url: string | null;
  brand_color: string;
  text_color: string;
  font_family: string;
  settings?: {
    cancellation_hours: number;
    cancellation_fee_cents: number;
    reminder_hours?: number;
    reminder_message?: string;
  } | null;
  stats?: {
    barbers: number;
    services: number;
    appointments_today: number;
  };
};

type BarberItem = { id: string; name: string; photo_url: string | null; active: boolean };
type ServiceItem = { id: string; name: string; duration_minutes: number; price_cents: number };

const MASTER_PASSWORD = "master2026";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function MasterPanel() {
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem("master_auth") === MASTER_PASSWORD);
  const [pwInput, setPwInput] = useState("");
  const [shops, setShops] = useState<Barbershop[] | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState<string | null>(null);

  useEffect(() => {
    if (authorized) loadShops();
  }, [authorized]);

  const loadShops = async () => {
    try {
      const { data: shopsData, error } = await supabase
        .from('barbershops')
        .select(`
          id, name, active, blocked_reason, blocked_at, created_at, due_date,
          logo_url, brand_color, text_color, font_family,
          barbershop_settings (cancellation_hours, cancellation_fee_cents, reminder_hours, reminder_message)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const shopsWithStats = await Promise.all(
        (shopsData || []).map(async (shop) => {
          const [barbers, services, appts] = await Promise.all([
            supabase.from('barbers').select('id', { count: 'exact', head: true }).eq('barbershop_id', shop.id),
            supabase.from('services').select('id', { count: 'exact', head: true }).eq('barbershop_id', shop.id),
            supabase.from('appointments').select('id', { count: 'exact', head: true })
              .eq('barbershop_id', shop.id)
              .gte('starts_at', new Date().toISOString().split('T')[0])
              .lte('starts_at', new Date().toISOString().split('T')[0] + 'T23:59:59'),
          ]);

          return {
            ...shop,
            settings: Array.isArray(shop.barbershop_settings)
              ? shop.barbershop_settings[0]
              : shop.barbershop_settings,
            stats: {
              barbers: barbers.count || 0,
              services: services.count || 0,
              appointments_today: appts.count || 0,
            },
          };
        })
      );

      setShops(shopsWithStats as Barbershop[]);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar barbearias");
    }
  };

  const toggleActive = async (shop: Barbershop) => {
    const newActive = !shop.active;

    if (!newActive) {
      const reason = prompt("Motivo do bloqueio:", "Mensalidade em atraso");
      if (!reason) return;

      const { error } = await supabase
        .from('barbershops')
        .update({
          active: false,
          blocked_reason: reason,
          blocked_at: new Date().toISOString()
        })
        .eq('id', shop.id);

      if (error) {
        toast.error("Erro ao bloquear");
        return;
      }
      toast.success(`${shop.name} bloqueada`);
    } else {
      const { error } = await supabase
        .from('barbershops')
        .update({
          active: true,
          blocked_reason: null,
          blocked_at: null
        })
        .eq('id', shop.id);

      if (error) {
        toast.error("Erro ao desbloquear");
        return;
      }
      toast.success(`${shop.name} desbloqueada`);
    }

    loadShops();
  };

  const deleteShop = async (shop: Barbershop) => {
    if (!confirm(`Tem certeza que deseja DELETAR "${shop.name}"?\n\nIsso irá remover TODOS os dados (barbeiros, serviços, agendamentos). Esta ação NÃO pode ser desfeita!`)) return;

    const confirmText = prompt(`Digite o nome da barbearia para confirmar:\n"${shop.name}"`);
    if (confirmText !== shop.name) {
      toast.error("Nome não confere. Operação cancelada.");
      return;
    }

    try {
      await supabase.from('barbershops').delete().eq('id', shop.id);
      toast.success("Barbearia deletada");
      loadShops();
    } catch (e: any) {
      toast.error(e.message || "Erro ao deletar");
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Painel Master</h1>
            <p className="text-muted-foreground text-sm mt-2">Gestão de todas as barbearias</p>
          </div>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pwInput === MASTER_PASSWORD) {
                sessionStorage.setItem("master_auth", MASTER_PASSWORD);
                setAuthorized(true);
              }
            }}
            placeholder="Senha master"
            className="w-full bg-card text-foreground h-14 px-5 rounded-2xl border-2 border-border focus:border-primary outline-none text-base"
          />
          <button
            onClick={() => {
              if (pwInput === MASTER_PASSWORD) {
                sessionStorage.setItem("master_auth", MASTER_PASSWORD);
                setAuthorized(true);
              } else {
                toast.error("Senha incorreta");
                setPwInput("");
              }
            }}
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500"
          >
            Acessar
          </button>
        </div>
      </div>
    );
  }

  const filtered = shops?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Painel Master</h1>
            <p className="text-muted-foreground mt-1">Gerencie todas as barbearias</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("master_auth");
              setAuthorized(false);
            }}
            className="px-4 py-2 rounded-xl bg-card text-muted-foreground hover:bg-card-elevated transition"
          >
            Sair
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total de Barbearias" value={shops?.length || 0} icon={<Building2 className="h-5 w-5" />} />
          <StatCard label="Ativas" value={shops?.filter(s => s.active).length || 0} icon={<Check className="h-5 w-5 text-success" />} color="success" />
          <StatCard label="Bloqueadas" value={shops?.filter(s => !s.active).length || 0} icon={<Lock className="h-5 w-5 text-destructive" />} color="destructive" />
          <StatCard label="Agendamentos Hoje" value={shops?.reduce((sum, s) => sum + (s.stats?.appointments_today || 0), 0) || 0} icon={<Calendar className="h-5 w-5 text-primary" />} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou ID..."
              className="w-full bg-card rounded-2xl pl-12 pr-4 py-3 border border-border focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus className="h-5 w-5" /> Nova Barbearia
          </button>
        </div>

        {/* List */}
        {!shops ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? "Nenhuma barbearia encontrada" : "Nenhuma barbearia cadastrada"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onToggle={() => toggleActive(shop)}
                onDelete={() => deleteShop(shop)}
                onDetails={() => setDetailsModal(shop.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWizard
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadShops(); }}
        />
      )}

      {detailsModal && (
        <DetailsModal
          shopId={detailsModal}
          onClose={() => { setDetailsModal(null); loadShops(); }}
        />
      )}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon, color = "primary" }: {
  label: string; value: number; icon: React.ReactNode; color?: "primary" | "success" | "destructive";
}) {
  const colorMap = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <div className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`h-10 w-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ─── Shop Card ─── */
function ShopCard({ shop, onToggle, onDelete, onDetails }: {
  shop: Barbershop; onToggle: () => void; onDelete: () => void; onDetails: () => void;
}) {
  const [showId, setShowId] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(shop.due_date || "");

  const saveDueDate = async () => {
    try {
      const { error } = await supabase.from('barbershops').update({ due_date: dueDate || null }).eq('id', shop.id);
      if (error) throw error;
      toast.success("Vencimento atualizado");
      setEditingDueDate(false);
      shop.due_date = dueDate || null;
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
    }
  };

  const getDaysUntilDue = () => {
    if (!shop.due_date) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(shop.due_date + 'T00:00:00');
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="bg-card rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{shop.name}</h3>
            {shop.active ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/15 text-success">Ativa</span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">Bloqueada</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => setShowId(!showId)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              {showId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showId ? shop.id : "Ver ID"}
            </button>
            {showId && (
              <button onClick={() => { navigator.clipboard.writeText(shop.id); toast.success("ID copiado!"); }} className="text-xs text-muted-foreground hover:text-primary">
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>

          {!shop.active && shop.blocked_reason && (
            <div className="mt-3 bg-destructive/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive">{shop.blocked_reason}</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="h-4 w-4" />{shop.stats?.barbers || 0} barbeiros</div>
            <div className="flex items-center gap-1"><Scissors className="h-4 w-4" />{shop.stats?.services || 0} servicos</div>
            <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{shop.stats?.appointments_today || 0} hoje</div>
          </div>

          {/* Vencimento */}
          <div className="mt-4">
            {editingDueDate ? (
              <div className="flex items-center gap-2">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-background rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
                <button onClick={saveDueDate} className="px-3 py-2 rounded-xl bg-success text-success-foreground text-sm"><Check className="h-4 w-4" /></button>
                <button onClick={() => { setEditingDueDate(false); setDueDate(shop.due_date || ""); }} className="px-3 py-2 rounded-xl bg-card-elevated text-muted-foreground text-sm"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {shop.due_date ? (
                  <>
                    <span className="text-xs text-muted-foreground">Vencimento: {new Date(shop.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    {daysUntilDue !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        daysUntilDue < 0 ? 'bg-destructive/15 text-destructive' :
                        daysUntilDue <= 3 ? 'bg-warning/15 text-warning' :
                        'bg-success/15 text-success'
                      }`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} dias atrasado` : daysUntilDue === 0 ? 'Vence hoje' : `${daysUntilDue} dias restantes`}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem vencimento definido</span>
                )}
                <button onClick={() => setEditingDueDate(true)} className="text-xs text-primary hover:underline">Editar</button>
              </div>
            )}
          </div>

          {shop.settings && (
            <div className="mt-3 text-xs text-muted-foreground">
              Cancelamento: {shop.settings.cancellation_hours}h, multa {formatBRL(shop.settings.cancellation_fee_cents)}
              {shop.settings.reminder_hours !== undefined && (
                <> | Lembrete: {shop.settings.reminder_hours === 0 ? "desativado" : `${shop.settings.reminder_hours}h antes`}</>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onDetails} className="px-4 py-2 rounded-xl bg-background hover:bg-card-elevated transition text-sm">Detalhes</button>
          <button onClick={onToggle} className={`px-4 py-2 rounded-xl transition text-sm font-medium ${shop.active ? "bg-destructive/15 text-destructive hover:bg-destructive/25" : "bg-success/15 text-success hover:bg-success/25"}`}>
            {shop.active ? <><Lock className="h-4 w-4 inline mr-1" /> Bloquear</> : <><Unlock className="h-4 w-4 inline mr-1" /> Desbloquear</>}
          </button>
          <button onClick={onDelete} className="px-4 py-2 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 transition text-sm">Deletar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Wizard (multi-step) ─── */
type WizardBarber = { name: string; days: Record<number, { active: boolean; start: string; end: string }> };
type WizardService = { name: string; duration: number; price: string };

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Padrao)" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Oswald", label: "Oswald" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Roboto", label: "Roboto" },
  { value: "Raleway", label: "Raleway" },
  { value: "Lora", label: "Lora" },
  { value: "Dancing Script", label: "Dancing Script" },
];

function CreateWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6;
  const [saving, setSaving] = useState(false);

  // Step 1: Info basica
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Step 2: Aparencia
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState("#C9A84C");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3: Cancelamento
  const [cancelHours, setCancelHours] = useState(2);
  const [cancelFee, setCancelFee] = useState("20.00");

  // Step 4: Lembretes
  const [reminderHours, setReminderHours] = useState(2);
  const DEFAULT_MSG = "Ola! Lembrete: voce tem {servico} com {barbeiro} agendado para {horario} ({data}). Te esperamos!";
  const [reminderMessage, setReminderMessage] = useState(DEFAULT_MSG);

  // Load Google Font for preview
  useEffect(() => {
    if (fontFamily && fontFamily !== "Inter") {
      const id = `gfont-${fontFamily.replace(/\s+/g, "-")}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id; link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [fontFamily]);

  // Step 4: Barbeiros
  const defaultDays = (): Record<number, { active: boolean; start: string; end: string }> => {
    const d: Record<number, { active: boolean; start: string; end: string }> = {};
    for (let i = 0; i < 7; i++) d[i] = { active: i >= 1 && i <= 6, start: "09:00", end: "19:00" };
    return d;
  };
  const [barbers, setBarbers] = useState<WizardBarber[]>([{ name: "", days: defaultDays() }]);

  // Step 5: Servicos
  const [services, setServices] = useState<WizardService[]>([{ name: "", duration: 30, price: "35.00" }]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Maximo 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `temp/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("barbershop-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("barbershop-logos").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast.success("Logo enviado!");
    } catch (err: any) { toast.error(err.message || "Erro ao enviar"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return barbers.some(b => b.name.trim().length > 0);
    if (step === 6) return services.some(s => s.name.trim().length > 0);
    return true;
  };

  const next = () => { if (step < TOTAL_STEPS && canNext()) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); };

  const addBarber = () => setBarbers([...barbers, { name: "", days: defaultDays() }]);
  const removeBarber = (idx: number) => { if (barbers.length > 1) setBarbers(barbers.filter((_, i) => i !== idx)); };
  const updateBarber = (idx: number, field: Partial<WizardBarber>) => {
    const updated = [...barbers];
    updated[idx] = { ...updated[idx], ...field };
    setBarbers(updated);
  };

  const addService = () => setServices([...services, { name: "", duration: 30, price: "35.00" }]);
  const removeService = (idx: number) => { if (services.length > 1) setServices(services.filter((_, i) => i !== idx)); };
  const updateService = (idx: number, field: Partial<WizardService>) => {
    const updated = [...services];
    updated[idx] = { ...updated[idx], ...field };
    setServices(updated);
  };

  const finish = async () => {
    setSaving(true);
    try {
      const slug = name.trim().toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // 1. Create barbershop with branding
      const { data: shop, error: shopErr } = await supabase
        .from('barbershops')
        .insert({
          name: name.trim(),
          slug: slug || crypto.randomUUID().slice(0, 8),
          active: true,
          due_date: dueDate || null,
          logo_url: logoUrl,
          brand_color: brandColor,
          text_color: textColor,
          font_family: fontFamily,
        })
        .select('id, name').single();
      if (shopErr) throw shopErr;

      // 2. Create settings
      const feeNum = parseFloat(cancelFee.replace(",", ".")) || 0;
      const { error: settErr } = await supabase.from('barbershop_settings').insert({
        barbershop_id: shop.id,
        cancellation_hours: cancelHours,
        cancellation_fee_cents: Math.round(feeNum * 100),
        reminder_hours: reminderHours,
        reminder_message: reminderMessage.trim() || DEFAULT_MSG,
      });
      if (settErr) throw settErr;

      // 3. Create barbers + working hours
      const validBarbers = barbers.filter(b => b.name.trim().length > 0);
      for (const b of validBarbers) {
        const { data: barber, error: bErr } = await supabase
          .from('barbers')
          .insert({ barbershop_id: shop.id, name: b.name.trim(), active: true })
          .select('id').single();
        if (bErr) throw bErr;

        const hours = Object.entries(b.days)
          .filter(([, v]) => v.active)
          .map(([day, v]) => ({ barber_id: barber.id, day_of_week: Number(day), start_time: v.start, end_time: v.end }));
        if (hours.length > 0) {
          const { error: hErr } = await supabase.from('working_hours').insert(hours);
          if (hErr) throw hErr;
        }
      }

      // 4. Create services
      const validServices = services.filter(s => s.name.trim().length > 0);
      if (validServices.length > 0) {
        const { error: sErr } = await supabase.from('services').insert(
          validServices.map(s => ({
            barbershop_id: shop.id,
            name: s.name.trim(),
            duration_minutes: s.duration,
            price_cents: Math.round((parseFloat(s.price.replace(",", ".")) || 0) * 100),
          }))
        );
        if (sErr) throw sErr;
      }

      toast.success(`${shop.name} criada com sucesso! Tudo configurado.`);
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar barbearia");
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ["Dados", "Aparencia", "Cancelamento", "Lembretes", "Barbeiros", "Servicos"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Nova Barbearia</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-background flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-6">
          {stepLabels.map((label, idx) => (
            <div key={idx} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${idx + 1 <= step ? "bg-primary" : "bg-border"}`} />
              <p className={`text-[10px] mt-1 text-center transition-colors ${idx + 1 === step ? "text-primary font-semibold" : "text-muted-foreground"}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-4 min-h-[200px]">
          {step === 1 && (
            <>
              <WizField label="Nome da Barbearia">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Barbearia do Joao" className="w-full bg-background rounded-xl px-4 py-3 border border-border focus:border-primary outline-none" autoFocus />
              </WizField>
              <WizField label="Data de vencimento (opcional)">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-background rounded-xl px-4 py-3 border border-border focus:border-primary outline-none" />
              </WizField>
            </>
          )}

          {step === 2 && (
            <>
              <WizField label="Logotipo">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative">
                      <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-2xl object-cover border-2 border-border" />
                      <button onClick={() => setLogoUrl(null)} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-background border-2 border-dashed border-border flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-xl bg-background text-sm border border-border hover:border-primary transition flex items-center gap-2 disabled:opacity-50">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {logoUrl ? "Trocar" : "Enviar logo"}
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, SVG. Max 5MB.</p>
                  </div>
                </div>
              </WizField>
              <WizField label="Cores da marca">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Cor principal</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-9 rounded-lg border border-border cursor-pointer" style={{ padding: 0 }} />
                      <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="flex-1 bg-background rounded-xl px-3 py-2 text-xs border border-border focus:border-primary outline-none font-mono uppercase" maxLength={7} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Cor do texto</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-9 rounded-lg border border-border cursor-pointer" style={{ padding: 0 }} />
                      <input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1 bg-background rounded-xl px-3 py-2 text-xs border border-border focus:border-primary outline-none font-mono uppercase" maxLength={7} />
                    </div>
                  </div>
                </div>
              </WizField>
              <WizField label="Fonte do nome">
                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                  {FONT_OPTIONS.map(f => (
                    <button key={f.value} onClick={() => setFontFamily(f.value)} className={`px-2 py-2 rounded-xl text-xs transition border ${fontFamily === f.value ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-background text-muted-foreground"}`} style={{ fontFamily: `"${f.value}", sans-serif` }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </WizField>
              {/* Mini preview */}
              <div className="bg-background rounded-xl p-4 flex flex-col items-center border border-border">
                {logoUrl ? <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover mb-2" /> : (
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-2" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}>
                    <Scissors className="h-6 w-6" style={{ color: textColor }} />
                  </div>
                )}
                <p className="text-lg font-bold" style={{ fontFamily: `"${fontFamily}", sans-serif`, color: brandColor }}>{name || "Nome da Barbearia"}</p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <WizField label="Prazo minimo para cancelamento (horas)">
                <input type="number" value={cancelHours} onChange={(e) => setCancelHours(Number(e.target.value))} min={0} className="w-full bg-background rounded-xl px-4 py-3 border border-border focus:border-primary outline-none" />
              </WizField>
              <WizField label="Valor da multa (R$)">
                <input value={cancelFee} onChange={(e) => setCancelFee(e.target.value)} placeholder="20.00" className="w-full bg-background rounded-xl px-4 py-3 border border-border focus:border-primary outline-none" />
              </WizField>
              <div className="bg-primary/10 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  Cancelamentos com menos de {cancelHours}h de antecedencia
                  {parseFloat(cancelFee) > 0 ? ` geram cobranca de R$${parseFloat(cancelFee.replace(",", ".")).toFixed(2)}` : " nao geram penalidade"}.
                </p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <WizField label="Antecedencia do lembrete (horas)">
                <div className="flex items-center gap-3">
                  <input type="number" value={reminderHours} onChange={(e) => setReminderHours(Number(e.target.value))} min={0} className="w-24 bg-background rounded-xl px-4 py-3 border border-border focus:border-primary outline-none text-center font-semibold" />
                  <span className="text-sm text-muted-foreground">horas antes (0 = desativado)</span>
                </div>
              </WizField>
              <WizField label="Mensagem personalizada">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["{servico}", "{barbeiro}", "{horario}", "{data}", "{barbearia}"].map((ph) => (
                    <button key={ph} onClick={() => setReminderMessage(prev => prev + ph)} className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-mono font-medium hover:bg-primary/25 transition">{ph}</button>
                  ))}
                </div>
                <textarea value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} rows={3} className="w-full bg-background rounded-xl px-4 py-3 text-sm border border-border focus:border-primary outline-none resize-none" />
                <button onClick={() => setReminderMessage(DEFAULT_MSG)} className="text-xs text-muted-foreground hover:text-primary underline mt-1">Restaurar padrao</button>
              </WizField>
              <div className="bg-background rounded-xl p-3 border border-border">
                <p className="text-xs font-semibold text-foreground mb-1">Pre-visualizacao:</p>
                <p className="text-xs text-muted-foreground">
                  {reminderMessage.replace("{servico}", "Corte + Barba").replace("{barbeiro}", "Carlos").replace("{horario}", "14:30").replace("{data}", "seg 26/05").replace("{barbearia}", name || "Barbearia")}
                </p>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <p className="text-xs text-muted-foreground">Adicione os barbeiros e defina os horarios de trabalho de cada um.</p>
              {barbers.map((b, idx) => (
                <div key={idx} className="bg-background rounded-2xl p-4 space-y-3 border border-border">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary flex-shrink-0" />
                    <input value={b.name} onChange={(e) => updateBarber(idx, { name: e.target.value })} placeholder={`Barbeiro ${idx + 1}`} className="flex-1 bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
                    {barbers.length > 1 && (
                      <button onClick={() => removeBarber(idx)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((day, d) => (
                      <button key={d} onClick={() => {
                        const updated = { ...b.days };
                        updated[d] = { ...updated[d], active: !updated[d].active };
                        updateBarber(idx, { days: updated });
                      }} className={`py-1.5 rounded-lg text-xs font-medium transition ${b.days[d].active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <input type="time" value={b.days[1]?.start || "09:00"} onChange={(e) => {
                      const updated = { ...b.days };
                      Object.keys(updated).forEach(k => { updated[Number(k)].start = e.target.value; });
                      updateBarber(idx, { days: updated });
                    }} className="bg-card rounded-lg px-2 py-1 border border-border text-xs" />
                    <span>ate</span>
                    <input type="time" value={b.days[1]?.end || "19:00"} onChange={(e) => {
                      const updated = { ...b.days };
                      Object.keys(updated).forEach(k => { updated[Number(k)].end = e.target.value; });
                      updateBarber(idx, { days: updated });
                    }} className="bg-card rounded-lg px-2 py-1 border border-border text-xs" />
                  </div>
                </div>
              ))}
              <button onClick={addBarber} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary hover:text-primary transition flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar barbeiro
              </button>
            </>
          )}

          {step === 6 && (
            <>
              <p className="text-xs text-muted-foreground">Cadastre os servicos oferecidos pela barbearia.</p>
              {services.map((s, idx) => (
                <div key={idx} className="bg-background rounded-2xl p-4 space-y-3 border border-border">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary flex-shrink-0" />
                    <input value={s.name} onChange={(e) => updateService(idx, { name: e.target.value })} placeholder="Ex: Corte + Barba" className="flex-1 bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
                    {services.length > 1 && (
                      <button onClick={() => removeService(idx)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Duracao (min)</label>
                      <input type="number" value={s.duration} onChange={(e) => updateService(idx, { duration: Number(e.target.value) })} min={5} step={5} className="w-full bg-card rounded-xl px-3 py-2 mt-1 text-sm border border-border focus:border-primary outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Preco (R$)</label>
                      <input value={s.price} onChange={(e) => updateService(idx, { price: e.target.value })} placeholder="35.00" className="w-full bg-card rounded-xl px-3 py-2 mt-1 text-sm border border-border focus:border-primary outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addService} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary hover:text-primary transition flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar servico
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={prev} className="flex-1 py-3.5 rounded-xl bg-background text-muted-foreground font-semibold flex items-center justify-center gap-2 hover:bg-card-elevated transition">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={next} disabled={!canNext()} className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              Proximo <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving || !canNext()} className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Criando..." : "Criar Barbearia"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WizField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/* ─── Details Modal (enhanced) ─── */
function DetailsModal({ shopId, onClose }: { shopId: string; onClose: () => void }) {
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "branding" | "barbers" | "services" | "settings">("info");
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    const [shopRes, barbersRes, servicesRes] = await Promise.all([
      supabase.from('barbershops').select(`id, name, active, blocked_reason, blocked_at, created_at, due_date, barbershop_settings (cancellation_hours, cancellation_fee_cents, reminder_hours, reminder_message)`).eq('id', shopId).single(),
      supabase.from('barbers').select('id, name, photo_url, active').eq('barbershop_id', shopId).order('name'),
      supabase.from('services').select('id, name, duration_minutes, price_cents').eq('barbershop_id', shopId).order('name'),
    ]);
    if (shopRes.data) {
      setShop({
        ...shopRes.data,
        settings: Array.isArray(shopRes.data.barbershop_settings) ? shopRes.data.barbershop_settings[0] : shopRes.data.barbershop_settings,
      } as Barbershop);
    }
    setBarbers((barbersRes.data as BarberItem[]) || []);
    setServices((servicesRes.data as ServiceItem[]) || []);
    setLoadingData(false);
  }, [shopId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (!shop || loadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{shop.name}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-background flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-background rounded-xl p-1 overflow-x-auto">
          {([
            { key: "info", label: "Info", icon: Building2 },
            { key: "branding", label: "Aparencia", icon: Palette },
            { key: "barbers", label: "Barbeiros", icon: Users },
            { key: "services", label: "Servicos", icon: Scissors },
            { key: "settings", label: "Config", icon: Bell },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setDetailTab(key)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 flex-shrink-0 ${detailTab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {detailTab === "info" && <InfoTab shop={shop} />}
        {detailTab === "branding" && <BrandingTab shop={shop} onRefresh={loadAll} />}
        {detailTab === "barbers" && <BarbersTab shopId={shopId} barbers={barbers} onRefresh={loadAll} />}
        {detailTab === "services" && <ServicesTab shopId={shopId} services={services} onRefresh={loadAll} />}
        {detailTab === "settings" && <SettingsTab shop={shop} onRefresh={loadAll} />}
      </div>
    </div>
  );
}

/* ── Info Tab ── */
/* ── Branding Tab ── */
function BrandingTab({ shop, onRefresh }: { shop: Barbershop; onRefresh: () => void }) {
  const [shopName, setShopName] = useState(shop.name);
  const [logoUrl, setLogoUrl] = useState(shop.logo_url);
  const [brandColor, setBrandColor] = useState(shop.brand_color || "#C9A84C");
  const [textColor, setTextColor] = useState(shop.text_color || "#FFFFFF");
  const [fontFamily, setFontFamily] = useState(shop.font_family || "Inter");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fontFamily && fontFamily !== "Inter") {
      const id = `gfont-${fontFamily.replace(/\s+/g, "-")}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id; link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [fontFamily]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Maximo 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${shop.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("barbershop-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("barbershop-logos").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast.success("Logo enviado!");
    } catch (err: any) { toast.error(err.message || "Erro ao enviar"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const save = async () => {
    if (!shopName.trim()) { toast.error("Nome obrigatorio"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("barbershops").update({
        name: shopName.trim(), logo_url: logoUrl, brand_color: brandColor, text_color: textColor, font_family: fontFamily,
      }).eq("id", shop.id);
      if (error) throw error;
      toast.success("Aparencia salva!");
      onRefresh();
    } catch (err: any) { toast.error(err.message || "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Logo */}
      <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Logotipo</p>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative">
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-2xl object-cover border-2 border-border" />
              <button onClick={() => setLogoUrl(null)} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center">
              <Scissors className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-xl bg-card text-sm border border-border hover:border-primary transition flex items-center gap-2 disabled:opacity-50">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {logoUrl ? "Trocar" : "Enviar"}
            </button>
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold"><Pencil className="h-3.5 w-3.5 inline mr-1" /> Nome</p>
        <input value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
      </div>

      {/* Cores */}
      <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold"><Palette className="h-3.5 w-3.5 inline mr-1" /> Cores</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground">Principal</label>
            <div className="flex items-center gap-1.5 mt-1">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-8 w-8 rounded-lg border border-border cursor-pointer" style={{ padding: 0 }} />
              <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="flex-1 bg-card rounded-lg px-2 py-1.5 text-[10px] border border-border outline-none font-mono uppercase" maxLength={7} />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground">Texto</label>
            <div className="flex items-center gap-1.5 mt-1">
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 rounded-lg border border-border cursor-pointer" style={{ padding: 0 }} />
              <input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1 bg-card rounded-lg px-2 py-1.5 text-[10px] border border-border outline-none font-mono uppercase" maxLength={7} />
            </div>
          </div>
        </div>
      </div>

      {/* Fonte */}
      <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Fonte</p>
        <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto">
          {FONT_OPTIONS.map(f => (
            <button key={f.value} onClick={() => setFontFamily(f.value)} className={`px-2 py-1.5 rounded-lg text-xs transition border ${fontFamily === f.value ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-muted-foreground"}`} style={{ fontFamily: `"${f.value}", sans-serif` }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-background rounded-xl p-4 flex flex-col items-center border border-border">
        {logoUrl ? <img src={logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover mb-2" /> : (
          <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-2" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}>
            <Scissors className="h-7 w-7" style={{ color: textColor }} />
          </div>
        )}
        <p className="text-xl font-bold" style={{ fontFamily: `"${fontFamily}", sans-serif`, color: brandColor }}>{shopName || "Nome"}</p>
        <div className="mt-3 px-6 py-1.5 rounded-lg text-xs font-bold" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`, color: textColor }}>
          Entrar Agora
        </div>
      </div>

      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar Aparencia
      </button>
    </div>
  );
}

function InfoTab({ shop }: { shop: Barbershop }) {
  return (
    <div className="space-y-3">
      <DetailRow label="ID" value={shop.id} mono copyable />
      <DetailRow label="Status" value={shop.active ? "Ativa" : "Bloqueada"} />
      {shop.blocked_reason && <DetailRow label="Motivo do Bloqueio" value={shop.blocked_reason} />}
      {shop.due_date && (
        <DetailRow label="Vencimento" value={new Date(shop.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />
      )}
      <DetailRow label="Criada em" value={new Date(shop.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />

      <div className="border-t border-border pt-3 mt-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Links de Acesso</p>
      </div>
      <DetailRow label="Painel Admin" value={`${window.location.origin}/admin?shop=${shop.id}`} copyable />
      <DetailRow label="App Cliente" value={`${window.location.origin}/app?shop=${shop.id}`} copyable />
    </div>
  );
}

/* ── Barbers Tab ── */
function BarbersTab({ shopId, barbers, onRefresh }: { shopId: string; barbers: BarberItem[]; onRefresh: () => void }) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const addBarber = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('barbers').insert({ barbershop_id: shopId, name: newName.trim(), active: true });
      if (error) throw error;
      toast.success("Barbeiro adicionado");
      setNewName("");
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setAdding(false); }
  };

  const toggleBarber = async (b: BarberItem) => {
    const { error } = await supabase.from('barbers').update({ active: !b.active }).eq('id', b.id);
    if (error) { toast.error("Erro"); return; }
    toast.success(b.active ? "Barbeiro desativado" : "Barbeiro ativado");
    onRefresh();
  };

  const deleteBarber = async (b: BarberItem) => {
    if (!confirm(`Remover ${b.name}?`)) return;
    const { error } = await supabase.from('barbers').delete().eq('id', b.id);
    if (error) { toast.error(error.message || "Erro ao remover"); return; }
    toast.success("Barbeiro removido");
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {barbers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum barbeiro cadastrado</p>
      ) : (
        barbers.map(b => (
          <div key={b.id} className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${b.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {b.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{b.name}</p>
                <p className={`text-xs ${b.active ? "text-success" : "text-muted-foreground"}`}>{b.active ? "Ativo" : "Inativo"}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggleBarber(b)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${b.active ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                {b.active ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => deleteBarber(b)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/15 text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))
      )}
      <div className="flex gap-2 mt-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do barbeiro" onKeyDown={(e) => e.key === "Enter" && addBarber()} className="flex-1 bg-background rounded-xl px-4 py-2.5 text-sm border border-border focus:border-primary outline-none" />
        <button onClick={addBarber} disabled={adding || !newName.trim()} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Adicionar
        </button>
      </div>
    </div>
  );
}

/* ── Services Tab ── */
function ServicesTab({ shopId, services, onRefresh }: { shopId: string; services: ServiceItem[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState(30);
  const [newPrice, setNewPrice] = useState("35.00");
  const [adding, setAdding] = useState(false);

  const addService = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const price = Math.round((parseFloat(newPrice.replace(",", ".")) || 0) * 100);
      const { error } = await supabase.from('services').insert({
        barbershop_id: shopId, name: newName.trim(), duration_minutes: newDuration, price_cents: price,
      });
      if (error) throw error;
      toast.success("Servico adicionado");
      setNewName(""); setNewDuration(30); setNewPrice("35.00"); setShowAdd(false);
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setAdding(false); }
  };

  const deleteService = async (s: ServiceItem) => {
    if (!confirm(`Remover ${s.name}?`)) return;
    const { error } = await supabase.from('services').delete().eq('id', s.id);
    if (error) { toast.error(error.message || "Erro ao remover"); return; }
    toast.success("Servico removido");
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum servico cadastrado</p>
      ) : (
        services.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.duration_minutes}min - {formatBRL(s.price_cents)}</p>
            </div>
            <button onClick={() => deleteService(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/15 text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))
      )}

      {showAdd ? (
        <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do servico" className="w-full bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Duracao (min)</label>
              <input type="number" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} min={5} step={5} className="w-full bg-card rounded-xl px-3 py-2 mt-1 text-sm border border-border focus:border-primary outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Preco (R$)</label>
              <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full bg-card rounded-xl px-3 py-2 mt-1 text-sm border border-border focus:border-primary outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl bg-card text-muted-foreground text-sm">Cancelar</button>
            <button onClick={addService} disabled={adding || !newName.trim()} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Salvar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary hover:text-primary transition flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar servico
        </button>
      )}
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab({ shop, onRefresh }: { shop: Barbershop; onRefresh: () => void }) {
  const [cancelHours, setCancelHours] = useState(shop.settings?.cancellation_hours ?? 2);
  const [cancelFee, setCancelFee] = useState(((shop.settings?.cancellation_fee_cents ?? 0) / 100).toFixed(2));
  const [reminderHours, setReminderHours] = useState(shop.settings?.reminder_hours ?? 2);
  const DEFAULT_MSG = "Ola! Lembrete: voce tem {servico} com {barbeiro} agendado para {horario} ({data}). Te esperamos!";
  const [reminderMessage, setReminderMessage] = useState(shop.settings?.reminder_message || DEFAULT_MSG);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const feeNum = parseFloat(cancelFee.replace(",", ".")) || 0;
      const { error } = await supabase.from('barbershop_settings').upsert({
        barbershop_id: shop.id,
        cancellation_hours: cancelHours,
        cancellation_fee_cents: Math.round(feeNum * 100),
        reminder_hours: reminderHours,
        reminder_message: reminderMessage.trim() || DEFAULT_MSG,
        updated_at: new Date().toISOString(),
      }, { onConflict: "barbershop_id" });
      if (error) throw error;
      toast.success("Configuracoes salvas!");
      onRefresh();
    } catch (e: any) { toast.error(e.message || "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const previewMsg = reminderMessage
    .replace("{servico}", "Corte + Barba").replace("{barbeiro}", "Carlos")
    .replace("{horario}", "14:30").replace("{data}", "seg 26/05").replace("{barbearia}", shop.name);

  return (
    <div className="space-y-4">
      {/* Cancelamento */}
      <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Cancelamento</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Prazo (horas)</label>
            <input type="number" value={cancelHours} onChange={(e) => setCancelHours(Number(e.target.value))} min={0} className="w-full bg-card rounded-xl px-3 py-2 mt-1 text-sm border border-border focus:border-primary outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Multa (R$)</label>
            <input value={cancelFee} onChange={(e) => setCancelFee(e.target.value)} className="w-full bg-card rounded-xl px-3 py-2 mt-1 text-sm border border-border focus:border-primary outline-none" />
          </div>
        </div>
      </div>

      {/* Lembretes */}
      <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Lembrete automatico</p>
        <div className="flex items-center gap-3">
          <input type="number" value={reminderHours} onChange={(e) => setReminderHours(Number(e.target.value))} min={0} className="w-20 bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none text-center font-semibold" />
          <span className="text-xs text-muted-foreground">horas antes (0 = desativado)</span>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Mensagem personalizada</label>
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            {["{servico}", "{barbeiro}", "{horario}", "{data}", "{barbearia}"].map((ph) => (
              <button key={ph} onClick={() => setReminderMessage(prev => prev + ph)} className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary text-[10px] font-mono font-medium hover:bg-primary/25 transition">{ph}</button>
            ))}
          </div>
          <textarea value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} rows={2} className="w-full bg-card rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none resize-none" />
          <button onClick={() => setReminderMessage(DEFAULT_MSG)} className="text-[10px] text-muted-foreground hover:text-primary underline mt-1">Restaurar padrao</button>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-[10px] font-semibold text-foreground mb-0.5">Pre-visualizacao:</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{previewMsg}</p>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar Configuracoes
      </button>
    </div>
  );
}

/* ─── Shared Components ─── */
function DetailRow({ label, value, mono, copyable }: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
        {copyable && (
          <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Copiado!"); }} className="text-muted-foreground hover:text-primary">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
