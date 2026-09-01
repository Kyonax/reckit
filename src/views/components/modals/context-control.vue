<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  context-control — modal opened from the context-screen source card
  (Plan #context-screen D4). Lets the user pick the active .org slug,
  toggle the right sidebar, and watch the live result inside an
  iframe scoped to /<brand>/context-screen. State flows through
  useContextChannel — the iframe receives BroadcastChannel messages
  from the same origin and reacts in real time.

  Three sections: clickable slug list (active one badged with
  <UiBadge variant="active">), open-sidebar toggle, live preview.

  Binding: <ContextControlModal>. Composed by <Card> when the source
  is the context-screen entry (conditional render on source.id).

  Props:
    overlay — source registry entry (from sources.js).
    is_open — modal open state (parent owns).

  Emits:
    close — modal backdrop click / ESC / X.
-->

<template>
  <BaseModal
    :is_open="is_open"
    @close="close"
  >
    <template #header>
      <span class="modal-brand">{{ overlay.brand }}</span>
      <span class="modal-title">{{ overlay.name }}</span>
      <span class="modal-spec">CONTROLS</span>
    </template>

    <div class="control-grid">
      <section class="control-list">
        <header class="control-list__header">
          <span class="control-list__label">CONTEXTS</span>
          <span class="control-list__hint">
            {{ slugs.length }} discovered for {{ overlay.brand }}
          </span>
        </header>

        <ul
          v-if="slugs.length"
          class="control-list__items"
        >
          <li
            v-for="entry in slugs"
            :key="entry.slug"
            :class="[
              'control-list__item',
              { 'control-list__item--active':
                entry.slug === channel.active_slug.value },
              { 'control-list__item--errored': entry.parse_error },
            ]"
          >
            <button
              type="button"
              class="control-list__button"
              @click="selectSlug(entry.slug)"
            >
              <span class="control-list__slug">{{ entry.slug }}</span>
              <span
                v-if="entry.parsed && entry.parsed.title"
                class="control-list__title"
              >{{ entry.parsed.title }}</span>
              <span
                v-else-if="entry.parse_error"
                class="control-list__error"
              >{{ entry.parse_error.message }}</span>
            </button>

            <UiBadge
              v-if="entry.slug === channel.active_slug.value"
              variant="active"
            >
              ACTIVE
            </UiBadge>
            <UiBadge
              v-else-if="entry.parse_error"
              variant="dim"
            >
              ERROR
            </UiBadge>
          </li>
        </ul>

        <p
          v-else
          class="control-list__empty"
        >
          No .org files discovered. Drop one at
          <code>{{ overlay.brand }}/data/contexts/&lt;slug&gt;.org</code>
          to author a context.
        </p>

        <div class="control-list__toggles">
          <button
            type="button"
            class="control-toggle"
            :class="{ 'control-toggle--on': channel.sidebar_open.value }"
            @click="channel.toggleSidebar()"
          >
            <span class="control-toggle__dot" />
            <span class="control-toggle__label">
              {{ channel.sidebar_open.value
                ? 'SIDEBAR OPEN'
                : 'SIDEBAR CLOSED' }}
            </span>
          </button>
        </div>
      </section>

      <section class="control-stage">
        <header class="control-stage__header">
          <span class="control-stage__label">LIVE PREVIEW</span>
          <span class="control-stage__spec">
            {{ overlay.width }} × {{ overlay.height }}
            @ {{ overlay.fps }}
          </span>
        </header>
        <div
          ref="stage_el"
          class="control-stage__inner"
          :style="aspect_style"
        >
          <iframe
            ref="iframe_ref"
            class="control-stage__iframe"
            :src="full_url"
            :style="iframe_size_style"
            :title="`${overlay.name} live preview`"
          />
        </div>
      </section>
    </div>

    <template #footer>
      <button
        type="button"
        class="action-button"
        @click="reload"
      >
        <span class="action-icon">↻</span>
        <span class="action-label">RELOAD IFRAME</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { useContextChannel } from '@composables/use-context-channel.js';
import BaseModal from '@modals/base.vue';
import { getContexts } from '@shared/brand-loader.js';
import UiBadge from '@ui/badge.vue';
import {
  computed, nextTick, onMounted, onUnmounted, ref, watch,
} from 'vue';

const RESIZE_DEBOUNCE_MS = 100;

const props = defineProps({
  overlay: {
    type: Object,
    required: true,
  },
  is_open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

const channel = useContextChannel();

const stage_el = ref(null);
const iframe_ref = ref(null);

const slugs = computed(() => {
  const contexts = getContexts(props.overlay.brand);
  return Object.keys(contexts).map((slug) => ({
    slug,
    parsed: contexts[slug].parsed,
    parse_error: contexts[slug].parse_error,
  }));
});

const full_url = computed(() => {
  return `${window.location.origin}${props.overlay.path}`;
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

function selectSlug(slug) {
  channel.setActiveSlug(slug);
}

function close() {
  emit('close');
}

function applyScale() {
  const element = stage_el.value;
  if (!element) {
    return;
  }
  const width = element.getBoundingClientRect().width;
  const scale = width / props.overlay.width;
  element.style.setProperty('--iframe-scale', scale);
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

watch(() => props.is_open, async (open) => {
  if (!open) {
    return;
  }
  await nextTick();
  requestAnimationFrame(applyScale);
});

let resize_timer = null;

function handleResize() {
  if (resize_timer) {
    clearTimeout(resize_timer);
  }
  resize_timer = setTimeout(applyScale, RESIZE_DEBOUNCE_MS);
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resize_timer) {
    clearTimeout(resize_timer);
  }
});
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

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
  color: var(--clr-neutral-100);
}

.control-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 1.5em;
  padding: 1.5em;
}

.control-list {
  display: flex;
  flex-direction: column;
  gap: 1em;
  min-width: 0;
}

.control-list__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1em;
}

.control-list__label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  letter-spacing: 0.2em;
  color: var(--clr-primary-100);
}

.control-list__hint {
  font-family: var(--font-mono);
  font-size: var(--fs-150);
  color: var(--clr-neutral-100);
}

.control-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  max-height: 50vh;
  overflow-y: auto;
}

.control-list__item {
  display: flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.6em 0.8em;
  border: 1px solid var(--clr-border-100);
  background: var(--clr-neutral-50-02);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.control-list__item--active {
  border-color: var(--clr-primary-100);
  background: var(--clr-primary-100-06);
}

.control-list__item--errored {
  border-color: var(--clr-error-100);
}

.control-list__button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2em;
  flex: 1 1 auto;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-family: inherit;
}

.control-list__slug {
  font-family: var(--font-mono);
  font-size: var(--fs-275);
  color: var(--clr-neutral-50);
  letter-spacing: 0.05em;
}

.control-list__title {
  font-family: var(--font-mono);
  font-size: var(--fs-175);
  color: var(--clr-neutral-100);
  letter-spacing: 0.04em;
}

.control-list__error {
  font-family: var(--font-mono);
  font-size: var(--fs-175);
  color: var(--clr-error-100);
  letter-spacing: 0.04em;
}

.control-list__empty {
  font-family: var(--font-mono);
  font-size: var(--fs-225);
  color: var(--clr-neutral-100);
  margin: 0;
  padding: 1em;
  border: 1px dashed var(--clr-border-100);
}

.control-list__empty code {
  color: var(--clr-primary-100);
}

.control-list__toggles {
  display: flex;
  gap: 0.6em;
  margin-top: 0.4em;
}

.control-toggle {
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
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.control-toggle:hover {
  border-color: var(--clr-primary-100);
}

.control-toggle--on {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
  background: var(--clr-primary-100-06);
}

.control-toggle__dot {
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  background: var(--clr-neutral-200);
  border-radius: 0;
}

.control-toggle--on .control-toggle__dot {
  background: var(--clr-primary-100);
}

.control-stage {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  min-width: 0;
}

.control-stage__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.control-stage__label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  letter-spacing: 0.2em;
  color: var(--clr-primary-100);
}

.control-stage__spec {
  font-family: var(--font-mono);
  font-size: var(--fs-150);
  color: var(--clr-neutral-100);
}

.control-stage__inner {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--clr-neutral-500);
  border: 1px solid var(--clr-border-100);
}

.control-stage__iframe {
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  background: transparent;
  transform: scale(var(--iframe-scale, 0.5));
  transform-origin: top left;
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
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.action-button:hover {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
  background: var(--clr-primary-100-04);
}

.action-icon {
  color: var(--clr-primary-100);
}
</style>
