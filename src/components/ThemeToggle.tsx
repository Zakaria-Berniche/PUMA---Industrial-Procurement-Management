import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useStore } from '../store/useStore';

type Theme = 'light' | 'dark' | 'system';

// B3 — Helper: clé localStorage spécifique à l'utilisateur
const getThemeKey = (userId?: string) => userId ? `puma_theme_${userId}` : 'puma_theme_default';

const applyThemeToDOM = (t: Theme) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  if (t === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(t);
  }
};

export function ThemeToggle() {
  const currentUser = useStore((s) => s.currentUser);
  const updateUser = useStore((s) => s.updateUser);
  const themeKey = getThemeKey(currentUser?.id);

  const [prevThemeKey, setPrevThemeKey] = useState(themeKey);
  const [theme, setTheme] = useState<Theme>(() => {
    // Try user-specific key first, then user profile, then legacy key for backwards compat
    const saved = localStorage.getItem(getThemeKey(currentUser?.id)) || currentUser?.themePreference || localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });

  const [isOpen, setIsOpen] = useState(false);

  // Synchronize theme with key change on login/logout
  if (themeKey !== prevThemeKey) {
    setPrevThemeKey(themeKey);
    const saved = localStorage.getItem(themeKey) || currentUser?.themePreference;
    if (saved && saved !== theme) {
      setTheme(saved as Theme);
    } else if (!saved && theme !== 'dark') {
      setTheme('dark');
    }
  }

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem(themeKey, theme);

    if (currentUser && currentUser.themePreference !== theme) {
      updateUser({ ...currentUser, themePreference: theme });
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyThemeToDOM('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, themeKey, currentUser, updateUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.theme-toggle-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const options: { value: Theme; label: string; Icon: React.ElementType }[] = [
    { value: 'light', label: 'Clair', Icon: Sun },
    { value: 'dark', label: 'Sombre', Icon: Moon },
    { value: 'system', label: 'Auto', Icon: Monitor },
  ];

  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div className="relative theme-toggle-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-50 transition-colors rounded-full hover:bg-slate-900 flex items-center justify-center"
        aria-label="Changer le thème"
        title={`Thème : ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto'}`}
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setIsOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                theme === value
                  ? 'bg-slate-900 text-emerald-400'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
