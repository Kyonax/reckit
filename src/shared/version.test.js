/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Tests for the version pipeline — confirms that package.json's
 * version string flows through Vite's `define` and is derived
 * into VERSION_TAG correctly.
 */

import { VERSION, VERSION_TAG } from '@shared/version.js';
import { describe, expect, it } from 'vitest';

describe('version', () => {
  it('exposes a valid semver string from package.json', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('derives VERSION_TAG as v<major>.<minor>, stripping the patch', () => {
    const [major, minor] = VERSION.split('.');
    expect(VERSION_TAG).toBe(`v${major}.${minor}`);
  });

  it('VERSION_TAG starts with a leading "v"', () => {
    expect(VERSION_TAG.startsWith('v')).toBe(true);
  });
});
