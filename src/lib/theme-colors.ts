export function getThemeColors() {
  if (typeof document === "undefined") {
    return {
      primary: "#111827",
      accent: "#2563EB",
      foreground: "#111827",
      mutedForeground: "#6B7280",
      border: "#E5E7EB",
      card: "#FFFFFF",
      blue: "#3b82f6",
      green: "#10b981",
      gray: "#d1d5db",
      pink: "#ec4899",
      red: "#ef4444",
    };
  }
  const style = getComputedStyle(document.documentElement);
  const val = (name: string, fallback: string) => {
    const v = style.getPropertyValue(name).trim();
    return v || fallback;
  };
  return {
    primary: val("--primary", "#111827"),
    accent: val("--accent", "#2563EB"),
    foreground: val("--foreground", "#111827"),
    mutedForeground: val("--muted-foreground", "#6B7280"),
    border: val("--border", "#E5E7EB"),
    card: val("--card", "#FFFFFF"),
    blue: "#3b82f6",
    green: "#10b981",
    gray: "#d1d5db",
    pink: "#ec4899",
    red: "#ef4444",
  };
}
