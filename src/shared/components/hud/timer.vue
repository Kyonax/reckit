<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
-->

<template>
  <div
    class="recording-timer"
    :class="{ recording: is_recording }"
  >
    <UiStatusDot :active="is_recording" />
    <span class="rec" :class="{ active: is_recording }">REC</span>
    <span class="mode">MODE:</span>
    <span class="time">{{ elapsed_time }}</span>
  </div>
</template>

<script setup>
import UiStatusDot from '@ui/status-dot.vue';

defineProps({
  is_recording: {
    type: Boolean,
    default: false,
  },
  elapsed_time: {
    type: String,
    default: '00:00:00',
  },
});
</script>

<style scoped lang="scss">
.recording-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: var(--fs-500);
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--clr-neutral-50);
  opacity: 0.5;
}

.recording-timer.recording {
  opacity: 1;
}

.rec {
  color: inherit;
}

.rec.active {
  color: var(--clr-error-100);
}

.mode,
.time {
  color: inherit;
  font-variant-numeric: tabular-nums;
}
</style>
