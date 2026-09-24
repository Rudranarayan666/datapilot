import { create } from 'zustand';
import { User, ThemeMode } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('insightcanvas_token');
  const savedUser = localStorage.getItem('insightcanvas_user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    isAuthenticated: !!savedToken,
    setAuth: (user, token) => {
      localStorage.setItem('insightcanvas_token', token);
      localStorage.setItem('insightcanvas_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('insightcanvas_token');
      localStorage.removeItem('insightcanvas_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

export const useThemeStore = create<ThemeState>((set) => {
  const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('insightcanvas_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const initial = getInitialTheme();
  if (typeof document !== 'undefined') {
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    theme: initial,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('insightcanvas_theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: next };
      }),
    setTheme: (theme) => {
      localStorage.setItem('insightcanvas_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme });
    },
  };
});
