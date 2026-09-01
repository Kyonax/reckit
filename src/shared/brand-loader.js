/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * brand-loader — auto-discovers @brand/ folders at the project
 * root and merges their metadata + source registries into a
 * single runtime object. Uses import.meta.glob for static
 * analysis by Vite's bundler.
 *
 * Also discovers per-brand .org context files at /@<brand>/data/
 * contexts/<slug>.org, parses each via uniorg-parse at glob-time,
 * and exposes them as a CONTEXTS map: { brand → slug → { raw,
 * parsed } }. Cached AST means the sidebar renderer has zero
 * parse cost per frame (Plan #context-screen, decision D3).
 */

import { OrgSchemaError, parseOrg } from '@shared/utils/org.js';

const BRAND_HANDLE_PATTERN = /^\/(@[^/]+)\/data\/contexts\//;
const ORG_FILENAME_PATTERN = /([^/]+)\.org$/;

const brand_modules = import.meta.glob(
  '/@*/brand.js',
  { eager: true, import: 'default' },
);

const source_modules = import.meta.glob(
  '/@*/sources.js',
  { eager: true, import: 'default' },
);

const hud_components = import.meta.glob('/@*/sources/hud/*.vue');
const animation_components = import.meta.glob(
  '/@*/sources/animation/*.vue',
);
const scene_components = import.meta.glob('/@*/sources/scene/*.vue');

const context_modules = import.meta.glob(
  '/@*/data/contexts/*.org',
  { eager: true, query: '?raw', import: 'default' },
);

export const BRANDS = Object.values(brand_modules);
export const SOURCES = Object.values(source_modules).flat();
export const CONTEXTS = buildContextsMap(context_modules);

export function getBrand(handle) {
  return BRANDS.find((b) => b.handle === handle) || null;
}

export function resolveComponent(source) {
  const type_map = {
    hud: hud_components,
    animation: animation_components,
    scene: scene_components,
  };

  const components = type_map[source.type];

  if (!components) {
    return null;
  }

  const key = `/${source.brand}/sources/${source.type}/${source.id}.vue`;

  return components[key] || null;
}

export function getContexts(handle) {
  return CONTEXTS[handle] || {};
}

function buildContextsMap(modules) {
  const map = {};
  for (const path of Object.keys(modules)) {
    const brand_match = path.match(BRAND_HANDLE_PATTERN);
    const slug_match = path.match(ORG_FILENAME_PATTERN);
    if (!brand_match || !slug_match) {
      continue;
    }
    const brand_handle = brand_match[1];
    const slug = slug_match[1];
    const raw = modules[path];

    let parsed = null;
    let parse_error = null;
    try {
      parsed = parseOrg(raw);
    } catch (error) {
      if (error instanceof OrgSchemaError) {
        parse_error = {
          name: error.name,
          message: error.message,
          missing_keys: error.missing_keys,
        };
      } else {
        parse_error = { name: 'Error', message: String(error) };
      }
    }

    if (!map[brand_handle]) {
      map[brand_handle] = {};
    }
    map[brand_handle][slug] = { raw, parsed, parse_error };
  }
  return map;
}
