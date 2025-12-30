import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path, { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup.html'),
                options: resolve(__dirname, 'src/options.html'),
                background: resolve(__dirname, 'src/background.ts')
            },
            output: {
                entryFileNames: chunkInfo => {
                    if (chunkInfo.name === 'background') {
                        return 'src/background.js';
                    }
                    return 'src/[name].js';
                },
                // Para background, no crear chunks separados
                manualChunks: undefined
            }
        },
        outDir: 'dist',
        target: 'es2020'
    }
});
