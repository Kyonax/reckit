<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  home — RECKIT landing page. Index of all available browser
  sources with copy-to-clipboard URLs and OBS setup specs.
-->

<template>
  <div class="home-bg">
  <div class="home">
    <div class="home-meta-bar">
      <div class="home-meta">
        <div class="meta-item">
          <span class="meta-label">SOURCES</span>
          <span class="meta-value">{{ overlay_count }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">BRANDS</span>
          <span class="meta-value">{{ brand_count }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">READY</span>
          <span class="meta-value">{{ ready_count }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">CANVAS</span>
          <span class="meta-value">1920 × 1080 @ 60</span>
        </div>
      </div>
    </div>

    <header class="home-header">
      <div class="header-grid">
        <span class="header-tag">SYS.LOG</span>
        <span class="header-tag">RECKIT {{ VERSION_TAG }}</span>
      </div>

      <div class="brand-block">
        <pre class="ascii-logo" aria-label="RECKIT">{{ ascii_logo }}</pre>
        <p class="brand-tagline">
          Realtime · Edit-free · Capture ·
          Kyonax · Integrated · Toolkit
        </p>
      </div>
    </header>

    <section class="setup-block">
      <div class="setup-header">
        <span class="setup-title">QUICK SETUP</span>
      </div>
      <ol class="setup-flow">
        <li>
          <span class="step-num">01</span>
          <span class="step-text">Copy URL</span>
        </li>
        <li>
          <span class="step-num">02</span>
          <span class="step-text">OBS → Sources → + → Browser</span>
        </li>
        <li>
          <span class="step-num">03</span>
          <span class="step-text">Paste URL</span>
        </li>
        <li>
          <span class="step-num">04</span>
          <span class="step-text">Match size / FPS</span>
        </li>
        <li>
          <span class="step-num">05</span>
          <span class="step-text">Clear Custom CSS</span>
        </li>
        <li>
          <span class="step-num">06</span>
          <span class="step-text">Layer above scene</span>
        </li>
      </ol>
    </section>

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
        <overlay-card
          v-for="overlay in filtered_overlays"
          :key="overlay.id"
          :overlay="overlay"
        />
      </div>
      <p v-else class="empty-state">
        No web sources match the current filter.
      </p>
    </section>

    <footer class="home-footer">
      <span>Cristian D. Moreno — @kyonax_on_tech</span>
      <span>MPL-2.0 / Apache-2.0</span>
    </footer>
  </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

import logoText from '../../.github/assets/logo.txt?raw';
import OverlayCard from '../shared/components/overlay-card.vue';
import { OVERLAYS } from '../shared/data/overlays.js';
import { VERSION_TAG } from '../shared/version.js';

const ascii_logo = logoText;

const overlay_count = computed(() => OVERLAYS.length);

const ready_count = computed(() => {
  return OVERLAYS.filter((o) => o.status === 'ready').length;
});

const brands = computed(() => {
  const counts = new Map();

  OVERLAYS.forEach((overlay) => {
    const current = counts.get(overlay.brand) || 0;
    counts.set(overlay.brand, current + 1);
  });

  return Array.from(counts, ([name, count]) => ({ name, count }));
});

const brand_count = computed(() => brands.value.length);

const selected_brand = ref(brands.value[0]?.name || '');
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
  return OVERLAYS.filter((overlay) => {
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
@use "../app/scss/abstracts/mixins" as *;

.home-bg {
  background: var(--clr-neutral-500);
  min-height: 100vh;
  width: 100%;
}

.home {
  color: var(--clr-neutral-50);
  padding: 0 5em 4em;
  display: grid;
  gap: 4em;
  max-width: 1440px;
  margin: 0 auto;
}

.home-meta-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--clr-border-100);
  padding: 1em 0;
  margin: 0 -5em 2em;
}

.home-header {
  display: grid;
  gap: 1.5em;
  padding-bottom: 2.5em;
  border-bottom: 1px solid var(--clr-border-100);
  position: relative;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin: 0.5em 0;
}

.ascii-logo {
  display: block;
  padding: 1em 1.5em 0.25em;
  margin-bottom: 1.5em;
  font-family: var(--font-mono);
  font-size: var(--fs-275);
  line-height: 1.05;
  white-space: pre;
  text-align: left;
  color: var(--clr-primary-100);
  width: max-content;
  max-width: 100%;
  overflow: hidden;
  letter-spacing: 0;
}

.brand-tagline {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-175);
  letter-spacing: 0.25em;
  color: var(--clr-primary-100);
  opacity: 0.7;
  margin-top: -0.5em;
}

.header-grid {
  display: flex;
  justify-content: space-between;
}

.header-tag {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-275);
  letter-spacing: 0.3em;
  opacity: 0.5;
}

.home-title {
  font-family: var(--font-mono);
  font-size: var(--fs-775);
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--clr-neutral-50);
  line-height: 1.1;
}

.title-prefix {
  color: var(--clr-primary-100);
}

.home-meta {
  display: flex;
  align-items: center;
  gap: 3em;
  padding: 0 5em;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

.meta-label {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-125);
  letter-spacing: 0.3em;
  opacity: 0.5;
}

.meta-value {
  font-family: var(--font-mono);
  font-size: var(--fs-525);
  color: var(--clr-primary-100);
  font-variant-numeric: tabular-nums;
}

.section-title {
  font-family: var(--font-mono);
  font-size: var(--fs-525);
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--clr-neutral-50);
  margin-bottom: 1.5em;
}

.setup-block {
  display: grid;
  gap: 0.75em;
}

.setup-header {
  display: flex;
  align-items: center;
  gap: 1em;
}

.setup-title {
  @include hud-label-base;
  position: static;
  font-size: var(--fs-275);
  letter-spacing: 0.3em;
  color: var(--clr-neutral-100);
  opacity: 0.6;
}

.setup-flow {
  list-style: none;
  display: grid;
  gap: 0;
  padding: 0;
  border: 1px solid var(--clr-border-100);
  background: rgba(0, 0, 0, 0.3);
}

.setup-flow li {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.75em 1.25em;
  font-family: var(--font-mono);
  font-size: var(--fs-375);
  color: var(--clr-neutral-100);
  border-bottom: 1px solid var(--clr-border-100);
  transition: background 0.15s ease, color 0.15s ease;
}

.setup-flow li:last-child {
  border-bottom: none;
}

.setup-flow li:hover {
  background: rgba(255, 215, 0, 0.04);
  color: var(--clr-neutral-50);
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25em;
  padding: 0.1em 0.5em;
  font-size: var(--fs-275);
  color: var(--clr-primary-100);
  border: 1px solid var(--clr-border-100);
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: border-color 0.15s ease;
}

.setup-flow li:hover .step-num {
  border-color: var(--clr-primary-100);
}

.step-text {
  letter-spacing: 0.05em;
  color: inherit;
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
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(100%, 340px), 1fr)
  );
  align-items: start;
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

.home-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 2em;
  border-top: 1px solid var(--clr-border-100);
  font-family: var(--font-mono);
  font-size: var(--fs-275);
  color: var(--clr-neutral-200);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
}
</style>
