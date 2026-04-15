/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Audio analyzer — reads real-time volume from OBS via
 * the InputVolumeMeters WebSocket event. Generates a
 * multi-band display with smoothed variation around the
 * actual level (OBS sends a single level per input, not
 * frequency data — standard for overlay visualizers).
 */

import { onUnmounted, ref } from 'vue';

const BAR_COUNT = 16;
const MAX_LEVEL = 255;
const GAIN = 8;
const SMOOTHING = 0.2;
const VARIATION_RANGE = 0.7;
const VARIATION_CENTER = 0.5;
const DECAY_RATE = 0.85;
const MIN_AUDIBLE = 0.005;
const PEAK_INDEX = 1;

/**
 * @param {object} params
 * @param {object} params.obs - OBSWebSocket instance
 * @param {object} [params.options]
 * @param {string} [params.options.source_name] - OBS input
 *   name to monitor. Empty = first audio input found.
 * @param {number} [params.options.bar_count] - bars
 */
export function useAudioAnalyzer({ obs, options = {} }) {
  const bar_count = options.bar_count || BAR_COUNT;
  const target_source = options.source_name || '';

  const levels = ref(
    Array.from({ length: bar_count }, () => 0),
  );
  const active = ref(false);
  const source_name = ref('');

  let raw_level = 0;
  const previous_bands = new Float32Array(bar_count);
  let animation_id = null;
  let is_stopped = false;

  /**
   * Handle InputVolumeMeters — extract peak level.
   * Each channel has [magnitude, peak, input_peak].
   * We use index 1 (peak) for responsive visualization.
   * Skips inputs with empty inputLevelsMul.
   * Runs at ~50Hz, zero allocation in hot path.
   */
  function handleVolumeMeters(event) {
    const { inputs } = event;

    if (!inputs || inputs.length === 0) {
      return;
    }

    let target = null;

    if (target_source) {
      target = inputs.find(
        (input) => input.inputName === target_source,
      );
    }

    if (!target) {
      target = inputs.find(
        (input) => input.inputLevelsMul
          && input.inputLevelsMul.length > 0,
      );
    }

    if (!target) {
      return;
    }

    source_name.value = target.inputName;
    active.value = true;

    const channel_levels = target.inputLevelsMul;

    if (!channel_levels || channel_levels.length === 0) {
      raw_level = 0;
      return;
    }

    let peak = 0;

    for (let ch = 0; ch < channel_levels.length; ch++) {
      const channel = channel_levels[ch];
      const value = channel[PEAK_INDEX] || 0;

      if (value > peak) {
        peak = value;
      }
    }

    raw_level = Math.min(1, peak * GAIN);
  }

  /**
   * Compute visual band levels from the single raw_level.
   * Adds per-band variation + exponential smoothing.
   * Runs on rAF (~60Hz).
   */
  function renderFrame() {
    if (is_stopped) {
      return;
    }

    const base = raw_level * MAX_LEVEL;
    const result = new Array(bar_count);

    for (let i = 0; i < bar_count; i++) {
      const variation = 1
        + (Math.random() - VARIATION_CENTER) * VARIATION_RANGE;
      const target_value = Math.min(
        MAX_LEVEL,
        Math.max(0, base * variation),
      );

      const smoothed = previous_bands[i] * SMOOTHING
        + target_value * (1 - SMOOTHING);

      const decayed = raw_level > MIN_AUDIBLE
        ? smoothed
        : previous_bands[i] * DECAY_RATE;

      previous_bands[i] = decayed;
      result[i] = Math.round(decayed);
    }

    levels.value = result;
    animation_id = requestAnimationFrame(renderFrame);
  }

  function start() {
    obs.on('InputVolumeMeters', handleVolumeMeters);
    animation_id = requestAnimationFrame(renderFrame);
  }

  function stop() {
    is_stopped = true;
    obs.off('InputVolumeMeters', handleVolumeMeters);

    if (animation_id) {
      cancelAnimationFrame(animation_id);
      animation_id = null;
    }

    raw_level = 0;
    previous_bands.fill(0);
    active.value = false;
  }

  onUnmounted(stop);
  start();

  return { levels, active, source_name, stop };
}
