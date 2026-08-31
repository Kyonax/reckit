<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  control — compact control surface designed to be mounted as an OBS
  Custom Browser Dock (View -> Docks -> Custom Browser Docks), the
  same mechanism Twitch uses for its in-OBS panels.

  Drives the same control plane as <ContextControlModal>: the
  `useContextChannel` singleton pushes { active_slug, sidebar_open }
  through the Vite relay (session file §1.16), so the OBS dock, the
  landing page and every mounted browser source stay in sync.

  Laid out for a NARROW, TALL viewport (docks are ~300-420px wide).
  Single column, large tap targets, no horizontal scroll.
-->

<template>
  <div class="control">
    <header class="control__head">
      <span class="control__title">CONTEXT CONTROL</span>
      <span class="control__version">RECKIT {{ VERSION_TAG }}</span>
    </header>

    <button
      type="button"
      class="control__toggle"
      :class="{ 'control__toggle--on': channel.sidebar_open.value }"
      @click="channel.toggleSidebar()"
    >
      <span class="control__toggle-dot" />
      <span class="control__toggle-label">
        {{ channel.sidebar_open.value ? 'SIDEBAR OPEN' : 'SIDEBAR CLOSED' }}
      </span>
    </button>

    <div class="control__meta">
      <span class="control__meta-label">ACTIVE</span>
      <span class="control__meta-value">
        {{ active_title || '— none —' }}
      </span>
    </div>

    <ul
      v-if="entries.length"
      class="control__list"
    >
      <li
        v-for="entry in entries"
        :key="entry.key"
      >
        <button
          type="button"
          class="control__item"
          :class="{
            'control__item--active': entry.slug === channel.active_slug.value,
            'control__item--errored': Boolean(entry.parse_error),
          }"
          @click="channel.setActiveSlug(entry.slug)"
        >
          <span class="control__item-title">{{ entry.title }}</span>
          <span class="control__item-slug">{{ entry.slug }}</span>
        </button>
      </li>
    </ul>
    <p
      v-else
      class="control__empty"
    >
      No .org contexts found. Drop one at
      <code>&lt;brand&gt;/data/contexts/&lt;slug&gt;.org</code>
    </p>

    <button
      type="button"
      class="control__clear"
      :disabled="!channel.active_slug.value"
      @click="channel.setActiveSlug(null)"
    >
      CLEAR CONTEXT
    </button>
  </div>
</template>

<script setup>
import { useContextChannel } from '@composables/use-context-channel.js';
import { CONTEXTS } from '@shared/brand-loader.js';
import { VERSION_TAG } from '@shared/version.js';
import { computed } from 'vue';

const channel = useContextChannel();

const entries = computed(() => {
  const rows = [];
  for (const brand of Object.keys(CONTEXTS)) {
    for (const slug of Object.keys(CONTEXTS[brand])) {
      const entry = CONTEXTS[brand][slug];
      rows.push({
        key: `${brand}/${slug}`,
        brand,
        slug,
        parse_error: entry.parse_error,
        title: entry.parsed?.title || slug,
      });
    }
  }
  return rows;
});

const active_title = computed(() => {
  const slug = channel.active_slug.value;
  if (!slug) {
    return '';
  }
  const match = entries.value.find((e) => e.slug === slug);
  return match ? match.title : slug;
});
</script>

<style scoped lang="scss">
.control {
  min-height: 100vh;
  background: var(--clr-neutral-500);
  color: var(--clr-neutral-100);
  font-family: var(--font-mono);
  padding: 0.9em;
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.control__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5em;
  border-bottom: 1px solid var(--clr-border-100);
  padding-bottom: 0.6em;
}

.control__title {
  font-family: var(--font-display);
  font-size: var(--fs-350);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--clr-neutral-50);
}

.control__version {
  font-size: var(--fs-150);
  color: var(--clr-neutral-300);
}

/* Sidebar toggle — the most-used control, so it gets the most weight. */
.control__toggle {
  display: flex;
  align-items: center;
  gap: 0.6em;
  width: 100%;
  padding: 0.8em 0.9em;
  background: var(--clr-primary-100-06);
  border: 1px solid var(--clr-border-100);
  border-radius: 0;
  color: var(--clr-neutral-100);
  font-family: var(--font-mono);
  font-size: var(--fs-200);
  letter-spacing: 0.08em;
  text-align: left;
  transition: background-color 140ms ease, border-color 140ms ease;
}

.control__toggle:hover {
  background: var(--clr-primary-100-10);
}

.control__toggle--on {
  background: var(--clr-primary-100-14);
  border-color: var(--clr-primary-100-40);
  color: var(--clr-primary-100);
}

.control__toggle-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  background: var(--clr-neutral-300);
}

.control__toggle--on .control__toggle-dot {
  background: var(--clr-primary-100);
}

.control__meta {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  padding: 0.5em 0.1em;
}

.control__meta-label {
  font-size: var(--fs-125);
  letter-spacing: 0.14em;
  color: var(--clr-neutral-300);
}

.control__meta-value {
  font-size: var(--fs-200);
  color: var(--clr-primary-100);
  overflow-wrap: anywhere;
}

.control__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  margin: 0;
  padding: 0;
  flex: 1;
}

.control__item {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  width: 100%;
  padding: 0.65em 0.75em;
  background: var(--clr-neutral-50-02);
  border: 1px solid var(--clr-border-100);
  border-left: 3px solid transparent;
  border-radius: 0;
  color: var(--clr-neutral-100);
  font-family: var(--font-mono);
  text-align: left;
  transition: background-color 140ms ease, border-color 140ms ease;
}

.control__item:hover {
  background: var(--clr-neutral-50-04);
}

.control__item--active {
  background: var(--clr-primary-100-10);
  border-left-color: var(--clr-primary-100);
  color: var(--clr-primary-100);
}

.control__item--errored {
  border-left-color: var(--clr-error-100);
}

.control__item-title {
  font-size: var(--fs-200);
  overflow-wrap: anywhere;
}

.control__item-slug {
  font-size: var(--fs-125);
  letter-spacing: 0.08em;
  color: var(--clr-neutral-300);
  overflow-wrap: anywhere;
}

.control__empty {
  flex: 1;
  font-size: var(--fs-150);
  color: var(--clr-neutral-300);
  line-height: 1.5;
}

.control__empty code {
  color: var(--clr-primary-100);
  overflow-wrap: anywhere;
}

.control__clear {
  width: 100%;
  padding: 0.6em;
  background: transparent;
  border: 1px solid var(--clr-border-100);
  border-radius: 0;
  color: var(--clr-neutral-200);
  font-family: var(--font-mono);
  font-size: var(--fs-150);
  letter-spacing: 0.1em;
  transition: color 140ms ease, border-color 140ms ease;
}

.control__clear:hover:not(:disabled) {
  color: var(--clr-error-100);
  border-color: var(--clr-error-100);
}

.control__clear:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
