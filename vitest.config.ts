import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
      setupFiles: ['tests/helpers/setup.ts'],
      testTimeout: 120_000,
      hookTimeout: 120_000,
      pool: 'forks',
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.d.ts', 'src/render/worker.ts', 'src/render/client.ts'],
        reporter: ['text-summary', 'html', 'lcov'],
      },
    },
  }),
);
