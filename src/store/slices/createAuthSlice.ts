import { StateCreator } from 'zustand';
import { User } from '../../types';

export interface AuthSlice {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  setActiveSite: (siteId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createAuthSlice: StateCreator<AuthSlice & any, [], [], AuthSlice> = (set, get) => ({
  currentUser: null,
  isAuthenticated: false,

  login: async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      localStorage.setItem('puma_token', data.token);
      set({ currentUser: data.user, isAuthenticated: true });
      
      // Apply theme for user
      const userTheme = localStorage.getItem(`puma_theme_${data.user.id}`) || data.user.themePreference || 'dark';
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      if (userTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(userTheme);
      }
      
      // We trigger initializeStore to fetch all user-specific data
      // after a successful login
      setTimeout(() => {
        get().initializeStore();
      }, 0);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('puma_token');
    set({ currentUser: null, isAuthenticated: false });
    
    // Reset to system theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  
  setActiveSite: (siteId: string) => {
    const { currentUser } = get();
    if (currentUser && currentUser.siteIds?.includes(siteId)) {
      set({ 
        currentUser: { ...currentUser, siteId } 
      });
    }
  }
});
