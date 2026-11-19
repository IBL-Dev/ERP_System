export type ThemeId = "sap-quartz-light" | "sap-horizon" | "sap-quartz-dark" | "sap-classic";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  /** Three preview colors: top bar, accent, page background. */
  swatch: readonly [string, string, string];
};

export type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};
