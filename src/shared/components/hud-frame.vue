<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
-->

<template>
  <div
    class="hud-frame"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
    }"
  >
    <corner-bracket position="top-left" :size="bracket_size" />
    <corner-bracket position="top-right" :size="bracket_size" />
    <corner-bracket position="bottom-left" :size="bracket_size" />
    <corner-bracket position="bottom-right" :size="bracket_size" />

    <div class="border-top" />
    <div class="border-bottom" />
    <div class="border-left" />
    <div class="border-right" />

    <span
      v-if="labels.top_left"
      class="label top-left"
    >
      {{ labels.top_left }}
    </span>
    <span
      v-if="labels.top_right"
      class="label top-right"
    >
      {{ labels.top_right }}
    </span>
    <span
      v-if="labels.bottom_left"
      class="label bottom-left"
    >
      {{ labels.bottom_left }}
    </span>
    <span
      v-if="labels.bottom_right"
      class="label bottom-right"
    >
      {{ labels.bottom_right }}
    </span>

    <slot />
  </div>
</template>

<script setup>
import CornerBracket from './corner-bracket.vue';

const BRACKET_SIZE = 40;

defineProps({
  width: {
    type: Number,
    default: 1920,
  },
  height: {
    type: Number,
    default: 1080,
  },
  labels: {
    type: Object,
    default: () => ({}),
  },
  bracket_size: {
    type: Number,
    default: BRACKET_SIZE,
  },
});
</script>

<style scoped lang="scss">
@use "../../app/scss/abstracts/mixins" as *;

.hud-frame {
  position: relative;
  background: transparent;
}

.border-top,
.border-bottom,
.border-left,
.border-right {
  display: none;
}

.label {
  @include hud-label-base;
  opacity: 0.6;
}

.label.top-left {
  top: 3em;
  left: 4em;
}

.label.top-right {
  top: 3em;
  right: 4em;
}

.label.bottom-left {
  bottom: 3em;
  left: 4em;
}

.label.bottom-right {
  bottom: 3em;
  right: 4em;
}
</style>
