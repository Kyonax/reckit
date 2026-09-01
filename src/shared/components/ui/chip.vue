<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-chip — lowercase pill chip with gold text on translucent gold
  background. Used for category / keyword / tag-like metadata in a
  flex row. Naming follows Material Design / PrimeVue / Quasar —
  "chip" is the standard web-UI term for this primitive (distinct
  from HTML tags, distinct from <UiBadge> which is uppercase status).

  Renders as a span so callers control the surrounding layout
  (typically a flex container).

  Props:
    variant — "solid" (default) | "overflow" (dashed border +
              dimmed — used for "+N more" indicators at the end
              of a list).
    shape   — "pill" (default) | "square". Controls border-radius.
              Both currently map to 0 (the chip ships sharp by
              default per Plan #context-screen D15); "pill" is
              reserved for a future redesign that may introduce
              a radius. Consumers under a sharp-corner mandate
              (context-screen surfaces) should pass shape="square"
              to lock 0-radius regardless of future chip CSS.
-->

<template>
  <span
    class="ui-chip"
    :class="[variant_class, shape_class]"
  >
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'solid',
    validator: (v) => ['solid', 'overflow'].includes(v),
  },
  shape: {
    type: String,
    default: 'pill',
    validator: (v) => ['pill', 'square'].includes(v),
  },
});

const variant_class = computed(() => `ui-chip--${props.variant}`);
const shape_class = computed(() => `ui-chip--${props.shape}`);
</script>

<style scoped lang="scss">
.ui-chip {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-family: var(--font-mono);
  font-size: var(--fs-175);
  letter-spacing: 0.1em;
  color: var(--clr-primary-100);
  background: var(--clr-primary-100-06);
  border: 1px solid var(--clr-border-100);
  text-transform: lowercase;
  white-space: nowrap;
}

.ui-chip--overflow {
  opacity: 0.5;
  border-style: dashed;
}

.ui-chip--pill,
.ui-chip--square {
  border-radius: 0;
}
</style>
