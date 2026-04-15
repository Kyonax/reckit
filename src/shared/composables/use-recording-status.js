/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { onUnmounted, ref, watch } from 'vue';

const TIMER_INTERVAL = 1000;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const PAD_LENGTH = 2;

/**
 * Composable — recording state from OBS WebSocket.
 * Tracks recording status, elapsed time, and take count
 * (incremented every time recording starts in the session).
 *
 * @param {object} params
 * @param {object} params.obs - OBSWebSocket instance
 * @param {import('vue').Ref<boolean>} params.connected
 */
export function useRecordingStatus({ obs, connected }) {
  const is_recording = ref(false);
  const elapsed_time = ref('00:00:00');
  const record_state = ref('stopped');
  const take_count = ref(0);

  let start_timestamp = 0;
  let timer_id = null;

  function formatElapsed(ms) {
    const total_seconds = Math.floor(ms / MS_PER_SECOND);
    const hours = Math.floor(
      total_seconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR),
    );
    const minutes = Math.floor(
      (total_seconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR))
      / SECONDS_PER_MINUTE,
    );
    const seconds = total_seconds % SECONDS_PER_MINUTE;

    return [hours, minutes, seconds]
      .map((n) => String(n).padStart(PAD_LENGTH, '0'))
      .join(':');
  }

  function startTimer() {
    stopTimer();
    start_timestamp = Date.now();

    timer_id = setInterval(() => {
      const delta = Date.now() - start_timestamp;
      elapsed_time.value = formatElapsed(delta);
    }, TIMER_INTERVAL);
  }

  function stopTimer() {
    if (timer_id) {
      clearInterval(timer_id);
      timer_id = null;
    }
  }

  function handleRecordStateChanged(event) {
    const { outputState: output_state } = event;
    record_state.value = output_state;

    if (output_state === 'OBS_WEBSOCKET_OUTPUT_STARTED') {
      is_recording.value = true;
      take_count.value += 1;
      startTimer();
    } else if (
      output_state === 'OBS_WEBSOCKET_OUTPUT_STOPPED'
    ) {
      is_recording.value = false;
      stopTimer();
      elapsed_time.value = '00:00:00';
    }
  }

  async function fetchInitialState() {
    try {
      const status = await obs.call('GetRecordStatus');
      is_recording.value = status.outputActive;

      if (status.outputActive && status.outputDuration) {
        start_timestamp = Date.now() - status.outputDuration;
        elapsed_time.value = formatElapsed(
          status.outputDuration,
        );
        startTimer();
      }
    } catch {
      is_recording.value = false;
    }
  }

  obs.on('RecordStateChanged', handleRecordStateChanged);

  watch(connected, (is_connected) => {
    if (is_connected) {
      fetchInitialState();
    } else {
      stopTimer();
    }
  });

  onUnmounted(() => {
    stopTimer();
    obs.off('RecordStateChanged', handleRecordStateChanged);
  });

  return {
    is_recording,
    elapsed_time,
    record_state,
    take_count,
  };
}
