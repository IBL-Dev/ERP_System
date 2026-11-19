import type { ThemeId, ThemeOption } from "../type";

export const THEMES: readonly ThemeOption[] = [
  { id: "sap-quartz-light", label: "SAP Quartz Light", swatch: ["#354A5F", "#0070F2", "#F5F6F7"] },
  { id: "sap-horizon", label: "SAP Horizon", swatch: ["#FFFFFF", "#0064D9", "#F5F6F7"] },
  { id: "sap-quartz-dark", label: "SAP Quartz Dark", swatch: ["#29313A", "#4DA3FF", "#12171C"] },
  { id: "sap-classic", label: "SAP Classic (GUI Blue)", swatch: ["#1F2B7A", "#1F2B7A", "#96AFC4"] },
];

export const DEFAULT_THEME: ThemeId = "sap-quartz-light";
export const THEME_STORAGE_KEY = "lms-erp-theme";
