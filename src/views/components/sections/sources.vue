<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  sources — WEB SOURCES browser. Brand tabs, search input,
  status chips, responsive grid of cards. Owns all filter
  state internally — parent passes brand list + source list
  as props, everything else stays local.
-->

<template>
  <section class="overlays-section">
    <h2 class="section-title">WEB SOURCES</h2>

    <nav class="brand-tabs" aria-label="Brand filter">
      <button
        v-for="brand in brands"
        :key="brand.name"
        type="button"
        class="brand-tab"
        :class="{ active: selected_brand === brand.name }"
        @click="selected_brand = brand.name"
      >
        <span class="tab-label">{{ brand.name }}</span>
        <span class="tab-count">{{ brand.count }}</span>
      </button>
    </nav>

    <div class="filter-bar">
      <label class="filter-input">
        <span class="filter-prompt">&gt;</span>
        <input
          v-model="search_query"
          type="text"
          placeholder="filter by name, tags, size, requirements..."
          spellcheck="false"
        />
        <button
          v-if="search_query"
          type="button"
          class="filter-clear"
          aria-label="Clear filter"
          @click="search_query = ''"
        >
          ×
        </button>
      </label>

      <div class="filter-status" role="group" aria-label="Status filter">
        <button
          v-for="option in status_options"
          :key="option.value"
          type="button"
          class="status-chip"
          :class="{ active: status_filter === option.value }"
          @click="status_filter = option.value"
        >
          <span class="chip-dot" :class="option.value" />
          {{ option.label }}
        </button>
      </div>
    </div>

    <div
      v-if="filtered_overlays.length"
      class="overlays-grid"
    >
      <Card
        v-for="overlay in filtered_overlays"
        :key="overlay.id"
        :overlay="overlay"
      />
    </div>
    <p v-else class="empty-state">
      No web sources match the current filter.
    </p>
  </section>
</template>

<script setup>
import Card from '@elements/card.vue';
import { computed, ref } from 'vue';

const props = defineProps({
  brands: {
    type: Array,
    required: true,
  },
  sources: {
    type: Array,
    required: true,
  },
});

const selected_brand = ref(props.brands[0]?.name || '');
const search_query = ref('');
const status_filter = ref('all');

const status_options = [
  { value: 'all', label: 'ALL' },
  { value: 'ready', label: 'READY' },
  { value: 'planned', label: 'PLANNED' },
];

function matchesSearch(overlay, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    overlay.name,
    `${overlay.width}x${overlay.height}`,
    `${overlay.width} x ${overlay.height}`,
    `${overlay.width}`,
    `${overlay.height}`,
    'CACHE DISABLE',
    ...(overlay.requires || []),
    ...(overlay.use_cases || []),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

const filtered_overlays = computed(() => {
  return props.sources.filter((overlay) => {
    if (overlay.brand !== selected_brand.value) {
      return false;
    }

    if (
      status_filter.value !== 'all'
      && overlay.status !== status_filter.value
    ) {
      return false;
    }

    return matchesSearch(overlay, search_query.value.trim());
  });
});
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.section-title {
  font-family: var(--font-mono);
  font-size: var(--fs-525);
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--clr-neutral-50);
  margin-bottom: 1.5em;
}

.brand-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 2em;
  border-bottom: 1px solid var(--clr-border-100);
}

.brand-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.75em 1.5em;
  font-family: var(--font-mono);
  font-size: var(--fs-375);
  color: var(--clr-neutral-200);
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  letter-spacing: 0.05em;
  text-transform: lowercase;
  margin-bottom: -1px;
  transition: color 0.15s ease, background 0.15s ease,
    border-color 0.15s ease;
}

.brand-tab:hover {
  color: var(--clr-neutral-50);
  background: rgba(255, 215, 0, 0.03);
}

.brand-tab.active {
  color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.06);
  border-color: var(--clr-border-100);
  border-bottom: 1px solid var(--clr-neutral-500);
}

.tab-label {
  letter-spacing: inherit;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75em;
  padding: 0.05em 0.4em;
  font-size: var(--fs-175);
  color: var(--clr-neutral-200);
  border: 1px solid var(--clr-border-100);
  letter-spacing: 0.1em;
}

.brand-tab.active .tab-count {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
}

.overlays-grid {
  display: grid;
  gap: 2em;
  grid-template-columns: 1fr;
  align-items: stretch;

  @include min-media-query(sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include min-media-query(lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  margin-bottom: 2em;
  align-items: center;
}

.filter-input {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.75em 1em;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--clr-border-100);
  transition: border-color 0.15s ease;
}

.filter-input:focus-within {
  border-color: var(--clr-primary-100);
}

.filter-prompt {
  color: var(--clr-primary-100);
  font-family: var(--font-mono);
  font-size: var(--fs-375);
  line-height: 1;
  opacity: 0.7;
}

.filter-input input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--fs-275);
  color: var(--clr-neutral-50);
  background: transparent;
  border: none;
  outline: none;
  letter-spacing: 0.05em;
}

.filter-input input::placeholder {
  color: var(--clr-neutral-200);
  opacity: 0.5;
}

.filter-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5em;
  height: 1.5em;
  font-size: var(--fs-400);
  line-height: 1;
  color: var(--clr-neutral-100);
  background: transparent;
  border: 1px solid var(--clr-border-100);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.filter-clear:hover {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
}

.filter-status {
  display: flex;
  gap: 0;
  border: 1px solid var(--clr-border-100);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.6em 1em;
  font-family: var(--font-mono);
  font-size: var(--fs-175);
  letter-spacing: 0.2em;
  color: var(--clr-neutral-200);
  background: transparent;
  border: none;
  border-right: 1px solid var(--clr-border-100);
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.status-chip:last-child {
  border-right: none;
}

.status-chip:hover {
  color: var(--clr-neutral-50);
  background: rgba(255, 255, 255, 0.04);
}

.status-chip.active {
  color: var(--clr-primary-100);
  background: rgba(255, 215, 0, 0.06);
}

.chip-dot {
  width: 6px;
  height: 6px;
  background: var(--clr-neutral-200);
  opacity: 0.4;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.status-chip.active .chip-dot {
  background: var(--clr-primary-100);
  opacity: 1;
}

.empty-state {
  padding: 3em 1em;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-375);
  color: var(--clr-neutral-200);
  letter-spacing: 0.1em;
  border: 1px dashed var(--clr-border-100);
}
</style>
