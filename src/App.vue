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
