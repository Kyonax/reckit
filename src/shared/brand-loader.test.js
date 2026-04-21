/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Tests for the brand-loader auto-discovery engine.
 * Validates brand metadata and web source schema.
 */

import { BRANDS, SOURCES } from '@shared/brand-loader.js';
import { describe, expect, it } from 'vitest';

const REQUIRED_SOURCE_FIELDS = [
  'id',
  'type',
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
const ALLOWED_TYPES = ['hud', 'animation', 'scene'];
const EM_DASH = '\u2014';

describe('Brand loader — BRANDS', () => {
  it('discovers at least one brand', () => {
    expect(BRANDS.length).toBeGreaterThan(0);
  });

  it.each(BRANDS)(
    'brand $handle has handle, name, description',
    (brand) => {
      expect(brand).toHaveProperty('handle');
      expect(brand).toHaveProperty('name');
      expect(brand).toHaveProperty('description');
      expect(typeof brand.handle).toBe('string');
      expect(typeof brand.name).toBe('string');
      expect(typeof brand.description).toBe('string');
    },
  );

  it.each(BRANDS)(
    'brand $handle has identity with author and display_handle',
    (brand) => {
      expect(brand).toHaveProperty('identity');
      expect(brand.identity).toHaveProperty('author');
      expect(brand.identity).toHaveProperty('display_handle');
    },
  );

  it.each(BRANDS)(
    'brand $handle has links object',
    (brand) => {
      expect(brand).toHaveProperty('links');
      expect(typeof brand.links).toBe('object');
    },
  );

  it.each(BRANDS)(
    'brand $handle does NOT carry a colors field (theme lives in styles/_theme.scss)',
    (brand) => {
      expect(brand.colors).toBeUndefined();
    },
  );

  it('every brand handle is unique', () => {
    const handles = BRANDS.map((b) => b.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });
});

describe('Brand loader — SOURCES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SOURCES)).toBe(true);
    expect(SOURCES.length).toBeGreaterThan(0);
  });

  it('every source composite key (brand/id) is unique', () => {
    const keys = SOURCES.map((s) => `${s.brand}/${s.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(SOURCES)(
    'source $id declares every required field',
    (source) => {
      for (const field of REQUIRED_SOURCE_FIELDS) {
        expect(source).toHaveProperty(field);
      }
    },
  );

  it.each(SOURCES)(
    'source $id has a valid type',
    (source) => {
      expect(ALLOWED_TYPES).toContain(source.type);
    },
  );

  it.each(SOURCES)(
    'source $id uses a valid status',
    (source) => {
      expect(ALLOWED_STATUSES).toContain(source.status);
    },
  );

  it.each(SOURCES)(
    'source $id description has no em dashes',
    (source) => {
      expect(source.description).not.toContain(EM_DASH);
    },
  );

  it.each(SOURCES)(
    'source $id use_cases is a string array',
    (source) => {
      expect(Array.isArray(source.use_cases)).toBe(true);
      expect(
        source.use_cases.every((k) => typeof k === 'string'),
      ).toBe(true);
    },
  );

  it.each(SOURCES)(
    'source $id path matches /@brand/id',
    (source) => {
      expect(source.path).toBe(`/${source.brand}/${source.id}`);
    },
  );

  it.each(SOURCES)(
    'source $id canvas dimensions are positive integers',
    (source) => {
      expect(Number.isInteger(source.width)).toBe(true);
      expect(Number.isInteger(source.height)).toBe(true);
      expect(Number.isInteger(source.fps)).toBe(true);
      expect(source.width).toBeGreaterThan(0);
      expect(source.height).toBeGreaterThan(0);
      expect(source.fps).toBeGreaterThan(0);
    },
  );

  it.each(SOURCES)(
    'source $id brand exists in BRANDS',
    (source) => {
      const handles = BRANDS.map((b) => b.handle);
      expect(handles).toContain(source.brand);
    },
  );
});
