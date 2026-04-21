/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * brand-loader — auto-discovers @brand/ folders at the project
 * root and merges their metadata + source registries into a
 * single runtime object. Uses import.meta.glob for static
 * analysis by Vite's bundler.
 */

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

export const BRANDS = Object.values(brand_modules);
export const SOURCES = Object.values(source_modules).flat();

/**
 * Get a brand's metadata by handle.
 */
export function getBrand(handle) {
  return BRANDS.find((b) => b.handle === handle) || null;
}

/**
 * Resolve the lazy component loader for a given source entry.
 * Matches source.type + source.brand + source.id to the glob
 * results.
 */
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
