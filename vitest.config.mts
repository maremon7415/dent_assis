import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // never let unit tests reach a real database or email provider by accident
    env: {
      DATABASE_URL: "postgresql://unit-tests-must-mock-prisma@localhost:1/none",
      RESEND_API_KEY: "",
    },
    restoreMocks: true,
  },
});
