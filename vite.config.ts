import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 构建时把 icons 目录完整复制到 dist/icons，保证 ghost.png、ghost.gif、lazhu.png 等可被 getURL 加载 */
function copyIconsPlugin() {
  return {
    name: 'copy-icons',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist')
      const srcDir = path.join(__dirname, 'icons')
      const destDir = path.join(outDir, 'icons')
      if (!fs.existsSync(srcDir)) return
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
      for (const name of fs.readdirSync(srcDir)) {
        const srcPath = path.join(srcDir, name)
        if (fs.statSync(srcPath).isFile()) fs.copyFileSync(srcPath, path.join(destDir, name))
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), crx({ manifest }), copyIconsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
