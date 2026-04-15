/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

import { onUnmounted, ref, watch } from 'vue';

/**
 * Composable — current OBS scene name.
 * Updates on scene changes via WebSocket events.
 *
 * @param {object} params
 * @param {object} params.obs - OBSWebSocket instance
 * @param {import('vue').Ref<boolean>} params.connected
 */
export function useSceneName({ obs, connected }) {
  const scene_name = ref('');

  function handleSceneChanged(event) {
    scene_name.value = event.sceneName || '';
  }

  async function fetchInitialScene() {
    try {
      const result = await obs.call(
        'GetCurrentProgramScene',
      );
      scene_name.value = result.sceneName || '';
    } catch {
      scene_name.value = '';
    }
  }

  obs.on(
    'CurrentProgramSceneChanged',
    handleSceneChanged,
  );

  watch(connected, (is_connected) => {
    if (is_connected) {
      fetchInitialScene();
    }
  });

  onUnmounted(() => {
    obs.off(
      'CurrentProgramSceneChanged',
      handleSceneChanged,
    );
  });

  return { scene_name };
}
