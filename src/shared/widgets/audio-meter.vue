<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  audio-meter — self-contained audio visualizer for OBS overlays.
  Subscribes to OBS InputVolumeMeters via useAudioAnalyzer and
  renders bars sized to the live peak. Drop into any brand
  overlay that has an `obs` instance available.

  Colors follow the current brand theme via --clr-primary-100.

  Props:
    obs          — OBSWebSocket instance (required).
    source_name  — OBS input name to watch. Empty = first input
                   with non-zero levels.
    bar_count    — number of visual bars. Default 16.

  Emits:
    update:state — { active, source, peak } on every analyzer
                   frame. Use with a live-readout for diagnostics.
-->

<template>
  <div class="audio-meter">
    <div
      v-for="(level, index) in levels"
      :key="index"
      class="bar"
      :style="{ height: `${scaleLevel(level)}px` }"
    />
  </div>
</template>

<script setup>
import { watch } from 'vue';

import { useAudioAnalyzer }
  from '../composables/use-audio-analyzer.js';

const MAX_BAR_HEIGHT = 36;
const MIN_BAR_HEIGHT = 2;
const MAX_LEVEL = 255;
const DEFAULT_BAR_COUNT = 16;

const props = defineProps({
  obs: {
    type: Object,
    required: true,
  },
  source_name: {
    type: String,
    default: '',
  },
  bar_count: {
    type: Number,
    default: DEFAULT_BAR_COUNT,
  },
});

const emit = defineEmits(['update:state']);

const { levels, active, source_name } = useAudioAnalyzer({
  obs: props.obs,
  options: {
    source_name: props.source_name,
    bar_count: props.bar_count,
  },
});

watch(
  [active, source_name, levels],
  ([next_active, next_source, next_levels]) => {
    emit('update:state', {
      active: next_active,
      source: next_source,
      peak: next_levels[0] || 0,
    });
  },
  { immediate: true },
);

function scaleLevel(value) {
  const ratio = value / MAX_LEVEL;
  return Math.max(
    MIN_BAR_HEIGHT,
    Math.round(ratio * MAX_BAR_HEIGHT),
  );
}
</script>

<style scoped lang="scss">
.audio-meter {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 40px;
}

.bar {
  width: 4px;
  min-height: 2px;
  background: var(--clr-primary-100);
  transition: height 0.05s linear;
}
</style>
