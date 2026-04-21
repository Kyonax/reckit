<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-icon — renders an SVG by name, resolved from two pools:
    1. src/shared/assets/svg/*.svg       (project-wide primitives)
    2. /@<brand>/assets/svg/*.svg        (any brand's private SVGs)

  Both pools are scanned via import.meta.glob with ?raw, inlined
  at build time. Color inherits via `currentColor` in the SVG
  source. Brand SVGs override shared SVGs on filename collision —
  useful when a brand wants a brand-flavored version of a shared
  primitive (e.g. a branded corner-bracket). Cross-brand filename
  collisions (two brands sharing a filename) produce last-loaded-
  wins; avoid by prefixing brand-specific SVGs with a unique name.

  Props:
    name  — filename without extension (e.g. "corner-bracket").
    label — optional accessible label. When set, renders with
            role="img" + aria-label; otherwise aria-hidden.
    size  — optional width/height in pixels. Omit to let CSS
            control sizing.
-->

<template>
  <span
    v-if="svg_content"
    class="ui-icon"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    :style="size_style"
    v-html="svg_content"
  />
</template>

<script setup>
import { computed } from 'vue';

const shared_svg = import.meta.glob(
  '@shared/assets/svg/*.svg',
  { eager: true, query: '?raw', import: 'default' },
);

const brand_svg = import.meta.glob(
  '/@*/assets/svg/*.svg',
  { eager: true, query: '?raw', import: 'default' },
);

const svg_map = Object.fromEntries(
  [
    ...Object.entries(shared_svg),
    ...Object.entries(brand_svg),
  ].map(([path, raw]) => {
    const filename = path.split('/').pop().replace('.svg', '');
    return [filename, raw];
  }),
);

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 0,
  },
});

const svg_content = computed(() => {
  return svg_map[props.name] || '';
});

const size_style = computed(() => {
  if (!props.size) {
    return {};
  }

  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
  };
});
</script>

<style scoped lang="scss">
.ui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.ui-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
