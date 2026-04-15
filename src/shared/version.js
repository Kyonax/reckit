/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Version — single source of truth for runtime version strings.
 * The numeric version lives in package.json and is injected here
 * at build time via Vite's `define` config. Any UI that shows a
 * version must import from this module. Never hardcode the
 * string — bump package.json and it flows everywhere.
 */

const MAJOR_MINOR_SEGMENTS = 2;

/** Full semver string, e.g. "0.3.0". */
export const VERSION = __APP_VERSION__;

/** Short display tag, e.g. "v0.3". Strips the patch segment. */
export const VERSION_TAG = `v${VERSION
  .split('.')
  .slice(0, MAJOR_MINOR_SEGMENTS)
  .join('.')}`;
