import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('prosemirror')) return 'vendor-prosemirror'
          if (id.includes('@codemirror')) return 'vendor-codemirror'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('@dnd-kit')) return 'vendor-dnd'
          return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
