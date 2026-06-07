import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/external-images': {
          target: 'https://wabot.nufat.id',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/external-images/, '/imagelist_nufat/api'),
        },
        '/api/appwrite-frames': {
          target: 'https://nudb.bungtemin.net',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/appwrite-frames/, '/bingkai/api'),
        },
        '/api/proxy/upload_img_base64': {
          target: 'https://webspy.nufat.id',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/proxy\/upload_img_base64/, '/api/upload_img_base64'),
        },
        '/api/proxy/upload_img': {
          target: 'https://webspy.nufat.id',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/proxy\/upload_img/, '/api/upload_img'),
        },
      },
    },
  };
});
