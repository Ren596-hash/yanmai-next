import { getSupabase, isSupabaseAvailable } from "./client";
import { getSetting, setSetting } from "@/lib/storage";

const STORAGE_KEY = "yanmai_user_id";

function generateUUID(): string {
  // crypto.randomUUID is available in all modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getLocalUserId(): string {
  if (typeof localStorage === "undefined") return generateUUID();
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export interface UserProfile {
  id: string;
  role: string;
  name: string;
  group_name: string;
  year: number;
  mastery: number;
  status: string;
  style_json: Record<string, unknown>;
}

export async function getOrCreateProfile(): Promise<UserProfile | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;

  const localId = getLocalUserId();

  // Try to find existing profile by style_json.yanmai_user_id
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .filter("style_json->>yanmai_user_id", "eq", localId)
    .maybeSingle();

  if (existing) return existing as UserProfile;

  // Try to find the "新生" / demo profile and associate it
  const { data: demoProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "新生")
    .limit(1);

  if (demoProfiles && demoProfiles.length > 0) {
    const profile = demoProfiles[0];
    const updatedStyle = { ...((profile.style_json as Record<string, unknown>) || {}), yanmai_user_id: localId };
    await supabase.from("profiles").update({ style_json: updatedStyle }).eq("id", profile.id);
    return { ...profile, style_json: updatedStyle } as UserProfile;
  }

  // Create a new profile
  const { data: created } = await supabase
    .from("profiles")
    .insert({
      name: "新用户",
      role: "新生",
      year: new Date().getFullYear(),
      mastery: 5,
      status: "在研",
      style_json: { yanmai_user_id: localId },
    })
    .select()
    .single();

  return created as UserProfile | null;
}

export async function updateProfileStyle(styleUpdates: Record<string, unknown>): Promise<boolean> {
  if (!isSupabaseAvailable()) return false;

  try {
    const supabase = await getSupabase();
    if (!supabase) return false;

    const localId = getLocalUserId();

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, style_json")
      .filter("style_json->>yanmai_user_id", "eq", localId)
      .maybeSingle();

    if (!profile) return false;

    const merged = { ...((profile.style_json as Record<string, unknown>) || {}), ...styleUpdates, yanmai_user_id: localId };

    const { error } = await supabase
      .from("profiles")
      .update({ style_json: merged })
      .eq("id", profile.id);

    return !error;
  } catch {
    return false;
  }
}

export async function loadProfileStyle(): Promise<Record<string, unknown> | null> {
  if (!isSupabaseAvailable()) return null;

  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    const localId = getLocalUserId();

    const { data } = await supabase
      .from("profiles")
      .select("style_json")
      .filter("style_json->>yanmai_user_id", "eq", localId)
      .maybeSingle();

    return (data?.style_json as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}
