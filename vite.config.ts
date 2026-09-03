import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const PRODUCTION_API_URL = "https://mindforge.backend.sumedhdev.tech"
const DEVELOPMENT_API_URL = "http://localhost:5000"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production"
  const apiBaseUrl = isProduction ? PRODUCTION_API_URL : ""

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
    },
    server: {
      proxy: {
        "/api": {
          target: DEVELOPMENT_API_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
