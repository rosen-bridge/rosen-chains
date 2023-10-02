import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      reporter: ['cobertura', 'text', 'text-summary'],
    },
    deps: {
      registerNodeLoader: true,
    },
    mockReset: true,
    watch: false,
    threads: false,
  },
  plugins: [wasm(), topLevelAwait()],
});
