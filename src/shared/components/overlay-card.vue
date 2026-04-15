<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  overlay-card — index card displaying one browser source.
  Shows URL, dimensions, FPS, requirements, and a copy button.
-->

<template>
  <article
    class="overlay-card"
    :class="{ 'is-planned': overlay.status === 'planned' }"
  >
    <corner-bracket
      position="top-left"
      :size="40"
      :stroke_width="3"
      class="card-corner"
    />
    <corner-bracket
      position="top-right"
      :size="40"
      :stroke_width="3"
      class="card-corner"
    />
    <corner-bracket
      position="bottom-left"
      :size="40"
      :stroke_width="3"
      class="card-corner"
    />
    <corner-bracket
      position="bottom-right"
      :size="40"
      :stroke_width="3"
      class="card-corner"
    />

    <header class="card-header">
      <span class="brand-tag">{{ overlay.brand }}</span>
      <h2 class="card-title">{{ overlay.name }}</h2>
      <span class="status-badge">{{ overlay.status }}</span>
    </header>

    <div class="card-description">
      <p>
        <template
          v-for="(segment, index) in description_segments"
          :key="index"
        >
          <strong
            v-if="segment.bold"
            class="emphasis"
          >{{ segment.text }}</strong>
          <template v-else>{{ segment.text }}</template>
        </template>
      </p>
      <div
        v-if="overlay.use_cases && overlay.use_cases.length"
        class="card-use-case"
      >
        <span class="use-case-label">WHEN TO USE</span>
        <ul class="use-case-tags">
          <li
            v-for="(keyword, index) in overlay.use_cases"
            :key="index"
            class="use-case-tag"
          >
            {{ keyword }}
          </li>
        </ul>
      </div>
    </div>

    <div class="card-spec-grid">
      <div class="spec">
        <span class="spec-label">SIZE</span>
        <span class="spec-value">
          {{ overlay.width }} × {{ overlay.height }}
        </span>
      </div>
      <div class="spec">
        <span class="spec-label">FPS</span>
        <span class="spec-value">{{ overlay.fps }}</span>
      </div>
      <div class="spec">
        <span class="spec-label">CACHE</span>
        <span class="spec-value">DISABLE</span>
      </div>
      <div class="spec">
        <span class="spec-label">CSS</span>
        <span class="spec-value">CLEAR</span>
      </div>
    </div>

    <div class="card-url-row">
      <code class="card-url">{{ full_url }}</code>
      <button
        type="button"
        class="copy-button"
        :class="{ copied: is_copied }"
        :disabled="overlay.status !== 'ready'"
        @click="copyUrl"
      >
        {{ is_copied ? 'COPIED' : 'COPY' }}
      </button>
    </div>

    <div v-if="overlay.requires.length" class="card-requires">
      <span class="requires-label">REQUIRES</span>
      <ul class="requires-list">
        <li
          v-for="(req, index) in overlay.requires"
          :key="index"
        >
          {{ req }}
        </li>
      </ul>
    </div>

    <div v-if="has_actions" class="card-actions">
      <span class="actions-label">PREVIEW</span>
      <div class="actions-row">
        <button
          type="button"
          class="action-button"
          :disabled="is_planned"
          :title="is_planned
            ? `${overlay.name} is planned — not yet available`
            : `Preview ${overlay.name} in a modal`"
          @click="openModal()"
        >
          <span class="action-icon">▸</span>
          <span class="action-label">OPEN</span>
        </button>

        <button
          v-for="trigger in overlay.triggers"
          :key="trigger.id"
          type="button"
          class="action-button trigger-button"
          :disabled="is_planned"
          :title="is_planned
            ? `${overlay.name} is planned — not yet available`
            : trigger.description"
          @click="openModal(trigger.payload)"
        >
          <span class="action-icon">●</span>
          <span class="action-label">{{ trigger.label }}</span>
        </button>
      </div>
    </div>

    <preview-modal
      :overlay="overlay"
      :is_open="is_modal_open"
      :pending_trigger="pending_trigger"
      @close="closeModal"
      @consume_trigger="pending_trigger = null"
    />
  </article>
</template>

<script setup>
import { computed, ref } from 'vue';

import CornerBracket from './corner-bracket.vue';
import PreviewModal from './preview-modal.vue';

const COPIED_RESET_MS = 1500;
const EMPHASIS_PATTERN = /\*\*(.+?)\*\*/g;

const props = defineProps({
  overlay: {
    type: Object,
    required: true,
  },
});

function parseEmphasis(text) {
  if (!text) {
    return [];
  }

  const segments = [];
  let last_index = 0;

  for (const match of text.matchAll(EMPHASIS_PATTERN)) {
    if (match.index > last_index) {
      segments.push({
        text: text.slice(last_index, match.index),
        bold: false,
      });
    }

    segments.push({ text: match[1], bold: true });
    last_index = match.index + match[0].length;
  }

  if (last_index < text.length) {
    segments.push({ text: text.slice(last_index), bold: false });
  }

  return segments;
}

const is_copied = ref(false);
const is_modal_open = ref(false);
const pending_trigger = ref(null);

const is_planned = computed(() => {
  return props.overlay.status === 'planned';
});

const description_segments = computed(() => {
  return parseEmphasis(props.overlay.description);
});

const has_actions = computed(() => {
  return props.overlay.status === 'ready'
    || (props.overlay.triggers
      && props.overlay.triggers.length > 0);
});

function openModal(trigger_payload = null) {
  pending_trigger.value = trigger_payload;
  is_modal_open.value = true;
}

function closeModal() {
  is_modal_open.value = false;
  pending_trigger.value = null;
}

const full_url = computed(() => {
  return `${window.location.origin}${props.overlay.path}`;
});

async function copyUrl() {
  if (props.overlay.status !== 'ready') {
    return;
  }

  try {
    await navigator.clipboard.writeText(full_url.value);
    is_copied.value = true;
    setTimeout(() => {
      is_copied.value = false;
    }, COPIED_RESET_MS);
  } catch {
    is_copied.value = false;
  }
}
</script>

<style scoped lang="scss">
@use "../../app/scss/abstracts/mixins" as *;

.overlay-card {
  position: relative;
  padding: 1.75em 1.5em;
  background: rgba(255, 215, 0, 0.02);
  border: 1px solid var(--clr-border-100);
  display: grid;
  grid-auto-rows: min-content;
  gap: 1em;
  overflow: hidden;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.overlay-card.is-planned {
  opacity: 0.4;
}

.overlay-card :deep(.card-corner) {
  color: var(--clr-primary-100);
  z-index: 1;
}

.overlay-card :deep(.card-corner.top-left) {
  top: -1px;
  left: -1px;
}

.overlay-card :deep(.card-corner.top-right) {
  top: -1px;
  right: -1px;
}

.overlay-card :deep(.card-corner.bottom-left) {
  bottom: -1px;
  left: -1px;
}

.overlay-card :deep(.card-corner.bottom-right) {
  bottom: -1px;
  right: -1px;
}

.card-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.35em 0.75em;
  min-width: 0;
}

.brand-tag {
  @include hud-label-base;
  position: static;
  grid-column: 1;
  font-size: var(--fs-200);
  color: var(--clr-primary-100);
  opacity: 0.7;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-title {
  grid-column: 1 / -1;
  font-family: var(--font-mono);
  font-size: var(--fs-475);
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--clr-neutral-50);
  word-break: break-word;
  min-width: 0;
}

.status-badge {
  @include hud-label-base;
  position: static;
  grid-column: 2;
  grid-row: 1;
  padding: 0.25em 0.65em;
  font-size: var(--fs-150);
  border: 1px solid var(--clr-primary-100);
  color: var(--clr-primary-100);
  letter-spacing: 0.18em;
  white-space: nowrap;
}

.is-planned .status-badge {
  border-color: var(--clr-neutral-200);
  color: var(--clr-neutral-200);
}

.card-description {
  display: flex;
  flex-direction: column;
  gap: 1em;
  font-size: var(--fs-275);
  line-height: 1.55;
  color: var(--clr-neutral-100);
}

.card-description p {
  opacity: 0.8;
  margin: 0;
}

.card-description .emphasis {
  color: var(--clr-neutral-50);
  font-weight: 700;
  opacity: 1;
}

.card-use-case {
  padding-top: 1em;
  border-top: 1px dashed var(--clr-border-100);
}

.use-case-label {
  @include hud-label-base;
  position: static;
  display: block;
  margin-bottom: 0.6em;
  font-size: var(--fs-150);
  letter-spacing: 0.25em;
  color: var(--clr-primary-100);
  opacity: 0.6;
}

.use-case-tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
  padding: 0;
  margin: 0;
}

.use-case-tag {
  padding: 0.25em 0.6em;
  font-family: var(--font-mono);
  font-size: var(--fs-175);
  letter-spacing: 0.1em;
  color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.06);
  border: 1px solid var(--clr-border-100);
  text-transform: lowercase;
  white-space: nowrap;
}

.card-spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75em 1em;
  padding: 0.85em 0;
  border-top: 1px solid var(--clr-border-100);
  border-bottom: 1px solid var(--clr-border-100);
}

.spec {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  min-width: 0;
}

.spec-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-150);
  letter-spacing: 0.18em;
  opacity: 0.5;
}

.spec-value {
  font-family: var(--font-mono);
  font-size: var(--fs-300);
  color: var(--clr-primary-100);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-url-row {
  display: flex;
  align-items: stretch;
  gap: 0;
  border: 1px solid var(--clr-border-100);
  background: rgba(0, 0, 0, 0.4);
  min-width: 0;
}

.card-url {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.75em 0.9em;
  font-family: var(--font-mono);
  font-size: var(--fs-200);
  color: var(--clr-neutral-50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: all;
}

.copy-button {
  @include hud-label-base;
  position: static;
  flex-shrink: 0;
  padding: 0 1em;
  font-size: var(--fs-175);
  color: var(--clr-neutral-500);
  background: var(--clr-primary-100);
  letter-spacing: 0.2em;
  transition: background 0.2s ease, color 0.2s ease;
}

.copy-button:hover:not(:disabled) {
  background: var(--clr-primary-50);
}

.copy-button.copied {
  background: var(--clr-success-100);
  color: var(--clr-neutral-50);
}

.copy-button:disabled {
  background: var(--clr-neutral-300);
  color: var(--clr-neutral-100);
  cursor: not-allowed;
}

.card-requires {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.requires-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-150);
  letter-spacing: 0.18em;
  opacity: 0.5;
}

.requires-list {
  list-style: none;
  display: grid;
  gap: 0.35em;
  padding-left: 1em;
  margin: 0;
}

.requires-list li {
  font-family: var(--font-mono);
  font-size: var(--fs-250);
  line-height: 1.4;
  color: var(--clr-neutral-100);
  opacity: 0.75;
  position: relative;
  word-break: break-word;
}

.requires-list li::before {
  content: "›";
  position: absolute;
  left: -1em;
  color: var(--clr-primary-100);
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.actions-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-150);
  letter-spacing: 0.18em;
  opacity: 0.5;
}

.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.55em 0.9em;
  font-family: var(--font-mono);
  font-size: var(--fs-200);
  color: var(--clr-neutral-50);
  background: transparent;
  border: 1px solid var(--clr-border-100);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: color 0.15s ease, border-color 0.15s ease,
    background 0.15s ease;
}

.action-button:hover:not(:disabled) {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.04);
}

.action-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-icon {
  color: var(--clr-primary-100);
  font-size: 0.9em;
  line-height: 1;
}

</style>
