/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Tests for the org topic library: required-field enforcement,
 * metadata extraction, filetag parsing, marquee block extraction,
 * body partitioning. Covers Plan #context-screen Q5 schema lock.
 */

import {
  collectBodyNodes,
  extractFiletags,
  extractMarqueeBlock,
  extractMetaKey,
  OrgSchemaError,
  parseOrg,
} from '@shared/utils/org.js';
import { unified } from 'unified';
import uniorgParse from 'uniorg-parse';
import { describe, expect, it } from 'vitest';

const FULL_FIXTURE = `#+TITLE: Hello
#+SUBTITLE: A second line
#+DESCRIPTION: Short description for the lower-third strip.
#+TAGS: :alpha:beta:gamma:

#+begin_marquee
First item
Second item
Third item
#+end_marquee

* Section A

A paragraph with content.

#+begin_src js
const x = 1;
#+end_src
`;

const MIN_FIXTURE = `#+TITLE: Quick Note
#+DESCRIPTION: Minimal context — no marquee, no body.
`;

const MISSING_DESCRIPTION_FIXTURE = `#+TITLE: Only Title
`;

const MISSING_BOTH_FIXTURE = `#+TAGS: :nope:
`;

const NO_MARQUEE_FIXTURE = `#+TITLE: A
#+DESCRIPTION: B
* Body section
Content paragraph.
`;

const FILETAGS_FIXTURE = `#+TITLE: A
#+DESCRIPTION: B
#+FILETAGS: :tag1:tag2:
`;

const EXPECTED_TAG_COUNT = 3;
const EXPECTED_MARQUEE_COUNT = 3;

function parseRaw(raw_string) {
  return unified().use(uniorgParse).parse(raw_string);
}

describe('parseOrg — happy path', () => {
  it('extracts every locked Q5 schema field from the full fixture', () => {
    const result = parseOrg(FULL_FIXTURE);
    expect(result.title).toBe('Hello');
    expect(result.subtitle).toBe('A second line');
    expect(result.description).toBe(
      'Short description for the lower-third strip.',
    );
    expect(result.tags).toHaveLength(EXPECTED_TAG_COUNT);
    expect(result.tags).toEqual(['alpha', 'beta', 'gamma']);
    expect(result.marquee_items).toHaveLength(EXPECTED_MARQUEE_COUNT);
    expect(result.marquee_items[0]).toBe('First item');
    expect(Array.isArray(result.body_ast)).toBe(true);
    expect(result.body_ast.length).toBeGreaterThan(0);
  });

  it('returns null subtitle + empty arrays for the minimal fixture', () => {
    const result = parseOrg(MIN_FIXTURE);
    expect(result.title).toBe('Quick Note');
    expect(result.subtitle).toBe(null);
    expect(result.tags).toEqual([]);
    expect(result.marquee_items).toEqual([]);
  });
});

describe('parseOrg — error paths', () => {
  it('throws OrgSchemaError when DESCRIPTION is missing', () => {
    expect(() => parseOrg(MISSING_DESCRIPTION_FIXTURE)).toThrow(
      OrgSchemaError,
    );
  });

  it('throws OrgSchemaError when both required keys are missing', () => {
    let thrown = null;
    try {
      parseOrg(MISSING_BOTH_FIXTURE);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(OrgSchemaError);
    expect(thrown.missing_keys).toEqual(['TITLE', 'DESCRIPTION']);
  });
});

describe('extractMetaKey', () => {
  it('returns the keyword value when present', () => {
    const ast = parseRaw('#+TITLE: Hello\n');
    expect(extractMetaKey(ast, 'TITLE')).toBe('Hello');
  });

  it('returns null for an absent key', () => {
    const ast = parseRaw('#+TITLE: Hello\n');
    expect(extractMetaKey(ast, 'SUBTITLE')).toBe(null);
  });

  it('handles a null AST gracefully', () => {
    expect(extractMetaKey(null, 'TITLE')).toBe(null);
  });
});

describe('extractFiletags', () => {
  it('parses the colon-delimited TAGS form', () => {
    const ast = parseRaw('#+TAGS: :a:b:c:\n');
    expect(extractFiletags(ast)).toEqual(['a', 'b', 'c']);
  });

  it('also recognises FILETAGS', () => {
    const ast = parseRaw(FILETAGS_FIXTURE);
    expect(extractFiletags(ast)).toEqual(['tag1', 'tag2']);
  });

  it('returns an empty array when no tag keyword is present', () => {
    const ast = parseRaw('#+TITLE: A\n');
    expect(extractFiletags(ast)).toEqual([]);
  });
});

describe('extractMarqueeBlock', () => {
  it('returns the items split by newline, trimmed, no empties', () => {
    const ast = parseRaw(FULL_FIXTURE);
    const items = extractMarqueeBlock(ast);
    expect(items).toEqual(['First item', 'Second item', 'Third item']);
  });

  it('returns an empty array when no marquee block is present', () => {
    const ast = parseRaw(NO_MARQUEE_FIXTURE);
    expect(extractMarqueeBlock(ast)).toEqual([]);
  });
});

describe('collectBodyNodes', () => {
  it('filters out top-level keywords', () => {
    const ast = parseRaw(FULL_FIXTURE);
    const body = collectBodyNodes(ast);
    expect(body.every((node) => node.type !== 'keyword')).toBe(true);
  });

  it('filters out the marquee special-block', () => {
    const ast = parseRaw(FULL_FIXTURE);
    const body = collectBodyNodes(ast);
    expect(
      body.every(
        (node) =>
          !(node.type === 'special-block' && node.blockType === 'marquee'),
      ),
    ).toBe(true);
  });

  it('preserves headlines, sections, paragraphs, src-blocks', () => {
    const ast = parseRaw(FULL_FIXTURE);
    const body = collectBodyNodes(ast);
    expect(body.length).toBeGreaterThan(0);
  });
});
