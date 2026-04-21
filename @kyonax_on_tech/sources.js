/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Web source registry for @kyonax_on_tech.
 */

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const TARGET_FPS = 60;

export default [
  {
    id: 'cam-log',
    type: 'hud',
    brand: '@kyonax_on_tech',
    name: 'CAM-LOG',
    description:
      'Futuristic **HUD** layered over the '
      + '**direct-to-camera feed** for **log-style segments**. '
      + 'Identifies the **speaker**, tracks **takes** and '
      + '**recording time**, and surfaces **live audio levels**, '
      + 'turning a plain talking-head shot into a '
      + '**tactical visual log entry**.',
    use_cases: [
      'vlogs',
      'tutorials',
      'code walkthroughs',
      'reaction segments',
      'talking head',
      'person to camera',
    ],
    path: '/@kyonax_on_tech/cam-log',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    fps: TARGET_FPS,
    requires: [
      'OBS WebSocket enabled (port 4455)',
      'Audio source named Mic/Aux',
      'Browser source layered above webcam',
    ],
    triggers: [],
    status: 'ready',
  },
  {
    id: 'item-explain',
    type: 'animation',
    brand: '@kyonax_on_tech',
    name: 'ITEM-EXPLAIN',
    description:
      '**Lower-third overlay** for introducing items on '
      + 'screen with a **cinematic entry**. Displays an '
      + '**image**, **title**, **description**, and optional '
      + '**banners**, animating in and out on demand.',
    use_cases: [
      'product demos',
      'tool showcase',
      'concept intro',
      'citation callout',
      'lower third',
      'scene reveal',
    ],
    path: '/@kyonax_on_tech/item-explain',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    fps: TARGET_FPS,
    requires: [
      'OBS WebSocket enabled (port 4455)',
    ],
    triggers: [
      {
        id: 'show',
        label: 'SHOW',
        description: 'Trigger entry animation with dummy data',
        payload: {
          action: 'show',
          title: 'Sample Item Title',
          description:
            'A short description that demonstrates how '
            + 'the overlay renders content during preview.',
          image: '',
        },
      },
      {
        id: 'hide',
        label: 'HIDE',
        description: 'Trigger exit animation',
        payload: { action: 'hide' },
      },
      {
        id: 'cycle',
        label: 'CYCLE',
        description: 'Run a full show, wait, hide sequence',
        payload: { action: 'cycle', duration_ms: 5000 },
      },
    ],
    status: 'planned',
  },
];
