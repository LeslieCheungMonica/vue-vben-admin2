import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        host: '0.0.0.0',           // 允许外部访问
        port: 5666,                 // 你的端口
        allowedHosts: [
          'manhole-reliably-guru.ngrok-free.dev',  // 添加你的 ngrok 域名
          // 或者使用通配符（开发环境方便，但注意安全）
          // '.ngrok-free.dev'
        ],
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
