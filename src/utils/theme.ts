import { computed, ref } from "vue";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "qiaopi-theme";
const themes: AppTheme[] = ["light", "dark"];

function getStoredTheme(): AppTheme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return themes.includes(value as AppTheme) ? (value as AppTheme) : null;
}

function getPreferredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const theme = ref<AppTheme>(getStoredTheme() ?? getPreferredTheme());

export function setTheme(nextTheme: AppTheme) {
  theme.value = nextTheme;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }
}

export function initTheme() {
  setTheme(theme.value);
}

export function useTheme() {
  const isDark = computed(() => theme.value === "dark");
  const themeLabel = computed(() => (isDark.value ? "浅色" : "深色"));

  function toggleTheme() {
    setTheme(isDark.value ? "light" : "dark");
  }

  return {
    theme,
    isDark,
    themeLabel,
    setTheme,
    toggleTheme
  };
}
