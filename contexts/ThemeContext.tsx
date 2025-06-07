import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'mindbloom_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    loadTheme().then((theme) => {
      if (mounted) {
        setIsDark(theme);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const loadTheme = async (): Promise<boolean> => {
    try {
      let savedTheme;
      if (Platform.OS === 'web') {
        savedTheme = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
      } else {
        savedTheme = await SecureStore.getItemAsync(THEME_KEY);
      }
      
      return savedTheme === 'dark';
    } catch (error) {
      console.error('Error loading theme:', error);
      return false;
    }
  };

  const saveTheme = async (theme: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_KEY, theme);
        }
      } else {
        await SecureStore.setItemAsync(THEME_KEY, theme);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    saveTheme(newTheme ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
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