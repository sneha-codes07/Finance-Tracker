import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType } from '../types';

export type ModeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  mode: ModeType;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('findiary-theme');
    // Map older string themes to system
    if (saved === 'GenZ' || saved === 'Millennial' || saved === 'Teen' || saved === 'Classic') {
      return 'system';
    }
    return (saved as ThemeType) || 'system';
  });

  const [mode, setMode] = useState<ModeType>('light');

  useEffect(() => {
    localStorage.setItem('findiary-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const updateMode = () => {
      if (theme === 'light') {
        setMode('light');
        document.documentElement.setAttribute('data-mode', 'light');
      } else if (theme === 'dark') {
        setMode('dark');
        document.documentElement.setAttribute('data-mode', 'dark');
      } else {
        const matchesDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setMode(matchesDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-mode', matchesDark ? 'dark' : 'light');
      }
    };

    updateMode();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateMode();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const toggleMode = () => {
    // Toggles between light and dark themes
    setTheme(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
