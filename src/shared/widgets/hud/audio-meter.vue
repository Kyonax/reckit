<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  audio-meter — self-contained audio visualizer. Reads OBS input
  levels via `useAudioAnalyzer` (WebSocket `InputVolumeMeters`,
  event-driven at ~50 Hz). Writes bar heights directly to the DOM
  via template refs — no Vue reactivity in the hot path, no rAF
  loop, zero allocation per update.

  Colors follow the current brand theme via --clr-primary-100.

  Props:
    bar_count    — number of visual bars. Default 16.

  Emits:
    update:state — { active, source, peak }, throttled to ~10 Hz.
-->

<template>
  <div class="audio-meter">
    <div
      v-for="i in bar_count"
      :key="i"
      ref="bar_els"
      class="bar"
    />
  </div>
</template>

<script setup>
import { useAudioAnalyzer } from '@composables/use-audio-analyzer.js';
import { ref, watch } from 'vue';

const DEFAULT_BAR_COUNT = 16;
const EMIT_INTERVAL_MS = 100;
const MIN_VISIBLE_SCALE = 0.05;
const SCALE_QUANTIZATION_STEPS = 100;
const SCALE_WRITE_THRESHOLD = 0.01;

const SCALE_STRINGS = Array.from(
  { length: SCALE_QUANTIZATION_STEPS + 1 },
  (_, i) => `scaleY(${(i / SCALE_QUANTIZATION_STEPS).toFixed(2)})`,
);

const props = defineProps({
  bar_count: {
    type: Number,
    default: DEFAULT_BAR_COUNT,
  },
});

const emit = defineEmits(['update:state']);

const { levels, tick, active, source_name } = useAudioAnalyzer({
  options: {
    bar_count: props.bar_count,
  },
});

const bar_els = ref([]);
const last_scale = new Float32Array(props.bar_count);
last_scale.fill(-1);
let last_emit = 0;

watch(tick, () => {
  const els = bar_els.value;
  const len = els.length;
  let peak = 0;

  for (let i = 0; i < len; i++) {
    const el = els[i];
    if (!el) {
      continue;
    }

    const value = levels[i];
    if (value > peak) {
      peak = value;
    }

    const scale = value < MIN_VISIBLE_SCALE ? MIN_VISIBLE_SCALE : value;
    if (Math.abs(scale - last_scale[i]) < SCALE_WRITE_THRESHOLD) {
      continue;
    }
    last_scale[i] = scale;

    let idx = Math.round(scale * SCALE_QUANTIZATION_STEPS);
    if (idx < 0) {
      idx = 0;
    } else if (idx > SCALE_QUANTIZATION_STEPS) {
      idx = SCALE_QUANTIZATION_STEPS;
    }
    el.style.transform = SCALE_STRINGS[idx];
  }

  const now = performance.now();
  if (now - last_emit >= EMIT_INTERVAL_MS) {
    last_emit = now;
    emit('update:state', {
      active: active.value,
      source: source_name.value,
      peak,
    });
  }
});
</script>

<style scoped lang="scss">
.audio-meter {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 40px;
  contain: layout paint;
}

.bar {
  width: 4px;
  height: 40px;
  background: var(--clr-primary-100);
  box-shadow:
    0 0 1px var(--clr-primary-100-80),
    0 0 1px var(--clr-primary-100-40);
  transform: scaleY(0.05);
  transform-origin: bottom;
}
</style>
