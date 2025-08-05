import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // 开发阶段启用源码映射
    sourcemap: process.env.NODE_ENV === 'development',
  },
  plugins: [uni()],
})