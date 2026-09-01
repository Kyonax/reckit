<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  home — RECKIT landing page. Composes 5 top-level sections.
  Owns brand + count derivation only; each section manages its
  own internal state. Thin on purpose — see CONTRIBUTING for
  the views/ architecture (sections / elements / modals).
-->

<template>
  <div class="home-bg">
    <div class="home">
      <StatsSection
        :overlay_count="overlay_count"
        :brand_count="brand_count"
        :ready_count="ready_count"
      />
      <HeroSection />
      <SetupSection />
      <SourcesSection
        :brands="brands"
        :sources="SOURCES"
      />
      <FooterSection />
    </div>
  </div>
</template>

<script setup>
import FooterSection from '@sections/footer.vue';
import HeroSection from '@sections/hero.vue';
import SetupSection from '@sections/setup.vue';
import SourcesSection from '@sections/sources.vue';
import StatsSection from '@sections/stats.vue';
import { SOURCES } from '@shared/brand-loader.js';
import { computed } from 'vue';

const overlay_count = computed(() => SOURCES.length);

const ready_count = computed(() => {
  return SOURCES.filter((o) => o.status === 'ready').length;
});

const brands = computed(() => {
  const counts = new Map();

  SOURCES.forEach((overlay) => {
    const current = counts.get(overlay.brand) || 0;
    counts.set(overlay.brand, current + 1);
  });

  return Array.from(counts, ([name, count]) => ({ name, count }));
});

const brand_count = computed(() => brands.value.length);
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.home-bg {
  background: var(--clr-neutral-500);
  min-height: 100vh;
  width: 100%;
}

.home {
  color: var(--clr-neutral-50);
  padding: 0 5em 4em;
  display: grid;
  gap: 4em;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
