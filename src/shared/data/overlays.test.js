/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Tests for the overlay registry — enforces the schema documented
 * in the session guidelines so future entries stay consistent.
 */

import { describe, expect, it } from 'vitest';

import { OVERLAYS } from './overlays.js';

const REQUIRED_FIELDS = [
  'id',
  'brand',
  'name',
  'description',
  'use_cases',
  'path',
  'width',
  'height',
  'fps',
  'requires',
  'triggers',
  'status',
];

const ALLOWED_STATUSES = ['ready', 'planned'];
const EM_DASH = '\u2014';

describe('OVERLAYS registry', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(OVERLAYS)).toBe(true);
    expect(OVERLAYS.length).toBeGreaterThan(0);
  });

  it('every overlay id is unique', () => {
    const ids = OVERLAYS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(OVERLAYS)('overlay $id declares every required field', (overlay) => {
    for (const field of REQUIRED_FIELDS) {
      expect(overlay).toHaveProperty(field);
    }
  });

  it.each(OVERLAYS)('overlay $id uses a valid status', (overlay) => {
    expect(ALLOWED_STATUSES).toContain(overlay.status);
  });

  it.each(OVERLAYS)(
    'overlay $id description has no em dashes',
    (overlay) => {
      expect(overlay.description).not.toContain(EM_DASH);
    },
  );

  it.each(OVERLAYS)(
    'overlay $id use_cases is a string array',
    (overlay) => {
      expect(Array.isArray(overlay.use_cases)).toBe(true);
      expect(
        overlay.use_cases.every((keyword) => typeof keyword === 'string'),
      ).toBe(true);
    },
  );

  it.each(OVERLAYS)(
    'overlay $id path matches /@brand/id',
    (overlay) => {
      expect(overlay.path).toBe(`/${overlay.brand}/${overlay.id}`);
    },
  );

  it.each(OVERLAYS)(
    'overlay $id canvas dimensions are positive integers',
    (overlay) => {
      expect(Number.isInteger(overlay.width)).toBe(true);
      expect(Number.isInteger(overlay.height)).toBe(true);
      expect(Number.isInteger(overlay.fps)).toBe(true);
      expect(overlay.width).toBeGreaterThan(0);
      expect(overlay.height).toBeGreaterThan(0);
      expect(overlay.fps).toBeGreaterThan(0);
    },
  );
});
