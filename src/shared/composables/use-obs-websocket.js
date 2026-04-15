/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
import { ref } from 'vue';

import { OBS_CONFIG } from '../config.js';

const RECONNECT_DELAY = 5000;

let shared_state = null;

/**
 * Composable — shared OBS WebSocket connection.
 * Singleton: every caller receives the same instance.
 * Auto-reconnects on disconnect. Subscribes to all events
 * including InputVolumeMeters (high-volume, opt-in).
 */
export function useObsWebsocket() {
  if (shared_state) {
    return shared_state;
  }

  const obs = new OBSWebSocket();
  const connected = ref(false);
  const error = ref(null);

  let reconnect_timer = null;
  let is_destroyed = false;

  async function connect() {
    if (is_destroyed) {
      return;
    }

    try {
      const url = `ws://${OBS_CONFIG.host}:${OBS_CONFIG.port}`;

      await obs.connect(url, OBS_CONFIG.password, {
        eventSubscriptions:
          EventSubscription.All
          | EventSubscription.InputVolumeMeters,
      });

      connected.value = true;
      error.value = null;
    } catch (err) {
      connected.value = false;
      error.value = err.message || 'Connection failed';
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (is_destroyed || reconnect_timer) {
      return;
    }

    reconnect_timer = setTimeout(() => {
      reconnect_timer = null;
      connect();
    }, RECONNECT_DELAY);
  }

  obs.on('ConnectionClosed', () => {
    connected.value = false;
    scheduleReconnect();
  });

  obs.on('ConnectionError', (err) => {
    connected.value = false;
    error.value = err.message || 'Connection error';
    scheduleReconnect();
  });

  function disconnect() {
    is_destroyed = true;

    if (reconnect_timer) {
      clearTimeout(reconnect_timer);
      reconnect_timer = null;
    }

    obs.disconnect();
    connected.value = false;
    shared_state = null;
  }

  connect();
  shared_state = { obs, connected, error, disconnect };
  return shared_state;
}
