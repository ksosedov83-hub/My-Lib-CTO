import { create } from "zustand";

export type PerformanceMode = "low" | "medium" | "high" | "auto";

interface AppState {
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  selectedThemes: string[];
  performanceMode: PerformanceMode;
  toggleSidebar: () => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleThemeFilter: (themeName: string) => void;
  clearThemeFilters: () => void;
  setThemeFilters: (themes: string[]) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  theme: "dark",
  selectedThemes: [],
  performanceMode: "auto",
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  toggleThemeFilter: (themeName) =>
    set((state) => ({
      selectedThemes: state.selectedThemes.includes(themeName)
        ? state.selectedThemes.filter((t) => t !== themeName)
        : [...state.selectedThemes, themeName],
    })),
  clearThemeFilters: () => set({ selectedThemes: [] }),
  setThemeFilters: (themes) => set({ selectedThemes: themes }),
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
}));
