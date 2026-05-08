import { supabase } from "@/integrations/supabase/client";

let cachedShopId: string | null = null;

export async function getBarbershopId(): Promise<string> {
  if (cachedShopId) return cachedShopId;

  // IMPORTANTE: Troca pelo UUID da sua barbearia
  // Para encontrar o UUID, acesse /master e copie o ID da barbearia
  const hardcodedId = "55a73190-6680-45f7-850f-48df943920cb";
  
  // Se você colocou um UUID válido, usa ele
  if (hardcodedId !== "55a73190-6680-45f7-850f-48df943920cb") {
    cachedShopId = hardcodedId;
    return hardcodedId;
  }

  // Senão, busca a primeira barbearia ativa no banco
  const { data, error } = await supabase
    .from("barbershops")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Nenhuma barbearia encontrada. Cadastre uma em /master");
  }

  cachedShopId = data.id;
  return data.id;
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
