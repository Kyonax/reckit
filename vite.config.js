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

// Cross-process bridge for the context-screen control plane.
// OBS browser source runs in its own embedded Chromium (CEF) process —
// BroadcastChannel can't reach across processes, and Vite HMR custom
// events proved unreliable in CEF (silent failure of the WebSocket
// connection or the import.meta.hot handoff). HTTP polling + push is
// universal: every browser process can fetch + POST the same endpoint.
//
// State is held in a closure on the dev server. GET returns current
// state; POST replaces it. Composable polls at POLL_INTERVAL_MS for
// freshness; pushes on every local action. ~300 ms p95 cross-process
// latency, debuggable with `curl http://localhost:5173/__context_state`.
const CONTEXT_STATE_PATH = '/__context_state';
const context_relay_plugin = {
  name: 'reckit-context-relay',
  configureServer(server) {
    let current_state = { active_slug: null, sidebar_open: false };

    server.middlewares.use(CONTEXT_STATE_PATH, (req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(current_state));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed && typeof parsed === 'object') {
              current_state = parsed;
              res.statusCode = 204;
              res.end();
              return;
            }
            res.statusCode = 400;
            res.end('invalid payload');
          } catch {
            res.statusCode = 400;
            res.end('invalid json');
          }
        });
        return;
      }

      res.statusCode = 405;
      res.end();
    });
  },
};

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(ROOT, 'src/shared'),
      '@views': resolve(ROOT, 'src/views'),
      '@app': resolve(ROOT, 'src/app'),
      '@assets': resolve(ROOT, '.github/assets'),

      '@sections': resolve(ROOT, 'src/views/components/sections'),
      '@elements': resolve(ROOT, 'src/views/components/elements'),
      '@modals': resolve(ROOT, 'src/views/components/modals'),

      '@ui': resolve(ROOT, 'src/shared/components/ui'),
      '@hud': resolve(ROOT, 'src/shared/components/hud'),
      '@widgets': resolve(ROOT, 'src/shared/widgets'),
      '@composables': resolve(ROOT, 'src/shared/composables'),
    },
  },
  plugins: [vue(), context_relay_plugin],
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
