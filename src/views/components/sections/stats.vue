<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  stats — sticky top stats strip showing SOURCES / BRANDS / READY /
  CANVAS counters. Spans edge-to-edge via negative horizontal
  margins that cancel the `.home` container padding. Each counter
  renders as a <UiDataPoint size="lg" />.
-->

<template>
  <div class="home-meta-bar">
    <div class="home-meta">
      <UiDataPoint size="lg" label="SOURCES" :value="overlay_count" />
      <UiDataPoint size="lg" label="BRANDS" :value="brand_count" />
      <UiDataPoint size="lg" label="READY" :value="ready_count" />
      <UiDataPoint size="lg" label="CANVAS" value="1920 × 1080 @ 60" />
    </div>
  </div>
</template>

<script setup>
import UiDataPoint from '@ui/data-point.vue';

defineProps({
  overlay_count: {
    type: Number,
    required: true,
  },
  brand_count: {
    type: Number,
    required: true,
  },
  ready_count: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.home-meta-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--clr-border-100);
  padding: 1em 0;
  margin: 0 -5em 2em;
}

.home-meta {
  display: flex;
  align-items: center;
  gap: 3em;
  padding: 0 5em;
}
</style>
