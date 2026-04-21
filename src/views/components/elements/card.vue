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
    <UiIcon
      name="corner-bracket"
      :size="40"
      class="card-corner top-left"
    />
    <UiIcon
      name="corner-bracket"
      :size="40"
      class="card-corner top-right"
    />
    <UiIcon
      name="corner-bracket"
      :size="40"
      class="card-corner bottom-left"
    />
    <UiIcon
      name="corner-bracket"
      :size="40"
      class="card-corner bottom-right"
    />

    <header class="card-header">
      <span class="brand-tag">{{ overlay.brand }}</span>
      <h2 class="card-title">{{ overlay.name }}</h2>
      <UiBadge
        class="card-status"
        :variant="is_planned ? 'dim' : 'active'"
      >
        {{ overlay.status }}
      </UiBadge>
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
        <div class="use-case-tags">
          <UiChip
            v-for="(keyword, index) in visible_use_cases"
            :key="index"
          >
            {{ keyword }}
          </UiChip>
          <UiChip
            v-if="extra_use_cases_count > 0"
            variant="overflow"
          >
            +{{ extra_use_cases_count }}
          </UiChip>
        </div>
      </div>
    </div>

    <div class="card-spec-grid">
      <UiDataPoint
        label="SIZE"
        :value="`${overlay.width} × ${overlay.height}`"
      />
      <UiDataPoint label="FPS" :value="overlay.fps" />
      <UiDataPoint label="CACHE" value="DISABLE" />
      <UiDataPoint label="CSS" value="CLEAR" />
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
          v-for="(req, index) in visible_requires"
          :key="index"
        >
          {{ req }}
        </li>
        <li
          v-if="extra_requires_count > 0"
          class="requires-overflow"
        >
          +{{ extra_requires_count }} more
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

    <button
      type="button"
      class="detail-button"
      @click="openDetail"
    >
      <span class="detail-icon">&#9670;</span>
      <span class="detail-label">DETAILS</span>
    </button>

    <PreviewModal
      :overlay="overlay"
      :is_open="is_modal_open"
      :pending_trigger="pending_trigger"
      @close="closeModal"
      @consume_trigger="pending_trigger = null"
    />

    <DetailModal
      :overlay="overlay"
      :is_open="is_detail_open"
      @close="closeDetail"
    />
  </article>
</template>

<script setup>
import DetailModal from '@modals/detail.vue';
import PreviewModal from '@modals/preview.vue';
import UiBadge from '@ui/badge.vue';
import UiChip from '@ui/chip.vue';
import UiDataPoint from '@ui/data-point.vue';
import UiIcon from '@ui/icon.vue';
import { parseEmphasis } from '@views/utils/markup.js';
import { computed, ref } from 'vue';

const COPIED_RESET_MS = 1500;
const MAX_VISIBLE_USE_CASES = 3;
const MAX_VISIBLE_REQUIRES = 3;

const props = defineProps({
  overlay: {
    type: Object,
    required: true,
  },
});

const is_copied = ref(false);
const is_modal_open = ref(false);
const is_detail_open = ref(false);
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

const visible_use_cases = computed(() => {
  if (!props.overlay.use_cases) {
    return [];
  }
  return props.overlay.use_cases.slice(0, MAX_VISIBLE_USE_CASES);
});

const extra_use_cases_count = computed(() => {
  if (!props.overlay.use_cases) {
    return 0;
  }
  return Math.max(
    0,
    props.overlay.use_cases.length - MAX_VISIBLE_USE_CASES,
  );
});

const visible_requires = computed(() => {
  return props.overlay.requires.slice(0, MAX_VISIBLE_REQUIRES);
});

const extra_requires_count = computed(() => {
  return Math.max(
    0,
    props.overlay.requires.length - MAX_VISIBLE_REQUIRES,
  );
});

function openModal(trigger_payload = null) {
  pending_trigger.value = trigger_payload;
  is_modal_open.value = true;
}

function closeModal() {
  is_modal_open.value = false;
  pending_trigger.value = null;
}

function openDetail() {
  is_detail_open.value = true;
}

function closeDetail() {
  is_detail_open.value = false;
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
@use "@app/scss/abstracts/mixins" as *;

.overlay-card {
  position: relative;
  padding: 1.75em 1.5em;
  background: rgba(255, 215, 0, 0.02);
  border: 1px solid var(--clr-border-100);
  display: grid;
  grid-auto-rows: auto;
  gap: 1em;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.overlay-card.is-planned {
  opacity: 0.4;
}

.card-corner {
  position: absolute;
  color: var(--clr-primary-100);
  z-index: 1;
}

.card-corner :deep(path) {
  stroke-width: 3;
}

.card-corner.top-left {
  top: -1px;
  left: -1px;
}

.card-corner.top-right {
  top: -1px;
  right: -1px;
  transform: scaleX(-1);
}

.card-corner.bottom-left {
  bottom: -1px;
  left: -1px;
  transform: scaleY(-1);
}

.card-corner.bottom-right {
  bottom: -1px;
  right: -1px;
  transform: scale(-1);
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

.card-status {
  grid-column: 2;
  grid-row: 1;
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
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}

.card-spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75em 1em;
  padding: 0.85em 0;
  border-top: 1px solid var(--clr-border-100);
  border-bottom: 1px solid var(--clr-border-100);
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

.requires-overflow {
  font-family: var(--font-mono);
  font-size: var(--fs-250);
  color: var(--clr-neutral-200);
  opacity: 0.5;
  position: relative;
}

.requires-overflow::before {
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

.detail-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  width: 100%;
  padding: 0.65em 1em;
  font-family: var(--font-mono);
  font-size: var(--fs-200);
  color: var(--clr-neutral-50);
  background: transparent;
  border: 1px solid var(--clr-border-100);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease,
    background 0.15s ease;
}

.detail-button:hover {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.04);
}

.detail-icon {
  color: var(--clr-primary-100);
  font-size: 0.9em;
  line-height: 1;
}

</style>
