<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
-->

<template>
  <span
    class="status-indicator"
    :class="{ active }"
  />
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped lang="scss">
.status-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 0;
  background: var(--clr-neutral-50);
  opacity: 0.3;
}

.status-indicator.active {
  background: var(--clr-error-100);
  opacity: 1;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
</style>
