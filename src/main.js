/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { createApp } from 'vue';

import App from './App.vue';
import { router } from './router.js';

// Auto-load every brand's theme SCSS so the global CSS bundle
// carries each brand's `.brand-<handle>` selector with its CSS
// custom property overrides. Vite processes every matching file
// eagerly at build time — the brand theme is the single source
// of truth for colors/tokens per brand.
import.meta.glob(
  '/@*/styles/_theme.scss',
  { eager: true },
);

const app = createApp(App);

app.use(router);
app.mount('#app');
