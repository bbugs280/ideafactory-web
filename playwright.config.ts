import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8766',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'python3 -m http.server 8766',
    port: 8766,
    reuseExistingServer: true,
  },
});
