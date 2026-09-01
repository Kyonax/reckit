/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Tests for the singleton composables that drive the cam-log HUD:
 * useObsWebsocket is mocked; each composable is verified to return
 * the documented initial state and to share one instance across
 * repeated calls (singleton contract).
 */

import { useAudioAnalyzer } from '@composables/use-audio-analyzer.js';
import { useContextChannel } from '@composables/use-context-channel.js';
import { useRecordingStatus } from '@composables/use-recording-status.js';
import { useSceneName } from '@composables/use-scene-name.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@composables/use-obs-websocket.js', async () => {
  const vue = await vi.importActual('vue');
  return {
    useObsWebsocket: () => ({
      obs: {
        on: () => {},
        off: () => {},
        call: () => Promise.resolve({ outputActive: false }),
      },
      connected: vue.ref(false),
    }),
  };
});

const EXPECTED_BAR_COUNT = 16;

describe('useRecordingStatus (singleton)', () => {
  it('returns the documented initial state', () => {
    const state = useRecordingStatus();
    expect(state.is_recording.value).toBe(false);
    expect(state.elapsed_time.value).toBe('00:00:00');
    expect(state.record_state.value).toBe('stopped');
    expect(state.take_count.value).toBe(0);
  });

  it('returns the same instance on repeated calls', () => {
    const a = useRecordingStatus();
    const b = useRecordingStatus();
    expect(a).toBe(b);
    expect(a.is_recording).toBe(b.is_recording);
  });
});

describe('useSceneName (singleton)', () => {
  it('initial scene_name is empty', () => {
    const state = useSceneName();
    expect(state.scene_name.value).toBe('');
  });

  it('returns the same instance on repeated calls', () => {
    const a = useSceneName();
    const b = useSceneName();
    expect(a).toBe(b);
    expect(a.scene_name).toBe(b.scene_name);
  });
});

describe('useAudioAnalyzer (singleton)', () => {
  it('returns a preallocated Float32Array of 16 levels', () => {
    const state = useAudioAnalyzer();
    expect(state.levels).toBeInstanceOf(Float32Array);
    expect(state.levels.length).toBe(EXPECTED_BAR_COUNT);
    expect(state.tick.value).toBe(0);
    expect(state.active.value).toBe(false);
    expect(state.source_name.value).toBe('');
  });

  it('returns the same instance on repeated calls', () => {
    const a = useAudioAnalyzer();
    const b = useAudioAnalyzer();
    expect(a).toBe(b);
    expect(a.levels).toBe(b.levels);
    expect(a.tick).toBe(b.tick);
  });
});

const post_message_spy = vi.fn();

class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  addEventListener() {}
  removeEventListener() {}
  postMessage(data) {
    post_message_spy(data);
  }
  close() {}
}

describe('useContextChannel (singleton)', () => {
  beforeAll(() => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('returns the same instance on repeated calls', () => {
    const a = useContextChannel();
    const b = useContextChannel();
    expect(a).toBe(b);
    expect(a.active_slug).toBe(b.active_slug);
    expect(a.sidebar_open).toBe(b.sidebar_open);
  });
});

describe('useContextChannel (initial state)', () => {
  it('starts with active_slug=null and sidebar_open=false', () => {
    const state = useContextChannel();
    expect(state.active_slug.value).toBe(null);
    expect(state.sidebar_open.value).toBe(false);
  });

  it('exposes setActiveSlug, toggleSidebar, hideSidebar methods', () => {
    const state = useContextChannel();
    expect(typeof state.setActiveSlug).toBe('function');
    expect(typeof state.toggleSidebar).toBe('function');
    expect(typeof state.hideSidebar).toBe('function');
  });
});

describe('useContextChannel (BroadcastChannel)', () => {
  it('postMessage fires when setActiveSlug runs', () => {
    const state = useContextChannel();
    post_message_spy.mockClear();
    state.setActiveSlug('obs-browser-sources');
    expect(post_message_spy).toHaveBeenCalledTimes(1);
    const payload = post_message_spy.mock.calls[0][0];
    expect(payload.active_slug).toBe('obs-browser-sources');
    expect(typeof payload.sidebar_open).toBe('boolean');
  });

  it('toggleSidebar flips sidebar_open and broadcasts', () => {
    const state = useContextChannel();
    const before = state.sidebar_open.value;
    post_message_spy.mockClear();
    state.toggleSidebar();
    expect(state.sidebar_open.value).toBe(!before);
    expect(post_message_spy).toHaveBeenCalledTimes(1);
    state.toggleSidebar();
    expect(state.sidebar_open.value).toBe(before);
  });
});
