<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  setup — QUICK SETUP block. Six numbered steps walking a new
  user from "copy URL" to "layer above scene" in OBS. Pure
  static content — no props, no state.
-->

<template>
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
</template>

<script setup>
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

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
</style>
