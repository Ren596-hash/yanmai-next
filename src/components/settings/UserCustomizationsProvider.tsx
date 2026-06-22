"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserCustomizations, CustomTag, CardTemplate } from "@/lib/user-customizations";
import { DEFAULT_CUSTOMIZATIONS } from "@/lib/user-customizations";
import { loadCustomizations, saveCustomizations, saveCustomTags, saveCardTemplate } from "@/lib/supabase/hybrid-store";

interface CustomizationsContextValue {
  customizations: UserCustomizations;
  loading: boolean;
  saveTags: (tags: CustomTag[]) => Promise<void>;
  saveTemplate: (template: CardTemplate) => Promise<void>;
  addTag: (tag: CustomTag) => Promise<void>;
  updateTag: (id: string, updates: Partial<CustomTag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Context = createContext<CustomizationsContextValue | null>(null);

export function UserCustomizationsProvider({ children }: { children: ReactNode }) {
  const [customizations, setCustomizations] = useState<UserCustomizations>(DEFAULT_CUSTOMIZATIONS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const c = await loadCustomizations();
      setCustomizations(c);
    } catch { /* use defaults */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (c: UserCustomizations) => {
    setCustomizations(c);
    await saveCustomizations(c);
  }, []);

  const saveTags = useCallback(async (tags: CustomTag[]) => {
    const next = { ...customizations, tags, updatedAt: new Date().toISOString() };
    setCustomizations(next);
    await saveCustomTags(tags);
  }, [customizations]);

  const saveTemplate = useCallback(async (template: CardTemplate) => {
    const next = { ...customizations, cardTemplate: template, updatedAt: new Date().toISOString() };
    setCustomizations(next);
    await saveCardTemplate(template);
  }, [customizations]);

  const addTag = useCallback(async (tag: CustomTag) => {
    const next = [...customizations.tags, tag];
    await saveTags(next);
  }, [customizations.tags, saveTags]);

  const updateTag = useCallback(async (id: string, updates: Partial<CustomTag>) => {
    const next = customizations.tags.map((t) => (t.id === id ? { ...t, ...updates } : t));
    await saveTags(next);
  }, [customizations.tags, saveTags]);

  const deleteTag = useCallback(async (id: string) => {
    const next = customizations.tags.filter((t) => t.id !== id);
    await saveTags(next);
  }, [customizations.tags, saveTags]);

  return (
    <Context.Provider
      value={{
        customizations,
        loading,
        saveTags,
        saveTemplate,
        addTag,
        updateTag,
        deleteTag,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCustomizations() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useCustomizations must be used within UserCustomizationsProvider");
  return ctx;
}
