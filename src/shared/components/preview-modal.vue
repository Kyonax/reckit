<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  preview-modal — overlay preview in a stage that matches the
  overlay's canvas aspect-ratio. The modal is responsive: its
  width adapts to the viewport, and the iframe scales to fit.
  postMessage triggers fire to the iframe's contentWindow.
-->

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="is_open"
        class="modal-backdrop"
        @click.self="close"
      >
        <div class="modal">
          <header class="modal-header">
            <span class="modal-brand">{{ overlay.brand }}</span>
            <span class="modal-title">{{ overlay.name }}</span>
            <span class="modal-spec">
              {{ overlay.width }} × {{ overlay.height }} @ {{ overlay.fps }}
            </span>
            <button
              type="button"
              class="modal-close"
              aria-label="Close preview"
              @click="close"
            >
              ×
            </button>
          </header>

          <div class="modal-stage">
            <div
              ref="stage_el"
              class="stage-inner"
              :style="aspect_style"
            >
              <iframe
                ref="iframe_ref"
                class="modal-iframe"
                :src="full_url"
                :style="iframe_size_style"
                :title="`${overlay.name} preview`"
                @load="onIframeLoad"
              />
            </div>
          </div>

          <footer class="modal-actions">
            <button
              type="button"
              class="action-button reload-button"
              title="Reload the iframe"
              @click="reload"
            >
              <span class="action-icon">↻</span>
              <span class="action-label">RELOAD</span>
            </button>

            <template v-if="has_triggers">
              <span class="actions-divider" />
              <span class="actions-label">TRIGGERS</span>
              <div class="actions-row">
                <button
                  v-for="trigger in overlay.triggers"
                  :key="trigger.id"
                  type="button"
                  class="action-button"
                  :title="trigger.description"
                  @click="fire(trigger)"
                >
                  <span class="action-icon">●</span>
                  <span class="action-label">{{ trigger.label }}</span>
                </button>
              </div>
            </template>
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import {
  computed, nextTick, onMounted, onUnmounted, ref, watch,
} from 'vue';

const READY_DELAY_MS = 300;

const props = defineProps({
  overlay: {
    type: Object,
    required: true,
  },
  is_open: {
    type: Boolean,
    default: false,
  },
  pending_trigger: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'consume_trigger']);

const stage_el = ref(null);
const iframe_ref = ref(null);

const full_url = computed(() => {
  return `${window.location.origin}${props.overlay.path}`;
});

const has_triggers = computed(() => {
  return Boolean(
    props.overlay.triggers && props.overlay.triggers.length,
  );
});

const aspect_style = computed(() => {
  return {
    aspectRatio: `${props.overlay.width} / ${props.overlay.height}`,
  };
});

const iframe_size_style = computed(() => {
  return {
    width: `${props.overlay.width}px`,
    height: `${props.overlay.height}px`,
  };
});

/**
 * Measure the stage width and write the scale factor as a
 * CSS custom property. Bypasses Vue reactivity to avoid any
 * re-render feedback loop.
 */
function applyScale() {
  const element = stage_el.value;

  if (!element) {
    return;
  }

  const width = element.clientWidth;
  const scale = width / props.overlay.width;

  element.style.setProperty('--iframe-scale', scale);
}

function close() {
  emit('close');
}

function fire(trigger) {
  const target = iframe_ref.value;

  if (!target || !target.contentWindow) {
    return;
  }

  target.contentWindow.postMessage(
    trigger.payload,
    window.location.origin,
  );
}

function reload() {
  const target = iframe_ref.value;

  if (!target) {
    return;
  }

  const url = target.src;
  target.src = '';
  setTimeout(() => {
    target.src = url;
  }, 0);
}

function onIframeLoad() {
  if (props.pending_trigger) {
    setTimeout(() => {
      fire({ payload: props.pending_trigger });
      emit('consume_trigger');
    }, READY_DELAY_MS);
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape' && props.is_open) {
    close();
  }
}

watch(() => props.is_open, async (open) => {
  if (!open) {
    return;
  }

  await nextTick();
  requestAnimationFrame(applyScale);
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', applyScale);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', applyScale);
});
</script>

<style scoped lang="scss">
@use "../../app/scss/abstracts/mixins" as *;

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2em;
}

.modal {
  display: flex;
  flex-direction: column;
  width: min(1100px, calc(100vw - 4em));
  background: var(--clr-neutral-500);
  border: 1px solid var(--clr-primary-300);
  max-height: calc(100vh - 4em);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.75em 1.25em;
  border-bottom: 1px solid var(--clr-border-100);
}

.modal-brand {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  color: var(--clr-primary-100);
  letter-spacing: 0.2em;
  opacity: 0.7;
}

.modal-title {
  font-family: var(--font-mono);
  font-size: var(--fs-475);
  font-weight: 700;
  color: var(--clr-neutral-50);
  letter-spacing: 0.05em;
}

.modal-spec {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  letter-spacing: 0.2em;
  color: var(--clr-neutral-200);
  margin-left: auto;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  font-size: var(--fs-525);
  line-height: 1;
  color: var(--clr-neutral-100);
  border: 1px solid var(--clr-border-100);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.modal-close:hover {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
}

.modal-stage {
  padding: 1em;
  background: rgba(255, 255, 255, 0.04);
}

.stage-inner {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--clr-neutral-500);
}

.modal-iframe {
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  background: transparent;
  transform: scale(var(--iframe-scale, 0.5));
  transform-origin: top left;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.75em 1.25em;
  border-top: 1px solid var(--clr-border-100);
}

.actions-divider {
  width: 1px;
  height: 1.5em;
  background: var(--clr-border-100);
  margin: 0 0.5em;
}

.actions-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  letter-spacing: 0.2em;
  color: var(--clr-neutral-200);
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.5em 1em;
  font-family: var(--font-mono);
  font-size: var(--fs-275);
  color: var(--clr-neutral-50);
  background: transparent;
  border: 1px solid var(--clr-border-100);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease,
    background 0.15s ease;
}

.action-button:hover {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.04);
}

.action-icon {
  color: var(--clr-primary-100);
}

.reload-button .action-icon {
  font-size: 1.1em;
  line-height: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
