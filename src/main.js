/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { createApp } from 'vue';

import App from './App.vue';
import { router } from './router.js';

const app = createApp(App);

app.use(router);
app.mount('#app');
