import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // No port pinned here: the launcher assigns one via PORT. Nothing in this
    // app is tied to a fixed origin, so hardcoding 5173 only causes clashes.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
