<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  detail-modal — full overlay detail view. Shows the complete
  description, all use_cases, and all requirements without
  truncation. Uses base-modal for the generic modal shell.
-->

<template>
  <BaseModal
    :is_open="is_open"
    :max_width="MODAL_WIDTH"
    @close="$emit('close')"
  >
    <template #header>
      <span class="detail-brand">{{ overlay.brand }}</span>
      <span class="detail-title">{{ overlay.name }}</span>
      <UiBadge
        :variant="overlay.status === 'planned' ? 'dim' : 'active'"
      >
        {{ overlay.status }}
      </UiBadge>
    </template>

    <div class="detail-content">
      <section class="detail-section">
        <span class="detail-label">DESCRIPTION</span>
        <p class="detail-description">
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
      </section>

      <section
        v-if="overlay.use_cases && overlay.use_cases.length"
        class="detail-section"
      >
        <span class="detail-label">USE CASES</span>
        <div class="detail-tags">
          <UiChip
            v-for="(keyword, index) in overlay.use_cases"
            :key="index"
          >
            {{ keyword }}
          </UiChip>
        </div>
      </section>

      <section class="detail-section">
        <span class="detail-label">SPECS</span>
        <div class="detail-spec-grid">
          <UiDataPoint
            label="SIZE"
            :value="`${overlay.width} × ${overlay.height}`"
          />
          <UiDataPoint label="FPS" :value="overlay.fps" />
          <UiDataPoint label="CACHE" value="DISABLE" />
          <UiDataPoint label="CSS" value="CLEAR" />
        </div>
      </section>

      <section
        v-if="overlay.requires.length"
        class="detail-section"
      >
        <span class="detail-label">REQUIREMENTS</span>
        <ul class="detail-requires">
          <li
            v-for="(req, index) in overlay.requires"
            :key="index"
          >
            {{ req }}
          </li>
        </ul>
      </section>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from '@modals/base.vue';
import UiBadge from '@ui/badge.vue';
import UiChip from '@ui/chip.vue';
import UiDataPoint from '@ui/data-point.vue';
import { parseEmphasis } from '@views/utils/markup.js';
import { computed } from 'vue';

const MODAL_WIDTH = 'min(720px, calc(100vw - 4em))';

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

defineEmits(['close']);

const description_segments = computed(() => {
  return parseEmphasis(props.overlay.description);
});
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.detail-content {
  padding: 0 1.25em 1.25em;
}

.detail-brand {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  color: var(--clr-primary-100);
  letter-spacing: 0.2em;
  opacity: 0.7;
}

.detail-title {
  font-family: var(--font-mono);
  font-size: var(--fs-475);
  font-weight: 700;
  color: var(--clr-neutral-50);
  letter-spacing: 0.05em;
}

.detail-section {
  padding: 1.25em 0;
  border-top: 1px dashed var(--clr-border-100);
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.detail-section:first-child {
  border-top: none;
  padding-top: 0.75em;
}

.detail-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-150);
  letter-spacing: 0.25em;
  color: var(--clr-primary-100);
  opacity: 0.6;
}

.detail-description {
  font-size: var(--fs-275);
  line-height: 1.55;
  color: var(--clr-neutral-100);
  opacity: 0.8;
  margin: 0;
}

.detail-description .emphasis {
  color: var(--clr-neutral-50);
  font-weight: 700;
  opacity: 1;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}

.detail-spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75em 1em;
}

.detail-requires {
  list-style: none;
  display: grid;
  gap: 0.35em;
  padding-left: 1em;
  margin: 0;
}

.detail-requires li {
  font-family: var(--font-mono);
  font-size: var(--fs-250);
  line-height: 1.4;
  color: var(--clr-neutral-100);
  opacity: 0.75;
  position: relative;
  word-break: break-word;
}

.detail-requires li::before {
  content: "›";
  position: absolute;
  left: -1em;
  color: var(--clr-primary-100);
}
</style>
