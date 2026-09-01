<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-status-dot — small 6x6 square that breathes red when active,
  renders muted grey when inactive. Name answers "status of what,
  shown how?": a status indicator shown as a dot.

  Composition (perf-driven): the dark 3-layer legibility halo lives on
  the root span as a STATIC box-shadow (never animated). The red glow
  lives on a ::before-like inner span (`.glow`) that only animates
  `opacity` during recording. Keeping the dark layers out of the
  @keyframes lets the browser keep them cached — only the red layer's
  alpha changes per frame, no shadow re-rasterization.

  Props:
    active — boolean. When true, dot turns red + breathes (soft glow pulse).
-->

<template>
  <span
    class="ui-status-dot"
    :class="{ active }"
  >
    <span class="glow" />
  </span>
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
  position: relative;
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 0;
  background: var(--clr-neutral-50);
  opacity: 0.3;
  box-shadow: var(--hud-halo-text);
}

.glow {
  --hud-glow-color: var(--clr-error-100);
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  box-shadow: var(--hud-glow);
}

.ui-status-dot.active {
  background: var(--clr-error-100);
  opacity: 1;
}

.ui-status-dot.active .glow {
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
</style>
