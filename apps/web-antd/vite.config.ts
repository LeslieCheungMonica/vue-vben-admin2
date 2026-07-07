import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api/wape': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:7654',
            ws: true,
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq, req) => {
                if (req.url?.includes('event_stream')) {
                  proxyReq.setHeader('accept-encoding', 'identity');
                }
              });
            },
          },
          '/api/cosmic': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:7654',
            ws: true,
          },
          '/api/native-security': {
            changeOrigin: true,
            target: 'http://localhost:8001',
            ws: true,
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq, req) => {
                if (req.url?.includes('chat') || req.url?.includes('stream')) {
                  proxyReq.setHeader('accept-encoding', 'identity');
                }
              });
            },
          },
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
