<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-status-dot — small 6x6 square that blinks red when active,
  renders muted grey when inactive. Name answers "status of what,
  shown how?": a status indicator shown as a dot.

  Props:
    active — boolean. When true, dot turns red + blinks.
-->

<template>
  <span
    class="ui-status-dot"
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
.ui-status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 0;
  background: var(--clr-neutral-50);
  opacity: 0.3;
}

.ui-status-dot.active {
  background: var(--clr-error-100);
  opacity: 1;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
</style>
