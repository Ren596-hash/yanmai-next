import { isSupabaseAvailable, getSupabase } from "./client";
import { getSetting, setSetting } from "@/lib/storage";
import { getLocalUserId, loadProfileStyle, updateProfileStyle } from "./user-identity";
import type { UserCustomizations, CustomTag, CardTemplate } from "@/lib/user-customizations";
import { DEFAULT_CUSTOMIZATIONS } from "@/lib/user-customizations";

const IDB_KEY = "user_customizations";

// ── Load ──────────────────────────────────────────────

export async function loadCustomizations(): Promise<UserCustomizations> {
  // 1. Try Supabase
  if (isSupabaseAvailable()) {
    try {
      const style = await loadProfileStyle();
      if (style?.customizations) {
        return style.customizations as UserCustomizations;
      }
    } catch { /* fall through */ }
  }

  // 2. Fallback to IndexedDB
  try {
    const stored = await getSetting(IDB_KEY);
    if (stored && typeof stored === "object") {
      const c = stored as UserCustomizations;
      if (c.tags && c.cardTemplate) return c;
    }
  } catch { /* fall through */ }

  return { ...DEFAULT_CUSTOMIZATIONS, updatedAt: new Date().toISOString() };
}

// ── Save ──────────────────────────────────────────────

export async function saveCustomizations(customizations: UserCustomizations): Promise<void> {
  const payload = { ...customizations, updatedAt: new Date().toISOString() };

  // 1. Save to Supabase
  if (isSupabaseAvailable()) {
    try {
      await updateProfileStyle({ customizations: payload });
    } catch { /* continue to fallback */ }
  }

  // 2. Always save to IndexedDB as fallback
  try {
    await setSetting(IDB_KEY, payload);
  } catch { /* silent */ }
}

// ── Convenience: Tags ─────────────────────────────────

export async function loadCustomTags(): Promise<CustomTag[]> {
  const c = await loadCustomizations();
  return c.tags || [];
}

export async function saveCustomTags(tags: CustomTag[]): Promise<void> {
  const c = await loadCustomizations();
  c.tags = tags;
  await saveCustomizations(c);
}

// ── Convenience: Card Template ─────────────────────────

export async function loadCardTemplate(): Promise<CardTemplate> {
  const c = await loadCustomizations();
  return c.cardTemplate;
}

export async function saveCardTemplate(template: CardTemplate): Promise<void> {
  const c = await loadCustomizations();
  c.cardTemplate = template;
  await saveCustomizations(c);
}

// ── Identity ──────────────────────────────────────────

export { getLocalUserId };
