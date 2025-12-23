import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    // Bundle 分析（仅在构建时启用）
    visualizer({
      open: false,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心库
          if (id.includes("react") || id.includes("react-dom")) {
            return "react-vendor";
          }
          // TanStack 库
          if (
            id.includes("@tanstack/react-query") ||
            id.includes("@tanstack/react-router")
          ) {
            return "tanstack-vendor";
          }
          // UI 组件库
          if (
            id.includes("@radix-ui/react-slot") ||
            id.includes("lucide-react") ||
            id.includes("sonner")
          ) {
            return "ui-vendor";
          }
          // 表单和验证
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod")
          ) {
            return "form-vendor";
          }
          // 工具库
          if (
            id.includes("clsx") ||
            id.includes("tailwind-merge") ||
            id.includes("class-variance-authority") ||
            id.includes("date-fns")
          ) {
            return "utils-vendor";
          }
        },
      },
    },
    // 压缩配置
    minify: "esbuild",
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
  },
  // 优化配置
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@tanstack/react-router",
    ],
  },
});
