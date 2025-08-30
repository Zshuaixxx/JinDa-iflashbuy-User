import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // 开发阶段启用源码映射
    sourcemap: process.env.NODE_ENV === 'development',
    // 输出更详细的构建日志
    logLevel: 'verbose',
  },
  plugins: [uni()],
  // 输出服务器日志
  server: {
    logLevel: 'verbose',
  },
})