<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
-->

<template>
  <div :class="brand_class">
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Brand theme is applied via a class selector — the actual CSS
// custom property overrides live in `@<brand>/styles/_theme.scss`,
// auto-loaded by src/main.js. This component only announces the
// brand context; the CSS cascade does the rest.
const brand_class = computed(() => {
  const handle = route.meta?.brand;

  if (!handle) {
    return '';
  }

  return `brand-${handle.replace('@', '').replace(/_/g, '-')}`;
});
</script>

<style lang="scss">
@use "@app/scss/main.scss";
</style>
