import react from '@vitejs/plugin-react';
import { build } from 'vite';

await build({
  root: process.cwd(),
  configFile: false,
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: process.env.FLOWLINE_WEB_OUT_DIR || 'dist',
  },
});
