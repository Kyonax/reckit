<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
-->

<template>
  <svg
    class="corner-bracket"
    :class="position"
    :width="size"
    :height="size"
    viewBox="0 0 40 40"
  >
    <path
      v-if="position === 'top-left'"
      d="M0 16 L0 0 L16 0"
      stroke="currentColor"
      :stroke-width="stroke_width"
      fill="none"
    />
    <path
      v-else-if="position === 'top-right'"
      d="M24 0 L40 0 L40 16"
      stroke="currentColor"
      :stroke-width="stroke_width"
      fill="none"
    />
    <path
      v-else-if="position === 'bottom-left'"
      d="M0 24 L0 40 L16 40"
      stroke="currentColor"
      :stroke-width="stroke_width"
      fill="none"
    />
    <path
      v-else-if="position === 'bottom-right'"
      d="M24 40 L40 40 L40 24"
      stroke="currentColor"
      :stroke-width="stroke_width"
      fill="none"
    />
  </svg>
</template>

<script setup>
defineProps({
  position: {
    type: String,
    required: true,
    validator: (val) => {
      return [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ].includes(val);
    },
  },
  size: {
    type: Number,
    default: 40,
  },
  stroke_width: {
    type: Number,
    default: 2,
  },
});
</script>

<style scoped lang="scss">
.corner-bracket {
  position: absolute;
  color: var(--clr-neutral-50);
}

.top-left { top: 0; left: 0; }
.top-right { top: 0; right: 0; }
.bottom-left { bottom: 0; left: 0; }
.bottom-right { bottom: 0; right: 0; }
</style>
