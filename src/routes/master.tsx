import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Lock, Unlock, Plus, Search, Building2, Calendar, 
  DollarSign, Users, Loader2, X, Check, AlertTriangle,
  Eye, EyeOff, Copy
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
  settings?: {
    cancellation_hours: number;
    cancellation_fee_cents: number;
  } | null;
  stats?: {
    barbers: number;
    services: number;
    appointments_today: number;
  };
};

const MASTER_PASSWORD = "master2026";

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
          barbershop_settings (cancellation_hours, cancellation_fee_cents)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Busca estatísticas de cada barbearia
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
      // Deleta tudo em cascata
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
          <StatCard 
            label="Total de Barbearias" 
            value={shops?.length || 0}
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard 
            label="Ativas" 
            value={shops?.filter(s => s.active).length || 0}
            icon={<Check className="h-5 w-5 text-success" />}
            color="success"
          />
          <StatCard 
            label="Bloqueadas" 
            value={shops?.filter(s => !s.active).length || 0}
            icon={<Lock className="h-5 w-5 text-destructive" />}
            color="destructive"
          />
          <StatCard 
            label="Agendamentos Hoje" 
            value={shops?.reduce((sum, s) => sum + (s.stats?.appointments_today || 0), 0) || 0}
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
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
        <CreateModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => { setShowCreateModal(false); loadShops(); }}
        />
      )}

      {detailsModal && (
        <DetailsModal 
          shopId={detailsModal}
          onClose={() => setDetailsModal(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = "primary" }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  color?: "primary" | "success" | "destructive";
}) {
  const colorMap = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`h-10 w-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ShopCard({ shop, onToggle, onDelete, onDetails }: { 
  shop: Barbershop; 
  onToggle: () => void;
  onDelete: () => void;
  onDetails: () => void;
}) {
  const [showId, setShowId] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(shop.due_date || "");

  const saveDueDate = async () => {
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ due_date: dueDate || null })
        .eq('id', shop.id);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(shop.due_date + 'T00:00:00');
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="bg-card rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{shop.name}</h3>
            {shop.active ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                Ativa
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
                Bloqueada
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button 
              onClick={() => setShowId(!showId)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {showId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showId ? shop.id : "Ver ID"}
            </button>
            {showId && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shop.id);
                  toast.success("ID copiado!");
                }}
                className="text-xs text-muted-foreground hover:text-primary"
              >
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
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {shop.stats?.barbers || 0} barbeiros
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {shop.stats?.services || 0} serviços
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {shop.stats?.appointments_today || 0} agendamentos hoje
            </div>
          </div>

          {/* Vencimento */}
          <div className="mt-4">
            {editingDueDate ? (
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-background rounded-xl px-3 py-2 text-sm border border-border focus:border-primary outline-none"
                />
                <button 
                  onClick={saveDueDate}
                  className="px-3 py-2 rounded-xl bg-success text-success-foreground text-sm"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => { setEditingDueDate(false); setDueDate(shop.due_date || ""); }}
                  className="px-3 py-2 rounded-xl bg-card-elevated text-muted-foreground text-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {shop.due_date ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Vencimento: {new Date(shop.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    {daysUntilDue !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        daysUntilDue < 0 ? 'bg-destructive/15 text-destructive' :
                        daysUntilDue <= 3 ? 'bg-warning/15 text-warning' :
                        'bg-success/15 text-success'
                      }`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} dias atrasado` :
                         daysUntilDue === 0 ? 'Vence hoje' :
                         `${daysUntilDue} dias restantes`}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem vencimento definido</span>
                )}
                <button 
                  onClick={() => setEditingDueDate(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          {shop.settings && (
            <div className="mt-3 text-xs text-muted-foreground">
              Política: {shop.settings.cancellation_hours}h de prazo, 
              multa de {formatBRL(shop.settings.cancellation_fee_cents)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onDetails}
            className="px-4 py-2 rounded-xl bg-background hover:bg-card-elevated transition text-sm"
          >
            Detalhes
          </button>
          <button 
            onClick={onToggle}
            className={`px-4 py-2 rounded-xl transition text-sm font-medium ${
              shop.active 
                ? "bg-destructive/15 text-destructive hover:bg-destructive/25" 
                : "bg-success/15 text-success hover:bg-success/25"
            }`}
          >
            {shop.active ? <><Lock className="h-4 w-4 inline mr-1" /> Bloquear</> : <><Unlock className="h-4 w-4 inline mr-1" /> Desbloquear</>}
          </button>
          <button 
            onClick={onDelete}
            className="px-4 py-2 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 transition text-sm"
          >
            Deletar
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [hours, setHours] = useState(2);
  const [fee, setFee] = useState("20.00");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome da barbearia");
      return;
    }

    const feeNum = parseFloat(fee.replace(",", "."));
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error("Valor de multa inválido");
      return;
    }

    setSaving(true);
    try {
      // Gera slug a partir do nome
      const slug = name.trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-')      // Substitui não-alfanuméricos por -
        .replace(/^-+|-+$/g, '');          // Remove - do início/fim

      // Cria barbearia
      const { data: shop, error: shopError } = await supabase
        .from('barbershops')
        .insert({ 
          name: name.trim(), 
          slug: slug || crypto.randomUUID().slice(0, 8),
          active: true 
        })
        .select('id, name')
        .single();

      if (shopError) throw shopError;

      // Cria configurações
      const { error: settingsError } = await supabase
        .from('barbershop_settings')
        .insert({
          barbershop_id: shop.id,
          cancellation_hours: hours,
          cancellation_fee_cents: Math.round(feeNum * 100),
        });

      if (settingsError) throw settingsError;

      toast.success(`${shop.name} criada com sucesso!`);
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar barbearia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-card rounded-3xl p-6 space-y-5" 
        style={{ boxShadow: "var(--shadow-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nova Barbearia</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-background flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Nome da Barbearia
            </label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Barbearia do João"
              className="w-full bg-background rounded-xl px-4 py-3 mt-2 border border-border focus:border-primary outline-none"
            />
          </div>

          <div className="bg-background rounded-2xl p-4 space-y-4">
            <p className="text-sm font-semibold">Política de Cancelamento</p>
            
            <div>
              <label className="text-xs text-muted-foreground">Prazo mínimo (horas)</label>
              <input 
                type="number"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                min={0}
                className="w-full bg-card rounded-xl px-4 py-2 mt-1 border border-border focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Valor da multa (R$)</label>
              <input 
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="20.00"
                className="w-full bg-card rounded-xl px-4 py-2 mt-1 border border-border focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={create}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar Barbearia
        </button>
      </div>
    </div>
  );
}

function DetailsModal({ shopId, onClose }: { shopId: string; onClose: () => void }) {
  const [shop, setShop] = useState<Barbershop | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('barbershops')
        .select(`
          id, name, active, blocked_reason, blocked_at, created_at, due_date,
          barbershop_settings (cancellation_hours, cancellation_fee_cents)
        `)
        .eq('id', shopId)
        .single();

      if (data) {
        setShop({
          ...data,
          settings: Array.isArray(data.barbershop_settings) 
            ? data.barbershop_settings[0] 
            : data.barbershop_settings,
        } as Barbershop);
      }
    })();
  }, [shopId]);

  if (!shop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-card rounded-3xl p-6 space-y-5" 
        style={{ boxShadow: "var(--shadow-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{shop.name}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-background flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <DetailRow label="ID" value={shop.id} mono />
          <DetailRow label="Status" value={shop.active ? "Ativa" : "Bloqueada"} />
          {shop.blocked_reason && <DetailRow label="Motivo do Bloqueio" value={shop.blocked_reason} />}
          {shop.due_date && (
            <DetailRow 
              label="Vencimento" 
              value={new Date(shop.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { 
                day: '2-digit', month: 'long', year: 'numeric' 
              })} 
            />
          )}
          <DetailRow 
            label="Criada em" 
            value={new Date(shop.created_at).toLocaleDateString('pt-BR', { 
              day: '2-digit', month: 'long', year: 'numeric' 
            })} 
          />
          
          {shop.settings && (
            <>
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">
                  Política de Cancelamento
                </p>
              </div>
              <DetailRow label="Prazo mínimo" value={`${shop.settings.cancellation_hours} horas`} />
              <DetailRow label="Valor da multa" value={formatBRL(shop.settings.cancellation_fee_cents)} />
            </>
          )}

          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">
              Links de Acesso
            </p>
          </div>
          <DetailRow 
            label="Painel Admin" 
            value={`${window.location.origin}/admin`}
            copyable
          />
          <DetailRow 
            label="App Cliente" 
            value={`${window.location.origin}/app`}
            copyable
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, copyable }: { 
  label: string; 
  value: string; 
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </span>
        {copyable && (
          <button 
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Copiado!");
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
