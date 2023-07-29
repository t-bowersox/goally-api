/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";

export default defineConfig(() => {
  const env = loadEnv("test", process.cwd(), "");
  return {
    test: {
      env,
      singleThread: true, // Test database state gets out of whack otherwise
    },
  };
});
