<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  cam-log — Cyberpunk HUD overlay for webcam (camera to person).
  Renders on top of a Video Capture source in OBS.
  Transparent background — webcam shows through.
-->

<template>
  <div class="cam-log-overlay">
    <HudFrame
      :width="CANVAS_WIDTH"
      :height="CANVAS_HEIGHT"
      :labels="hud_labels"
    >
      <!-- Top sub-labels -->
      <span class="hud-label rec-frame">REC FRAME</span>
      <span class="hud-label cam-online">CAM ONLINE</span>

      <!-- Bottom-left: identity block (from brand.js) -->
      <div class="identity-block">
        <span class="identity-name">{{ brand.identity.author }}</span>
        <span class="identity-handle">{{ brand.identity.display_handle }}</span>
      </div>

      <!-- Bottom-right: toolkit identity -->
      <span class="hud-label toolkit-id">RECKIT {{ VERSION_TAG }}</span>

      <!-- Center crosshair -->
      <div class="crosshair">
        <div class="crosshair-h" />
        <div class="crosshair-v" />
      </div>

      <!-- Bottom status bar -->
      <div class="status-bar">
        <HudTimer
          :is_recording="is_recording"
          :elapsed_time="elapsed_time"
        />

        <AudioMeter
          :obs="obs"
          source_name="Mic/Aux"
          @update:state="audio_state = $event"
        />
      </div>

      <!-- Connection status -->
      <span
        v-if="!connected"
        class="hud-label offline"
      >
        OFFLINE
      </span>

      <!-- Diagnostic readout -->
      <div class="debug-info">
        <LiveReadout
          :text="debug_text"
          :refresh_ms="DEBUG_REFRESH_MS"
        />
      </div>
    </HudFrame>
  </div>
</template>

<script setup>
import { useObsWebsocket } from '@composables/use-obs-websocket.js';
import { useRecordingStatus } from '@composables/use-recording-status.js';
import { useSceneName } from '@composables/use-scene-name.js';
import HudFrame from '@hud/frame.vue';
import HudTimer from '@hud/timer.vue';
import { getBrand } from '@shared/brand-loader.js';
import { VERSION_TAG } from '@shared/version.js';
import AudioMeter from '@widgets/hud/audio-meter.vue';
import LiveReadout from '@widgets/ui/live-readout.vue';
import { computed, ref } from 'vue';

const brand = getBrand('@kyonax_on_tech');

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const TAKE_PAD_LENGTH = 2;
const DEBUG_REFRESH_MS = 200;

const { obs, connected } = useObsWebsocket();
const {
  is_recording,
  elapsed_time,
  take_count,
} = useRecordingStatus({
  obs,
  connected,
});
const { scene_name } = useSceneName({
  obs,
  connected,
});

const audio_state = ref({
  active: false,
  source: '',
  peak: 0,
});

const hud_labels = computed(() => {
  const name = scene_name.value || '---';
  const take = String(take_count.value)
    .padStart(TAKE_PAD_LENGTH, '0');
  return {
    top_left: 'SYS.LOG',
    top_right: `SES::${name}::T${take}`,
    bottom_left: '',
    bottom_right: '',
  };
});

const debug_text = computed(() => {
  const ws = connected.value ? 'ON' : 'OFF';
  const audio = audio_state.value.active
    ? audio_state.value.source
    : 'NONE';
  return `WS:${ws} | AUDIO:${audio} | L0:${audio_state.value.peak}`;
});
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.cam-log-overlay {
  width: var(--canvas-width);
  height: var(--canvas-height);
  position: relative;
  background: transparent;
}

.hud-label {
  @include hud-label-base;
  opacity: 0.5;
}

.rec-frame {
  top: 4.5em;
  left: 4em;
  color: var(--clr-primary-100);
  opacity: 0.8;
}

.cam-online {
  top: 4.5em;
  right: 4em;
  color: var(--clr-primary-100);
  opacity: 0.8;
}

.identity-block {
  position: absolute;
  bottom: 3em;
  left: 4em;
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

.identity-name {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-425);
  opacity: 0.4;
}

.identity-handle {
  @include hud-label-base;
  position: static;
  letter-spacing: 1px;
  color: var(--clr-primary-100);
  opacity: 0.8;
}

.toolkit-id {
  bottom: 4.5em;
  right: 4em;
  font-size: var(--fs-300);
  letter-spacing: 3px;
  opacity: 0.4;
}

.offline {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--fs-500);
  color: var(--clr-neutral-200);
  letter-spacing: 4px;
}

.debug-info {
  position: absolute;
  bottom: 5.5em;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--fs-300);
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.6;
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  --arm-length: 20px;
}

.crosshair-h,
.crosshair-v {
  position: absolute;
  background: var(--clr-border-100);
}

.crosshair-h {
  width: var(--arm-length);
  height: 1px;
  top: 0;
  left: calc(var(--arm-length) / -2);
}

.crosshair-v {
  width: 1px;
  height: var(--arm-length);
  top: calc(var(--arm-length) / -2);
  left: 0;
}

.status-bar {
  position: absolute;
  bottom: var(--hud-bar-offset);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: var(--hud-bar-gap);
}
</style>
