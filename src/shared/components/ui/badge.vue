<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-badge — HUD status pill with primary/neutral variant. Used for
  overlay status indicators (ready, planned), metadata flags, and
  any small standalone label that needs a bordered box.

  Props:
    variant — "active" (default, gold on gold border)
              "dim"   (muted text on muted border, for planned/inactive)
-->

<template>
  <span class="ui-badge" :class="variant_class">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'active',
    validator: (v) => ['active', 'dim'].includes(v),
  },
});

const variant_class = computed(() => `ui-badge--${props.variant}`);
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.ui-badge {
  @include hud-label-base;
  position: static;
  display: inline-block;
  padding: 0.25em 0.65em;
  font-size: var(--fs-150);
  letter-spacing: 0.18em;
  white-space: nowrap;
  border: 1px solid var(--clr-primary-100);
  color: var(--clr-primary-100);
}

.ui-badge--dim {
  border-color: var(--clr-neutral-200);
  color: var(--clr-neutral-200);
}
</style>
