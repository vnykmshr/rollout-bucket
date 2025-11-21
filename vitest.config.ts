import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Test file patterns
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/', '**/*.config.{js,ts}', '**/*.d.ts', 'todos/'],
      all: true,
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95,
    },

    // Reporter
    reporters: ['default'],
  },
});
