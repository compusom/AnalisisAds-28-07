import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.DB_HOST': JSON.stringify(env.VITE_DB_HOST),
        'process.env.DB_USER': JSON.stringify(env.VITE_DB_USER),
        'process.env.DB_PASS': JSON.stringify(env.VITE_DB_PASS),
        'process.env.DB_NAME': JSON.stringify(env.VITE_DB_NAME),
        'process.env.DB_PORT': JSON.stringify(env.VITE_DB_PORT)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
