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
    <HudFrame :width="CANVAS_WIDTH" :height="CANVAS_HEIGHT">
      <div class="hud-group group--top-left">
        <span class="hud-text">{{ brand.host }}</span>
        <span class="hud-text hud-text--primary session-date">
          {{ session_date }}
        </span>
      </div>

      <div class="hud-group group--top-right">
        <span class="hud-text">
          <span class="bracket">[</span>{{ session_label }}<span class="bracket">]</span>
          {{ session_id }}
        </span>
        <span class="hud-text hud-text--primary cam-online">CAM ONLINE</span>
      </div>

      <div class="hud-group group--bottom-left group--identity">
        <span class="hud-text">{{ brand.identity.author }}</span>
        <span class="hud-text hud-text--primary">
          {{ brand.identity.display_handle }}
        </span>
      </div>

      <span class="hud-text toolkit-id">RECKIT {{ VERSION_TAG }}</span>

      <div class="crosshair">
        <div class="crosshair-h" />
        <div class="crosshair-v" />
      </div>

      <span
        v-if="!connected"
        class="hud-text offline"
      >
        OFFLINE
      </span>
    </HudFrame>

    <div class="dynamic-layer">
      <div class="status-bar">
        <HudTimer
          :is_recording="is_recording"
          :elapsed_time="elapsed_time"
        />

        <AudioMeter
          @update:state="audio_state = $event"
        />
      </div>

      <div class="debug-info">
        <LiveReadout
          :text="debug_text"
          :refresh_ms="DEBUG_REFRESH_MS"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useContextChannel } from '@composables/use-context-channel.js';
import { useObsWebsocket } from '@composables/use-obs-websocket.js';
import { useRecordingStatus } from '@composables/use-recording-status.js';
import { useSceneName } from '@composables/use-scene-name.js';
import HudFrame from '@hud/frame.vue';
import HudTimer from '@hud/timer.vue';
import { getBrand } from '@shared/brand-loader.js';
import { VERSION_TAG } from '@shared/version.js';
import AudioMeter from '@widgets/hud/audio-meter.vue';
import LiveReadout from '@widgets/ui/live-readout.vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { computed, ref } from 'vue';

dayjs.extend(utc);

const brand = getBrand('@kyonax_on_tech');

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const TAKE_PAD_LENGTH = 2;
const DEBUG_REFRESH_MS = 200;
const DEFAULT_SESSION_LABEL = 'SESSION';

const { connected } = useObsWebsocket();
const {
  is_recording,
  elapsed_time,
  take_count,
} = useRecordingStatus();
const { scene_name } = useSceneName();

// Bracketed label on the top-right row. Driven live from the OBS script
// panel through the relay control plane (§1.16); falls back to the
// hardcoded default whenever the relay carries nothing.
const channel = useContextChannel();

const session_label = computed(() => {
  const label = (channel.cam_label.value || '').trim();
  return (label || DEFAULT_SESSION_LABEL).toUpperCase();
});

const audio_state = ref({
  active: false,
  source: '',
  peak: 0,
});

const session_date = dayjs()
  .utc()
  .format(`[${brand.region} ∇ ]DD.MM.YYYY[ // ]ddd`)
  .toUpperCase();

const session_id = computed(() => {
  const name = (scene_name.value || '---').toUpperCase();
  const take = String(take_count.value).padStart(TAKE_PAD_LENGTH, '0');
  return `${name}::T${take}`;
});

const debug_text = computed(() => {
  const ws = connected.value ? 'ON' : 'OFF';
  const audio = audio_state.value.active
    ? audio_state.value.source
    : 'NONE';
  return `WS:${ws} | AUDIO:${audio} | L0:${audio_state.value.peak.toFixed(3)}`;
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

.dynamic-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hud-group {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: var(--hud-group-gap);
  contain: layout paint;
}

.group--top-left {
  top: 3em;
  left: 4em;
  align-items: flex-start;
}

.group--top-right {
  top: 3em;
  right: 4em;
  align-items: flex-end;
  text-align: right;
}

.group--bottom-left {
  bottom: 3em;
  left: 4em;
  align-items: flex-start;
}

.group--identity {
  gap: calc(var(--hud-group-gap) / 2);
}

.hud-text {
  @include hud-text-base;
  opacity: 0.82;
}

.hud-text--primary {
  color: var(--clr-primary-100);
  text-shadow: var(--hud-glow);
  opacity: 1;
}

.session-date,
.cam-online {
  font-size: var(--fs-425);
}

.bracket {
  display: inline-block;
  transform: translateY(-0.12em);
}

.toolkit-id {
  position: absolute;
  bottom: 3em;
  right: 4em;
  font-size: var(--fs-350);
  letter-spacing: 3px;
  opacity: 0.82;
}

.offline {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--fs-500);
  letter-spacing: 4px;
  opacity: 1;
}

.status-bar {
  position: absolute;
  bottom: var(--hud-bar-offset);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: var(--hud-bar-gap);
  contain: layout paint;
}

.debug-info {
  position: absolute;
  bottom: 5.5em;
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--fs-300);
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.72;
  text-shadow: var(--hud-halo-text), var(--hud-glow);
  contain: layout paint;
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
  background: var(--clr-neutral-100);
  opacity: 0.4;
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
</style>
