import type { SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _available: boolean | null = null;

export function isSupabaseAvailable(): boolean {
  if (_available !== null) return _available;
  _available = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return _available;
}

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseAvailable()) return null;
  if (_supabase) return _supabase;

  const { createClient } = await import("@supabase/supabase-js");
  _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _supabase;
}
