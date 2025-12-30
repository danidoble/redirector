import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './options.css';
import { Options } from './Options.tsx';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/theme-provider';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Toaster richColors />
            <Options />
        </ThemeProvider>
    </StrictMode>
);
