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
    <UiIcon
      name="corner-bracket"
      :size="bracket_size"
      class="bracket top-left"
    />
    <UiIcon
      name="corner-bracket"
      :size="bracket_size"
      class="bracket top-right"
    />
    <UiIcon
      name="corner-bracket"
      :size="bracket_size"
      class="bracket bottom-left"
    />
    <UiIcon
      name="corner-bracket"
      :size="bracket_size"
      class="bracket bottom-right"
    />

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
import UiIcon from '@ui/icon.vue';

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
@use "@app/scss/abstracts/mixins" as *;

.hud-frame {
  position: relative;
  background: transparent;
}

.bracket {
  position: absolute;
  color: var(--clr-neutral-50);
}

.bracket.top-left { top: 0; left: 0; }
.bracket.top-right { top: 0; right: 0; transform: scaleX(-1); }
.bracket.bottom-left { bottom: 0; left: 0; transform: scaleY(-1); }
.bracket.bottom-right { bottom: 0; right: 0; transform: scale(-1); }

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
