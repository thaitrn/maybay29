import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const api = (process.env.VITE_API_BASE || 'https://maybay29-api.vercel.app').replace(/\/$/, '');
  if (mode === 'production') {
    if (!api.startsWith('https://') || /localhost|127\.0\.0\.1/i.test(api)) {
      throw new Error(`Production VITE_API_BASE must be HTTPS canonical, got: ${api}`);
    }
  }
  return {
    base: './',
    server: { port: 5174 },
    envPrefix: 'VITE_',
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(api),
    },
  };
});
