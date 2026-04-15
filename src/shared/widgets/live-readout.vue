<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  live-readout — monospace text display that can sample its
  input at a configurable interval. Useful for telemetry,
  debug strings, or any value that changes faster than the
  eye can follow.

  Colors follow the current brand theme via --clr-primary-100.

  Props:
    text        — string to display.
    refresh_ms  — sampling interval in milliseconds. 0 means
                  render on every reactive change. Positive
                  values cap DOM updates to that interval so
                  fast feeds stay legible.
-->

<template>
  <span class="live-readout">{{ displayed }}</span>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  refresh_ms: {
    type: Number,
    default: 0,
  },
});

const displayed = ref(props.text);
let interval_id = null;

function sync() {
  displayed.value = props.text;
}

function stopPolling() {
  if (interval_id !== null) {
    clearInterval(interval_id);
    interval_id = null;
  }
}

function startPolling(ms) {
  stopPolling();

  if (ms > 0) {
    interval_id = setInterval(sync, ms);
  }
}

watch(
  () => props.refresh_ms,
  (ms) => {
    startPolling(ms);
    sync();
  },
  { immediate: true },
);

watch(
  () => props.text,
  () => {
    if (props.refresh_ms === 0) {
      sync();
    }
  },
);

onUnmounted(stopPolling);
</script>

<style scoped lang="scss">
.live-readout {
  display: inline-block;
  font-family: var(--font-mono);
  color: var(--clr-primary-100);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
