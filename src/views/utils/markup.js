/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * markup — inline-markup parsers for view-rendered content.
 * Topic-based library (Rule J): tokenizes authored strings with
 * lightweight markers (e.g. ** **, [label](url), `code`) into
 * structured segments that Vue templates can iterate over.
 *
 * Add new markup parsers here as named exports — do NOT create a
 * new file per parser. Leave typography/CSS-level helpers (font
 * sizes, tabular nums, letter-spacing resolvers) for a future
 * typography.js — this file is about PARSING, not STYLING.
 *
 *   Exports:
 *     parseEmphasis(text)   tokenizes ** ** bold markers into segments
 */

const EMPHASIS_PATTERN = /\*\*(.+?)\*\*/g;

/**
 * Parse `**bold**` markers in text into an array of
 * `{ text, bold }` segments for Vue template rendering.
 *
 * @param {string} text
 * @returns {Array<{ text: string, bold: boolean }>}
 */
export function parseEmphasis(text) {
  if (!text) {
    return [];
  }

  const segments = [];
  let last_index = 0;

  for (const match of text.matchAll(EMPHASIS_PATTERN)) {
    if (match.index > last_index) {
      segments.push({
        text: text.slice(last_index, match.index),
        bold: false,
      });
    }

    segments.push({ text: match[1], bold: true });
    last_index = match.index + match[0].length;
  }

  if (last_index < text.length) {
    segments.push({ text: text.slice(last_index), bold: false });
  }

  return segments;
}
