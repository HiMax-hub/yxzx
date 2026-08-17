import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// 生产构建优化：按 mode 区分环境配置（.env.production / .env.development）
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // 生产环境输出目录（与静态托管约定一致）
      outDir: 'dist',
      // 生产环境不生成 sourcemap（避免源码泄露），开发模式可开启调试
      sourcemap: isProd ? false : true,
      // 资源内联阈值：4KB 以下小资源（如图标）内联为 base64，减少请求数
      assetsInlineLimit: 4096,
      // CSS 代码压缩
      cssCodeSplit: true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // 生产构建产物文件名加内容哈希，支持 CDN 长缓存
          entryFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          chunkFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProd ? 'assets/[name]-[hash][extname]' : 'assets/[name][extname]',
          manualChunks(id) {
            // 用模块路径匹配替代包名匹配：react 为 CJS 入口，包名字符串在 Vite6 下会生成空 chunk
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'vendor-motion';
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) return 'vendor-recharts';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // 生产预览端口（npm run preview 默认 4173）
    preview: {
      port: 4173,
      host: '0.0.0.0',
    },
  };
});
