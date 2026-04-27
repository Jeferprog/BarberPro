import { createClient } from "@supabase/supabase-js";
function createSupabaseClient() {
  const SUPABASE_URL = "https://ycrmuaiaqywcdflyjnqq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljcm11YWlhcXl3Y2RmbHlqbnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4Njc2ODksImV4cCI6MjA5MjQ0MzY4OX0.grEL62GMrekZQq76dsIYqve5EjiQXllSP5zTLunkqlw";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
let cachedShopId = null;
async function getBarbershopId() {
  if (cachedShopId) return cachedShopId;
  const { data, error } = await supabase.from("barbershops").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Nenhuma barbearia cadastrada.");
  cachedShopId = data.id;
  return data.id;
}
function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
export {
  formatBRL as f,
  getBarbershopId as g,
  supabase as s
};
