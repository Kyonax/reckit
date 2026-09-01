/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Audio analyzer — singleton composable. One InputVolumeMeters
 * subscription per page; any caller (typically one AudioMeter)
 * receives the same levels buffer and tick counter.
 */

import { useObsWebsocket } from '@composables/use-obs-websocket.js';
import { ref } from 'vue';

const BAR_COUNT = 16;
const TARGET_SOURCE = 'Mic/Aux';
const PEAK_INDEX = 1;
const GAIN = 8;
const SMOOTHING = 0.2;
const DECAY_RATE = 0.85;
const VARIATION_CENTER = 0.5;
const VARIATION_RANGE = 0.7;
const MIN_AUDIBLE = 0.005;

const JITTER_SIZE = 256;
const JITTER_MASK = JITTER_SIZE - 1;
const JITTER_TABLE = new Float32Array(JITTER_SIZE);
for (let i = 0; i < JITTER_SIZE; i++) {
  JITTER_TABLE[i] = Math.random();
}

let shared_state = null;

export function useAudioAnalyzer({ options = {} } = {}) {
  if (shared_state) {
    return shared_state;
  }

  const bar_count = options.bar_count || BAR_COUNT;
  const { obs } = useObsWebsocket();

  const levels = new Float32Array(bar_count);
  const smoothed = new Float32Array(bar_count);

  const tick = ref(0);
  const active = ref(false);
  const source_name = ref('');

  let jitter_cursor = 0;

  function handleVolumeMeters(event) {
    const inputs = event?.inputs;
    if (!inputs || inputs.length === 0) {
      return;
    }

    let target = null;
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (input.inputName === TARGET_SOURCE
          && input.inputLevelsMul
          && input.inputLevelsMul.length > 0) {
        target = input;
        break;
      }
    }
    if (!target) {
      return;
    }

    if (source_name.value !== target.inputName) {
      source_name.value = target.inputName || 'obs';
    }
    if (!active.value) {
      active.value = true;
    }

    const channels = target.inputLevelsMul;
    let peak = 0;
    for (let i = 0; i < channels.length; i++) {
      const value = channels[i][PEAK_INDEX] || 0;
      if (value > peak) {
        peak = value;
      }
    }
    const raw_level = peak * GAIN > 1 ? 1 : peak * GAIN;
    const audible = raw_level > MIN_AUDIBLE;

    for (let i = 0; i < bar_count; i++) {
      const jitter = JITTER_TABLE[(i + jitter_cursor) & JITTER_MASK];
      const variation = 1 + (jitter - VARIATION_CENTER) * VARIATION_RANGE;
      let target_value = raw_level * variation;
      if (target_value > 1) {
        target_value = 1;
      } else if (target_value < 0) {
        target_value = 0;
      }

      const smooth_new = smoothed[i] * SMOOTHING
        + target_value * (1 - SMOOTHING);
      const next = audible ? smooth_new : smoothed[i] * DECAY_RATE;

      smoothed[i] = next;
      levels[i] = next;
    }

    jitter_cursor = (jitter_cursor + 1) & JITTER_MASK;
    tick.value++;
  }

  obs.on('InputVolumeMeters', handleVolumeMeters);

  shared_state = { levels, tick, active, source_name };
  return shared_state;
}
