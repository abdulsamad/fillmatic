import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  server: {
    port: 3000,
    open: true,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
