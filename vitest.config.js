/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "./src/tests/setup.ts",
    environment: "jsdom",
    include: ['src/tests/**/*.{js,ts,tsx,jsx}'],
    exclude: [...configDefaults.exclude, 'src/tests/setup.ts'],
  },
})