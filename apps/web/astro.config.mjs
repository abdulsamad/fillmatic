import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  server: {
    port: 3000,
  },
  integrations: [react()],
});
