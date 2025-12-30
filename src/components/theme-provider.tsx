import { ThemeProviderContext, type Theme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'vite-ui-theme' }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

            root.classList.add(systemTheme);

            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
                root.classList.remove('light', 'dark');
                root.classList.add(newSystemTheme);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        root.classList.add(theme);
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        }
    };

    return (
        <ThemeProviderContext.Provider {...value} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}
