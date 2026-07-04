import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when you push new code
      devOptions: {
        enabled: true // Allows you to test the PWA installation on localhost
      },
      manifest: {
        name: 'WeekendMatcha POS',
        short_name: 'WMPOS',
        description: 'Point of Sale System for WeekendMatcha',
        theme_color: '#6B7C65', // Your app's green color!
        background_color: '#E8DCC6',
        display: 'standalone', // CRITICAL: This hides the browser URL bar
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Chrome requires this so it can crop the icon nicely
          }
        ]
      }
    })
  ]
})