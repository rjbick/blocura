import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'index.unstyled': 'src/index.unstyled.ts',
      },
      name: 'Blocura',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const base = entryName ?? 'index'
        return format === 'es' ? `${base}.js` : `${base}.cjs`
      },
      cssFileName: 'styles',
    },
    sourcemap: false,
    rollupOptions: {
      external,
    },
  },
})
