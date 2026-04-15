/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Vite config. package.json is the single source of truth for the
 * version; it's injected into the bundle as __APP_VERSION__ so UI
 * components can display it without hardcoding a string.
 */

import { createRequire } from 'node:module';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const DEV_SERVER_PORT = 5173;

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: DEV_SERVER_PORT,
    open: false,
  },
});
