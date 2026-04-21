<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  footer — landing-page bottom. Author attribution + license line.
-->

<template>
  <footer class="home-footer">
    <span>Cristian D. Moreno — @kyonax_on_tech</span>
    <span>MPL-2.0 / Apache-2.0</span>
  </footer>
</template>

<script setup>
</script>

<style scoped lang="scss">
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
