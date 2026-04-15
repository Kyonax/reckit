/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/home.vue'),
  },
  {
    path: '/@kyonax_on_tech/cam-person',
    name: 'kyonax-cam-person',
    component: () => import(
      './brands/kyonax-on-tech/cam-person.vue'
    ),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'blank',
    component: { render: () => null },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
