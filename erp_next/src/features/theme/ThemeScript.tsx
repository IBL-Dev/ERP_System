import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from "./themes";

/** Runs before first paint so the saved theme never flashes the default one. */
export function ThemeScript() {
  const ids = JSON.stringify(THEMES.map((t) => t.id));
  const key = JSON.stringify(THEME_STORAGE_KEY);
  const fallback = JSON.stringify(DEFAULT_THEME);
  const code = `try{var t=localStorage.getItem(${key});document.documentElement.dataset.theme=${ids}.indexOf(t)>-1?t:${fallback};}catch(e){document.documentElement.dataset.theme=${fallback};}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
