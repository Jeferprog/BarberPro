import { supabase } from "@/integrations/supabase/client";

let cachedShopId: string | null = null;

export async function getBarbershopId(): Promise<string> {
  return "cole-o-uuid-aqui"; // ← ID da barbearia
}
  if (cachedShopId) return cachedShopId;
  const { data, error } = await supabase
    .from("barbershops")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Nenhuma barbearia cadastrada.");
  cachedShopId = data.id;
  return data.id;
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
