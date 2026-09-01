<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  base — reusable modal shell with backdrop, ESC close, fade
  transition, and named slots for header/body/footer. Composed
  by preview.vue + detail.vue; never used directly from a view.
  Binding: <BaseModal> (alias @modals/ already supplies "modal").
-->

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="is_open"
        class="modal-backdrop"
        @click.self="close"
      >
        <div
          class="modal"
          :style="{ width: max_width }"
        >
          <header class="modal-header">
            <slot name="header" />
            <button
              type="button"
              class="modal-close"
              aria-label="Close"
              @click="close"
            >
              ×
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="modal-footer"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  is_open: {
    type: Boolean,
    default: false,
  },
  max_width: {
    type: String,
    default: 'min(1100px, calc(100vw - 4em))',
  },
});

const emit = defineEmits(['close']);

function close() {
  emit('close');
}

function handleKeydown(event) {
  if (event.key === 'Escape' && props.is_open) {
    close();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2em;
}

.modal {
  display: flex;
  flex-direction: column;
  background: var(--clr-neutral-500);
  border: 1px solid var(--clr-primary-300);
  max-height: calc(100vh - 4em);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.75em 1.25em;
  border-bottom: 1px solid var(--clr-border-100);
}

.modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.75em 1.25em;
  border-top: 1px solid var(--clr-border-100);
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  font-size: var(--fs-525);
  line-height: 1;
  color: var(--clr-neutral-100);
  border: 1px solid var(--clr-border-100);
  background: transparent;
  cursor: pointer;
  margin-left: auto;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.modal-close:hover {
  color: var(--clr-primary-100);
  border-color: var(--clr-primary-100);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
