/// <reference types="vitest" />

/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

/**
 *   __  __         ___
 *  / /_/ /  ___   / _/__  _______ ____
 * / __/ _ \/ -_) / _/ _ \/ __/ _ `/ -_)
 * \__/_//_/\__/ /_/ \___/_/  \_, /\__/
 *                           /___/
 *
 * vite.config.js — Build, dev server and test pipeline
 * 2026-04-17
 *
 * Main build configuration for the RECKIT Vue 3 app. Injects the
 * version from package.json and hosts the Vitest test config in
 * the same file to reuse the plugin pipeline.
 *
 *   Plugins (Vue 3)
 *   define: __APP_VERSION__
 *   Server config (port 5173)
 *   Vitest config (environment, globals, coverage)
 *
 * Guidelines:
 *   Version comes from package.json only, never hardcode
 *   New plugins go in the plugins array, not separate configs
 *   Test patterns colocated next to source files
 *
 * Requirements:
 * Shared by Vite and Vitest, no separate vitest.config.js
 * Kill stale dev servers before adding plugins
 *
 * Cristian D. Moreno (Kyonax)
 * kyonax.corp@gmail.com
 */

import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const ROOT = dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_PORT = 5173;

export default defineConfig({
  resolve: {
    alias: {
      // Top-level scopes
      '@shared': resolve(ROOT, 'src/shared'),
      '@views': resolve(ROOT, 'src/views'),
      '@app': resolve(ROOT, 'src/app'),
      '@assets': resolve(ROOT, '.github/assets'),

      // Views: kind folders
      '@sections': resolve(ROOT, 'src/views/components/sections'),
      '@elements': resolve(ROOT, 'src/views/components/elements'),
      '@modals': resolve(ROOT, 'src/views/components/modals'),

      // Shared: kind folders
      '@ui': resolve(ROOT, 'src/shared/components/ui'),
      '@hud': resolve(ROOT, 'src/shared/components/hud'),
      '@widgets': resolve(ROOT, 'src/shared/widgets'),
      '@composables': resolve(ROOT, 'src/shared/composables'),
    },
  },
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: DEV_SERVER_PORT,
    open: false,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'src/**/*.{test,spec}.{js,mjs}',
      '@*/**/*.{test,spec}.{js,mjs}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/**/*.{js,mjs,vue}',
        '@*/**/*.{js,mjs,vue}',
      ],
      exclude: [
        'src/main.js',
        'src/App.vue',
        'src/router.js',
        'src/**/*.{test,spec}.{js,mjs}',
        '@*/**/*.{test,spec}.{js,mjs}',
      ],
    },
  },
});
