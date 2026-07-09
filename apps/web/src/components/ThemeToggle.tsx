import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "切换到浅色模式" : "切换到深色模式";

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className="inline-flex size-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus:ring-zinc-700"
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">{label}</span>
    </button>
  );
}
