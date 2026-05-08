import { supabase } from "@/integrations/supabase/client";

let cachedShopId: string | null = null;
const SHOP_ID_KEY = "barberpro_shop_id";

/**
 * Obtém o ID da barbearia de 3 fontes (em ordem de prioridade):
 * 1. URL parameter (?shop=uuid)
 * 2. localStorage (salvo anteriormente)
 * 3. Primeira barbearia ativa no banco
 */
export async function getBarbershopId(): Promise<string> {
  // Se já tem em cache, retorna
  if (cachedShopId) return cachedShopId;

  // 1. Tenta pegar da URL (?shop=uuid)
  const urlParams = new URLSearchParams(window.location.search);
  const shopFromUrl = urlParams.get("shop");
  
  if (shopFromUrl) {
    // Valida se o UUID existe no banco
    const { data } = await supabase
      .from("barbershops")
      .select("id")
      .eq("id", shopFromUrl)
      .single();
    
    if (data) {
      cachedShopId = data.id;
      // Salva no localStorage para próximas visitas
      localStorage.setItem(SHOP_ID_KEY, data.id);
      return data.id;
    }
  }

  // 2. Tenta pegar do localStorage
  const shopFromStorage = localStorage.getItem(SHOP_ID_KEY);
  if (shopFromStorage) {
    // Valida se ainda existe
    const { data } = await supabase
      .from("barbershops")
      .select("id")
      .eq("id", shopFromStorage)
      .single();
    
    if (data) {
      cachedShopId = data.id;
      return data.id;
    } else {
      // ID não existe mais, limpa localStorage
      localStorage.removeItem(SHOP_ID_KEY);
    }
  }

  // 3. Busca primeira barbearia ativa
  const { data, error } = await supabase
    .from("barbershops")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Nenhuma barbearia encontrada. Acesse via link do painel master.");
  }

  cachedShopId = data.id;
  localStorage.setItem(SHOP_ID_KEY, data.id);
  return data.id;
}

/**
 * Limpa o ID salvo (útil para trocar de barbearia)
 */
export function clearBarbershopId() {
  cachedShopId = null;
  localStorage.removeItem(SHOP_ID_KEY);
}

/**
 * Gera link de acesso com ID da barbearia
 */
export function generateAccessLink(shopId: string, path: "admin" | "app"): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/${path}?shop=${shopId}`;
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
