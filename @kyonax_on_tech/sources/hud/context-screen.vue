<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  context-screen — HUD web source for the CONTEXT scene. News-style
  three-surface layout (Plan #context-screen, decisions D5+D6+D8+
  D9+D10+D11+D13+D14+D15):

    1. .context-strip      lower-third (always visible) — title +
                           description, Geomanist + SpaceMono.
                           Width transitions 100% ↔ 62% on sidebar
                           toggle (the one acknowledged non-transform
                           animation, R2a + TRADE-OFFS).
    2. .context-marquee    row below the strip. transform: translateX
                           infinite loop, duplicated items list,
                           GPU-composited.
    3. .context-sidebar    right-edge slide-in panel (z=100). Renders
                           full parsed .org via <UiOrgContent> (D11 —
                           recursive Vue template, never v-html).
                           Auto-scroll via translateY on inner wrapper
                           after 2 s open delay. Custom thin lateral
                           indicator (z synced to scroll progress).
                           Direct DOM writes per §1.14.6.
    4. .context-peek       closed-state ambient indicator (z=99) —
                           layered span (static halo + animated-opacity
                           pulse) mirroring <UiStatusDot>. Fades to
                           opacity 0 when sidebar opens.

  All animation in this file uses transform / opacity ONLY, except the
  one-time .context-lower width transition on toggle (R6 + R2a). All
  surfaces ship border-radius: 0 (D15). contain: layout paint on every
  updating sub-tree (§1.14.4).
-->

<template>
  <div
    class="context-screen-overlay"
    :class="{ 'context-sidebar-open': channel.sidebar_open.value }"
  >
    <div class="context-lower">
      <div class="context-strip">
        <template v-if="parsed">
          <div class="context-strip__title">
            {{ parsed.title }}
          </div>
          <div
            v-if="parsed.subtitle"
            class="context-strip__subtitle"
          >
            {{ parsed.subtitle }}
          </div>
          <div class="context-strip__description">
            {{ parsed.description }}
          </div>
        </template>
        <template v-else>
          <div class="context-strip__title context-strip__title--placeholder">
            NO CONTEXT ACTIVE
          </div>
          <div
            class="context-strip__description
              context-strip__description--placeholder"
          >
            Open the CONTROLS modal on the source card to pick an
            <code>.org</code> file.
          </div>
        </template>
      </div>
      <div
        v-if="marquee_doubled.length > 0"
        class="context-marquee"
      >
        <div class="context-marquee__items">
          <span
            v-for="(item, index) in marquee_doubled"
            :key="index"
            class="context-marquee__item"
          >{{ item }}</span>
        </div>
      </div>
    </div>

    <aside class="context-sidebar">
      <header
        v-if="parsed && parsed.tags && parsed.tags.length"
        class="context-sidebar__header"
      >
        <UiChip
          v-for="tag in parsed.tags"
          :key="tag"
          variant="solid"
          shape="square"
        >
          {{ tag }}
        </UiChip>
      </header>
      <div
        ref="sidebar_body_el"
        class="context-sidebar__body"
      >
        <UiOrgContent
          v-if="parsed"
          :ast="parsed.body_ast"
        />
        <p
          v-else
          class="context-sidebar__placeholder"
        >
          No context selected. Pick an
          <code>.org</code>
          file from the CONTROLS modal.
        </p>
      </div>
    </aside>

    <span
      class="context-peek"
      aria-hidden="true"
    >
      <span class="context-peek__pulse">❮</span>
    </span>
  </div>
</template>

<script setup>
import { useContextChannel } from '@composables/use-context-channel.js';
import { getContexts } from '@shared/brand-loader.js';
import { parseOrg } from '@shared/utils/org.js';
import UiChip from '@ui/chip.vue';
import UiOrgContent from '@ui/org-content.vue';
import { computed, onUnmounted, ref, watch } from 'vue';

const BRAND_HANDLE = '@kyonax_on_tech';
const OPEN_DELAY_MS = 3000;
const BOTTOM_HOLD_MS = 3000;
const SCROLL_SPEED_PX_PER_SEC = 16;
const MS_PER_SEC = 1000;
const MARQUEE_HALF_REPEATS = 3;
const USER_INTERACTION_PAUSE_MS = 5000;

const contexts = getContexts(BRAND_HANDLE);
const channel = useContextChannel();

// A live draft (authored in the OBS script panel and delivered over the
// relay) OVERRIDES the build-time file context. It is parsed here at
// runtime — uniorg-parse runs perfectly well in the browser, so the same
// .org feature set is available to text typed live. A malformed draft
// falls through to `null` (placeholder) rather than throwing and blanking
// the whole source mid-recording.
const parsed = computed(() => {
  const draft = channel.draft_org.value;
  if (draft && draft.trim()) {
    try {
      return parseOrg(draft);
    } catch {
      return null;
    }
  }

  const slug = channel.active_slug.value;
  if (!slug) {
    return null;
  }
  const entry = contexts[slug];
  return entry && entry.parsed ? entry.parsed : null;
});

const marquee_doubled = computed(() => {
  if (!parsed.value || !parsed.value.marquee_items.length) {
    return [];
  }
  const items = parsed.value.marquee_items;
  // Repeat each half MARQUEE_HALF_REPEATS times so a single half exceeds the
  // visible canvas width. Then duplicate the half for the seamless
  // translateX(0% → -50%) loop — at -50% the visual content matches 0%
  // because the second half is identical to the first.
  const half = [];
  for (let i = 0; i < MARQUEE_HALF_REPEATS; i++) {
    for (const item of items) {
      half.push(item);
    }
  }
  return [...half, ...half];
});

const sidebar_body_el = ref(null);

let open_timer = null;
let bottom_hold_timer = null;
let raf_id = null;
let last_frame_time = 0;
let last_user_interaction_at = 0;
let cached_inner_height = 0;
let cached_body_height = 0;

function cacheDimensions() {
  const body = sidebar_body_el.value;
  if (!body) {
    return;
  }
  cached_inner_height = body.scrollHeight;
  cached_body_height = body.clientHeight;
}

function tick(now) {
  const body = sidebar_body_el.value;
  if (!body) {
    raf_id = null;
    return;
  }
  const delta_seconds = (now - last_frame_time) / MS_PER_SEC;
  last_frame_time = now;

  const paused_until = last_user_interaction_at + USER_INTERACTION_PAUSE_MS;
  const is_paused = now < paused_until;

  const max_scroll = Math.max(0, cached_inner_height - cached_body_height);
  if (max_scroll <= 0) {
    raf_id = requestAnimationFrame(tick);
    return;
  }

  if (!is_paused) {
    body.scrollTop += SCROLL_SPEED_PX_PER_SEC * delta_seconds;
    if (body.scrollTop >= max_scroll - 1) {
      body.scrollTop = max_scroll;
      bottom_hold_timer = setTimeout(() => {
        body.scrollTop = 0;
        last_frame_time = performance.now();
        raf_id = requestAnimationFrame(tick);
      }, BOTTOM_HOLD_MS);
      return;
    }
  }

  raf_id = requestAnimationFrame(tick);
}

function cancelAutoScroll() {
  if (open_timer) {
    clearTimeout(open_timer);
    open_timer = null;
  }
  if (bottom_hold_timer) {
    clearTimeout(bottom_hold_timer);
    bottom_hold_timer = null;
  }
  if (raf_id) {
    cancelAnimationFrame(raf_id);
    raf_id = null;
  }
}

function startAutoScroll() {
  cancelAutoScroll();
  cacheDimensions();
  if (sidebar_body_el.value) {
    sidebar_body_el.value.scrollTop = 0;
  }
  last_user_interaction_at = 0;
  if (cached_inner_height <= cached_body_height) {
    return;
  }
  open_timer = setTimeout(() => {
    last_frame_time = performance.now();
    raf_id = requestAnimationFrame(tick);
  }, OPEN_DELAY_MS);
}

function handleUserInteraction() {
  last_user_interaction_at = performance.now();
  // Cancel pending bottom-hold reset so manual scroll isn't yanked.
  if (bottom_hold_timer) {
    clearTimeout(bottom_hold_timer);
    bottom_hold_timer = null;
  }
}

function attachInteractionListeners() {
  const body = sidebar_body_el.value;
  if (!body) {
    return;
  }
  body.addEventListener('wheel', handleUserInteraction, { passive: true });
  body.addEventListener('touchstart', handleUserInteraction, { passive: true });
}

function detachInteractionListeners() {
  const body = sidebar_body_el.value;
  if (!body) {
    return;
  }
  body.removeEventListener('wheel', handleUserInteraction);
  body.removeEventListener('touchstart', handleUserInteraction);
}

watch(channel.sidebar_open, (open) => {
  if (open) {
    requestAnimationFrame(() => {
      attachInteractionListeners();
      startAutoScroll();
    });
    return;
  }
  cancelAutoScroll();
  detachInteractionListeners();
  if (sidebar_body_el.value) {
    sidebar_body_el.value.scrollTop = 0;
  }
});

watch(parsed, () => {
  if (!channel.sidebar_open.value) {
    return;
  }
  cancelAutoScroll();
  requestAnimationFrame(() => startAutoScroll());
});

onUnmounted(() => {
  cancelAutoScroll();
  detachInteractionListeners();
});
</script>

<style lang="scss">
/*
 * Page-scoped html font-size bump. The project's global stylesheet
 * (src/app/scss/base/_global.scss) anchors `html` at `font-size: 12px`,
 * which makes every rem-based --fs-* token render small inside the OBS
 * 1920x1080 browser source (e.g. --fs-300 large = 1.25rem × 12 = 15px).
 *
 * `:has(.context-screen-overlay)` activates the override only when the
 * overlay is in the document — true for the standalone OBS source AND
 * inside the home preview iframe (each iframe owns its own `html` /
 * `:root`). Other pages (home, cam-log) keep the 12px base.
 *
 * The `:has()` selector ships in Chromium 105+ — OBS 32.x CEF supports
 * it. No JS required, no module-init side effects.
 */
html:has(.context-screen-overlay) {
  font-size: 16px;
}
</style>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.context-screen-overlay {
  /* Sidebar width is pinned to the Screen scene's camera column so an
   * open sidebar covers the OBS camera item exactly, with no sliver of
   * webcam showing down its left edge. Camera item sits at x=1069 on a
   * 1920 canvas, so the sidebar must start there:
   *     (1920 - 1069) / 1920 = 0.4432
   * 0.4435 is used to guarantee full coverage against sub-pixel
   * rounding. The strip takes the remainder so the two still meet on a
   * single shared border (§1.18). Move the camera item and these two
   * numbers must move with it — they are one measurement, not two. */
  --strip-width-ratio: 0.5643;
  --strip-fs-scale: 0.95;
  --sidebar-width-ratio: 0.4357;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  contain: layout paint;
}

.context-lower {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  /* Stacks above the sidebar (z-index: 100) so the strip's TR corner
   * square overflows ON TOP of the sidebar at the strip-right /
   * sidebar-left boundary instead of being hidden behind it.
   * `contain: layout` only — paint containment would clip the
   * overflowing pseudo-element. */
  z-index: 110;
  display: flex;
  flex-direction: column;
  contain: layout;
  transition: width var(--motion-sidebar-ms) var(--motion-strip-ease);
}

.context-screen-overlay.context-sidebar-open .context-lower {
  width: calc(100% * var(--strip-width-ratio));
}

.context-screen-overlay.context-sidebar-open .context-strip__title {
  font-size: calc(var(--fs-700) * var(--strip-fs-scale));
}

.context-screen-overlay.context-sidebar-open .context-strip__subtitle {
  font-size: calc(var(--fs-425) * var(--strip-fs-scale));
}

.context-screen-overlay.context-sidebar-open .context-strip__description {
  font-size: calc(var(--fs-400) * var(--strip-fs-scale));
}

.context-strip {
  position: relative;
  background-color: var(--clr-neutral-500);
  border: 1px solid var(--clr-border-100);
  /* Strip + sidebar share a single 1px boundary when the sidebar is
   * open. The sidebar's LEFT border owns that line; the strip drops
   * its right border so the two don't stack into a 2px visual. When
   * the sidebar is closed, the strip's right edge sits at the canvas
   * right edge anyway, so no missing border is visible.
   * The strip's BOTTOM border is restored (the marquee's `border-top`
   * is dropped below) so the strip carries the divider line itself. */
  border-right: none;
  /* TR corner only — bottom is at the canvas edge; TL is intentionally
   * dropped so the strip's left edge runs flush into the canvas without
   * a visual dot. The pseudo-element square overflows the border so
   * it's visibly centered on the corner intersection. */
  @include corner-square-tr(var(--clr-neutral-100));
  padding: 2.4em 2em 1em 2em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  border-radius: 0;
  contain: layout;
  transition: padding var(--motion-sidebar-ms) var(--motion-strip-ease);
}

/* Shared-border rule (§1.18): when a marquee follows the strip, the
 * marquee's `border-top` is the divider, so the strip drops its own
 * bottom border. With no marquee the strip keeps it and closes the
 * lower-third itself. `:has()` ships in Chromium 105+ — OBS 32.x CEF
 * supports it, same as the `html:has(...)` rule above. */
.context-strip:has(+ .context-marquee) {
  border-bottom: none;
}

.context-strip__title {
  font-family: var(--font-display);
  font-size: var(--fs-700);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.04em;
  /* UNITLESS line-height is mandatory here. `body` sets an ABSOLUTE
   * `line-height: var(--fs-500)` (32px), which this 48px title would
   * otherwise inherit — a line box smaller than its own glyphs. On one
   * line that clips the ascenders; once the title wraps (which it does
   * as soon as the sidebar opens and the strip narrows) the two lines
   * overlap each other. Any element here that raises font-size must set
   * its own ratio-based line-height. */
  line-height: 1.05;
  color: var(--clr-neutral-100);
  text-shadow: var(--hud-halo-text);
  transition: font-size var(--motion-sidebar-ms) var(--motion-strip-ease);
}

.context-strip__subtitle {
  font-family: var(--font-display);
  font-size: var(--fs-425);
  font-weight: 400;
  letter-spacing: 0.02em;
  /* Ratio-based for the same reason as the title — the inherited 32px
   * absolute value happens to clear this font size, but it would stop
   * doing so the moment --fs-425 is bumped. */
  line-height: 1.25;
  color: var(--clr-primary-100);
  transition: font-size var(--motion-sidebar-ms) var(--motion-strip-ease);
}

.context-strip__description {
  font-family: var(--font-mono);
  font-size: var(--fs-400);
  /* 1.25 left the last line's descenders clipped once the description
   * wrapped to two lines (scrollHeight exceeded the box by ~3px). */
  line-height: 1.4;
  color: var(--clr-neutral-200);
  transition: font-size var(--motion-sidebar-ms) var(--motion-strip-ease);
}

.context-strip__title--placeholder {
  color: var(--clr-neutral-200);
  opacity: 0.45;
}

.context-strip__description--placeholder {
  color: var(--clr-neutral-200);
  opacity: 0.45;
}

.context-sidebar__placeholder {
  font-family: var(--font-mono);
  font-size: var(--fs-225);
  color: var(--clr-neutral-200);
  opacity: 0.45;
  margin: 0;
  padding: 1.5em 0;
}

.context-sidebar__placeholder code {
  color: var(--clr-primary-100);
  opacity: 0.7;
  background: color-mix(in srgb, var(--clr-neutral-100) 10%, transparent);
  padding: 0 0.3em;
}

/* Marquee — mirrors kyo-web-online/src/app/scss/components/_marquee.scss */
/* (gold background, black text, font-weight 900) — without the deprecated */
/* cyberpunk-glow utility class. Halo opt-in via --hud-halo-text instead. */
.context-marquee {
  background-color: var(--clr-primary-100);
  color: var(--clr-neutral-500);
  font-size: var(--fs-225);
  line-height: var(--fs-425);
  width: 100%;
  overflow: hidden;
  /* The marquee owns BOTH of its horizontal rules. The top border is
   * the strip/marquee divider — the strip drops its own `border-bottom`
   * when a marquee follows it (see the `:has()` rule below), so the two
   * surfaces share a single 1px line instead of stacking into 2px
   * (§1.18 shared-border rule). Without this the gold bar butted
   * straight against the strip with no visible separation, while the
   * placeholder state — which renders no marquee at all — kept a clean
   * edge, making the two states look inconsistent. */
  border-top: 1px solid var(--clr-border-100);
  border-bottom: 1px solid var(--clr-border-100);
  border-radius: 0;
  contain: layout paint;
}

.context-marquee__items {
  display: flex;
  white-space: nowrap;
  width: max-content;
  font-weight: 900;
  animation: context-marquee-scroll var(--motion-marquee-s) linear infinite;
  will-change: transform;
}

.context-marquee__item {
  display: inline-flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.context-marquee__item::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: currentColor;
  margin: 0 1rem;
  flex-shrink: 0;
}

@keyframes context-marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.context-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(100% * var(--sidebar-width-ratio));
  height: 100%;
  background-color: var(--clr-neutral-500);
  border: 1px solid var(--clr-border-100);
  /* Top-left only — top-right + bottom-right are at the canvas edge,
   * bottom-left is dropped per design. White square overflows the
   * border so it sits centered on the intersection. */
  @include corner-square-tl(var(--clr-neutral-100));
  border-radius: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  opacity: 0;
  transform: translateX(100%);
  transition:
    transform var(--motion-sidebar-ms) var(--motion-strip-ease),
    opacity var(--motion-sidebar-ms) var(--motion-strip-ease);
  will-change: transform, opacity;
  contain: layout;
}

.context-screen-overlay.context-sidebar-open .context-sidebar {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.context-sidebar__header {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  padding: 1em 1.5em;
  border-bottom: 1px solid var(--clr-border-100);
  flex-shrink: 0;
}

/* Sidebar header chip override — switches the chip to a quiet outline
 * style so tags read as ambient context, not as a focal element.
 * Smaller font, dimmer text (neutral-100 instead of neutral-50),
 * transparent surface, and a low-alpha border (border-100 = white at
 * 20%). Sits firmly in the 30% support tier of 60-30-10 — no surface
 * pooling competes for attention with the body content below.
 * Scoped via :deep(). */
.context-sidebar__header :deep(.ui-chip) {
  font-size: var(--fs-225);
  color: var(--clr-neutral-100);
  background-color: transparent;
  border-color: var(--clr-border-100);
}

/*
 * Square at the LEFT end of the header separator line — interior
 * intersection of the separator + the sidebar's left edge. The right
 * end is at the canvas edge, so no square there. Matches the bright
 * white of the corner squares.
 */
.context-sidebar__header::after {
  content: '';
  position: absolute;
  bottom: -2.25px;
  left: -2.25px;
  width: 4.5px;
  height: 4.5px;
  background-color: var(--clr-neutral-100);
  pointer-events: none;
  z-index: 1;
}

.context-sidebar__body {
  position: relative;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* Tighter top/bottom — body content sits closer to the header rule
   * and the canvas bottom edge. Horizontal padding unchanged. */
  padding: 0.75em 1.5em;
  /* Base text color lives here (not on `.org-content`) so the recursive
   * `<UiOrgContent>` nested inside an `<.org-headline>` inherits the
   * headline's primary-100 gold instead of overriding it. */
  color: var(--clr-neutral-200);
  contain: layout paint;
  /* Hide native scrollbar — the lateral indicator replaces it visually,
   * scroll wheel + drag still work natively. */
  scrollbar-width: none;
}

.context-sidebar__body::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.context-peek {
  position: absolute;
  top: 50%;
  right: 0.4em;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6em;
  height: 2.6em;
  background-color: var(--clr-neutral-500);
  border: 1px solid var(--clr-border-100);
  border-radius: 0;
  color: var(--clr-primary-100);
  font-family: var(--font-mono);
  font-size: var(--fs-300);
  z-index: 99;
  opacity: 1;
  transition: opacity var(--motion-sidebar-ms) var(--motion-strip-ease);
  contain: layout paint;
}

.context-screen-overlay.context-sidebar-open .context-peek {
  opacity: 0;
}

.context-peek__pulse {
  display: inline-block;
  opacity: 1;
  animation: context-peek-breathe var(--motion-peek-pulse-s)
    ease-in-out infinite;
  will-change: opacity;
}

@keyframes context-peek-breathe {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
</style>
