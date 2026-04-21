<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-data-point — HUD-style label/value tile. Stacked column with
  an uppercase tracking-heavy label on top and a mono value below.
  Name answers "metric of what?": this is a single data point —
  a label + a value, paired for display in a dashboard or spec row.

  Size variants:
    sm — card specs, detail-modal specs (default)
    lg — landing-page sticky stats bar

  Props:
    label — short uppercase label text.
    value — string or number rendered below.
    size  — "sm" | "lg". Controls font sizes + spacing.
-->

<template>
  <div class="ui-data-point" :class="size_class">
    <span class="ui-data-point__label">{{ label }}</span>
    <span class="ui-data-point__value">{{ value }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'lg'].includes(v),
  },
});

const size_class = computed(() => `ui-data-point--${props.size}`);
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.ui-data-point {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ui-data-point__label {
  @include hud-label-base;
  position: static;
  opacity: 0.5;
}

.ui-data-point__value {
  font-family: var(--font-mono);
  color: var(--clr-primary-100);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ui-data-point--sm {
  gap: 0.2em;
}

.ui-data-point--sm .ui-data-point__label {
  font-size: var(--fs-150);
  letter-spacing: 0.18em;
}

.ui-data-point--sm .ui-data-point__value {
  font-size: var(--fs-300);
}

.ui-data-point--lg {
  gap: 0.25em;
}

.ui-data-point--lg .ui-data-point__label {
  font-size: var(--fs-125);
  letter-spacing: 0.3em;
}

.ui-data-point--lg .ui-data-point__value {
  font-size: var(--fs-525);
}
</style>
