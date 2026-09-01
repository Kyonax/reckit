<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  hero — landing-page centerpiece. ASCII RECKIT logo, tagline,
  and top SYS.LOG / version tags. Self-contained: pulls its own
  logo text and version tag.
-->

<template>
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
</template>

<script setup>
import logoText from '@assets/logo.txt?raw';
import { VERSION_TAG } from '@shared/version.js';

const ascii_logo = logoText;
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.home-header {
  display: grid;
  gap: 1.5em;
  padding-bottom: 2.5em;
  border-bottom: 1px solid var(--clr-border-100);
  position: relative;
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
</style>
