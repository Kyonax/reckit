/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * org — topic library (Rule J) for parsing RECKIT context .org files.
 * Wraps uniorg-parse to produce a unified AST, then partitions the
 * top-level nodes into metadata (title, subtitle, description, tags),
 * a marquee items array (extracted from a `#+begin_marquee` special
 * block), and a body AST (everything else, rendered in the sidebar
 * via <UiOrgContent> per D11 — never via v-html).
 *
 * Required keys: TITLE, DESCRIPTION. Missing either throws
 * `OrgSchemaError` so a malformed .org surfaces a parser-error
 * indicator on the corresponding card (D7).
 *
 * Schema lock: see plan node Plan #context-screen, decisions D7 + D11.
 */

import { unified } from 'unified';
import uniorgParse from 'uniorg-parse';

const MARQUEE_BLOCK_NAME = 'marquee';
const REQUIRED_KEYS = ['TITLE', 'DESCRIPTION'];
const TAG_KEYS = ['FILETAGS', 'TAGS'];
const TAG_DELIMITER = ':';

const processor = unified().use(uniorgParse);

export class OrgSchemaError extends Error {
  constructor(message, missing_keys = []) {
    super(message);
    this.name = 'OrgSchemaError';
    this.missing_keys = missing_keys;
  }
}

export function parseOrg(raw_string) {
  const ast = processor.parse(raw_string);

  const required_values = {};
  const missing = [];
  for (const key of REQUIRED_KEYS) {
    const value = extractMetaKey(ast, key);
    if (value === null) {
      missing.push(key);
    } else {
      required_values[key] = value;
    }
  }
  if (missing.length > 0) {
    throw new OrgSchemaError(
      `Required org keyword(s) missing: ${missing.join(', ')}`,
      missing,
    );
  }

  return {
    title: required_values.TITLE,
    subtitle: extractMetaKey(ast, 'SUBTITLE'),
    description: required_values.DESCRIPTION,
    tags: extractFiletags(ast),
    marquee_items: extractMarqueeBlock(ast),
    body_ast: collectBodyNodes(ast),
  };
}

export function extractMetaKey(ast, key) {
  if (!ast || !Array.isArray(ast.children)) {
    return null;
  }
  for (const node of ast.children) {
    if (node.type === 'keyword' && node.key === key) {
      return typeof node.value === 'string' ? node.value : null;
    }
  }
  return null;
}

export function extractFiletags(ast) {
  if (!ast || !Array.isArray(ast.children)) {
    return [];
  }
  for (const node of ast.children) {
    if (node.type !== 'keyword') {
      continue;
    }
    if (!TAG_KEYS.includes(node.key)) {
      continue;
    }
    const raw_value = typeof node.value === 'string' ? node.value : '';
    return raw_value
      .split(TAG_DELIMITER)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  return [];
}

export function extractMarqueeBlock(ast) {
  if (!ast || !Array.isArray(ast.children)) {
    return [];
  }
  for (const node of ast.children) {
    if (
      node.type === 'special-block'
      && node.blockType === MARQUEE_BLOCK_NAME
    ) {
      return collectTextLines(node);
    }
  }
  return [];
}

export function collectBodyNodes(ast) {
  if (!ast || !Array.isArray(ast.children)) {
    return [];
  }
  const body = [];
  for (const node of ast.children) {
    if (node.type === 'keyword') {
      continue;
    }
    if (
      node.type === 'special-block'
      && node.blockType === MARQUEE_BLOCK_NAME
    ) {
      continue;
    }
    body.push(node);
  }
  return body;
}

function collectTextLines(node) {
  const buffer = [];
  walkText(node, buffer);
  return buffer
    .join('')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function walkText(node, buffer) {
  if (!node) {
    return;
  }
  if (node.type === 'text' && typeof node.value === 'string') {
    buffer.push(node.value);
    return;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkText(child, buffer);
    }
  }
}
