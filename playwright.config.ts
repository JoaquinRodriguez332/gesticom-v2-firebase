import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',              // 👈 tus tests están en /test
  timeout: 120_000,

  // Proyectos (navegadores) disponibles
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Si quisieras después:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  use: {
    headless: false,              // lo puedes poner en true si no quieres ver el navegador
    screenshot: 'off',
    video: 'off',
  },
});
