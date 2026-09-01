/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { useObsWebsocket } from '@composables/use-obs-websocket.js';
import { ref, watch } from 'vue';

let shared_state = null;

export function useSceneName() {
  if (shared_state) {
    return shared_state;
  }

  const { obs, connected } = useObsWebsocket();
  const scene_name = ref('');

  function handleSceneChanged(event) {
    scene_name.value = event.sceneName || '';
  }

  async function fetchInitialScene() {
    try {
      const result = await obs.call('GetCurrentProgramScene');
      scene_name.value = result.sceneName || '';
    } catch {
      scene_name.value = '';
    }
  }

  obs.on('CurrentProgramSceneChanged', handleSceneChanged);

  watch(connected, (is_connected) => {
    if (is_connected) {
      fetchInitialScene();
    }
  }, { immediate: true });

  shared_state = { scene_name };
  return shared_state;
}
