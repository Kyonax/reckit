/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * useContextChannel — singleton composable for the context-screen
 * cross-page control plane (Plan #context-screen, decisions D1 +
 * D4). Owns two reactive refs (active_slug, sidebar_open) and
 * three actions (setActiveSlug, toggleSidebar, hideSidebar).
 * Synchronises across same-origin browser tabs via the native
 * `BroadcastChannel` API, and persists state to `localStorage` so
 * a page reload restores the last selection. Watches sidebar_open
 * and toggles the `.context-sidebar-open` class on the document
 * root — the lower-third strip + sidebar slide animation hang off
 * that class flip (Plan R2a + R2c + R2f).
 *
 * Module-level singleton per session-file §1.14.5: every consumer
 * shares one channel + one state object. No onUnmounted cleanup —
 * the channel lives for the page lifetime.
 *
 * Mirrors the singleton shape of `use-audio-analyzer.js`.
 */

import { effectScope, ref, watch } from 'vue';

const CHANNEL_NAME = 'reckit:context-screen';
const LOCALSTORAGE_KEY = 'reckit:context-channel:state';
const LOCALSTORAGE_DEBOUNCE_MS = 100;
const SIDEBAR_OPEN_CLASS = 'context-sidebar-open';
const RELAY_ENDPOINT = '/__context_state';
const RELAY_POLL_INTERVAL_MS = 300;

let shared_state = null;

export function useContextChannel() {
  if (shared_state) {
    return shared_state;
  }

  const active_slug = ref(null);
  const sidebar_open = ref(false);
  // Raw .org text authored live (e.g. from the OBS script panel). When
  // non-empty it OVERRIDES the file-backed context: consumers parse it
  // at runtime instead of reading the build-time CONTEXTS map. Empty
  // string means "fall back to active_slug".
  const draft_org = ref('');
  // Bracketed label on the cam-log HUD's top-right row (`[SESSION]`).
  // Empty string means "use the component's own default" — the relay
  // never dictates a fallback, the consumer owns it.
  const cam_label = ref('');

  const persisted = readPersistedState();
  if (persisted) {
    if (typeof persisted.active_slug !== 'undefined') {
      active_slug.value = persisted.active_slug;
    }
    if (typeof persisted.sidebar_open === 'boolean') {
      sidebar_open.value = persisted.sidebar_open;
    }
    if (typeof persisted.draft_org === 'string') {
      draft_org.value = persisted.draft_org;
    }
    if (typeof persisted.cam_label === 'string') {
      cam_label.value = persisted.cam_label;
    }
  }

  const channel = createChannel();
  function applyRemote(remote) {
    if (!remote || typeof remote !== 'object') {
      return;
    }
    if (typeof remote.active_slug !== 'undefined') {
      active_slug.value = remote.active_slug;
    }
    if (typeof remote.sidebar_open === 'boolean') {
      sidebar_open.value = remote.sidebar_open;
    }
    if (typeof remote.draft_org === 'string') {
      draft_org.value = remote.draft_org;
    }
    if (typeof remote.cam_label === 'string') {
      cam_label.value = remote.cam_label;
    }
  }

  channel.addEventListener('message', (event) => {
    applyRemote(event && event.data);
  });

  // Cross-process bridge via HTTP. OBS browser source runs in its own
  // Chromium (CEF) process — BroadcastChannel can't reach across that
  // boundary. Every consumer polls the dev-server endpoint at a fixed
  // interval; every local action pushes via POST. Latency ~300 ms p95.
  // Suppress echo: when we POST our own snapshot, set last_pushed_hash
  // so the very next poll skips applying it.
  let last_pushed_hash = '';
  let is_pushing = false;

  async function pollState() {
    if (is_pushing) {
      return;
    }
    if (typeof fetch === 'undefined') {
      return;
    }
    try {
      const res = await fetch(RELAY_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const hash = JSON.stringify(data);
      if (hash !== last_pushed_hash) {
        last_pushed_hash = hash;
        applyRemote(data);
      }
    } catch {
      // Network error — silently retry next interval.
    }
  }

  async function pushState(snapshot) {
    if (typeof fetch === 'undefined') {
      return;
    }
    is_pushing = true;
    try {
      last_pushed_hash = JSON.stringify(snapshot);
      await fetch(RELAY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
    } catch {
      // Network error — local state still applied; remote may diverge
      // until next successful push.
    } finally {
      is_pushing = false;
    }
  }

  pollState();
  setInterval(pollState, RELAY_POLL_INTERVAL_MS);

  let persist_timer = null;
  function schedulePersist() {
    if (persist_timer) {
      clearTimeout(persist_timer);
    }
    persist_timer = setTimeout(persistNow, LOCALSTORAGE_DEBOUNCE_MS);
  }

  function persistNow() {
    persist_timer = null;
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({
          active_slug: active_slug.value,
          sidebar_open: sidebar_open.value,
          draft_org: draft_org.value,
          cam_label: cam_label.value,
        }),
      );
    } catch {
      // Storage quota / disabled — silently degrade.
    }
  }

  function broadcastSnapshot() {
    const snapshot = {
      active_slug: active_slug.value,
      sidebar_open: sidebar_open.value,
      draft_org: draft_org.value,
      cam_label: cam_label.value,
    };
    channel.postMessage(snapshot);
    pushState(snapshot);
  }

  function setActiveSlug(slug) {
    active_slug.value = slug;
    broadcastSnapshot();
  }

  function toggleSidebar() {
    sidebar_open.value = !sidebar_open.value;
    broadcastSnapshot();
  }

  function hideSidebar() {
    sidebar_open.value = false;
    broadcastSnapshot();
  }

  function setDraftOrg(text) {
    draft_org.value = typeof text === 'string' ? text : '';
    broadcastSnapshot();
  }

  function clearDraftOrg() {
    draft_org.value = '';
    broadcastSnapshot();
  }

  function setCamLabel(text) {
    cam_label.value = typeof text === 'string' ? text : '';
    broadcastSnapshot();
  }

  const scope = effectScope(true);
  scope.run(() => {
    watch(
      [active_slug, sidebar_open, draft_org, cam_label],
      schedulePersist,
    );
    watch(sidebar_open, (open) => applyDocumentClass(open));
  });

  applyDocumentClass(sidebar_open.value);

  shared_state = {
    active_slug,
    sidebar_open,
    draft_org,
    cam_label,
    setActiveSlug,
    toggleSidebar,
    hideSidebar,
    setDraftOrg,
    clearDraftOrg,
    setCamLabel,
  };
  return shared_state;
}

function createChannel() {
  if (typeof BroadcastChannel === 'undefined') {
    return { postMessage: () => {}, onmessage: null, close: () => {} };
  }
  return new BroadcastChannel(CHANNEL_NAME);
}

function readPersistedState() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function applyDocumentClass(open) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (!root || !root.classList) {
    return;
  }
  root.classList.toggle(SIDEBAR_OPEN_CLASS, open);
}
