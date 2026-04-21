/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { resolveComponent, SOURCES } from '@shared/brand-loader.js';
import { createRouter, createWebHistory } from 'vue-router';

const source_routes = SOURCES
  .map((source) => {
    const loader = resolveComponent(source);

    if (!loader) {
      return null;
    }

    return {
      path: source.path,
      name: `${source.brand.replace('@', '')}-${source.id}`,
      component: loader,
      meta: {
        brand: source.brand,
        source_id: source.id,
        source_type: source.type,
      },
    };
  })
  .filter(Boolean);

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@views/home.vue'),
  },
  ...source_routes,
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
