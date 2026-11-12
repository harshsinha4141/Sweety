import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // File-based routing: every file in src/routes becomes a page (must run before react()).
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      disableTypes: true,
      generatedRouteTree: './src/routeTree.gen.js',
    }),
    react(),
    tailwindcss(),
  ],
})
