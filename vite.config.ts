import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    target: "esnext",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      resolveDependencies: (filename, deps, { hostType }) => {
        if (hostType === "html") {
          return deps.filter(
            (dep) =>
              !dep.includes("vendor-pdf") &&
              !dep.includes("vendor-charts")
          );
        }
        return deps;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("jspdf") ||
              id.includes("html2canvas") ||
              id.includes("qrcode") ||
              id.includes("bwip-js")
            ) {
              return "vendor-pdf";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
