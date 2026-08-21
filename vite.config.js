import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// PENTING: ganti "lombok-bali-finance" di bawah dengan nama repository
// GitHub Anda persis (case-sensitive), supaya asset ter-load benar di GitHub Pages.
// Contoh: kalau repo Anda https://github.com/USERNAME/keuangan-kawasan
// maka base harus "/keuangan-kawasan/"
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/lombok-bali/",
});
