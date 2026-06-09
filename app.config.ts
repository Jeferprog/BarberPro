import { defineConfig } from '@tanstack/react-start/config'
import { VitePWA } from "vite-plugin-pwa"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
  vite: {
    plugins: [
      tsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'CadeiraCheia',
          short_name: 'CadeiraCheia',
          description: 'Agendamento e gerenciamento para barbearia',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ]
  }
})
