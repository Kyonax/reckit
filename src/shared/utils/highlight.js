/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * highlight — async wrapper around Shiki for syntax-tokenizing code
 * blocks rendered inside <UiOrgContent>. Returns a 2-D token array
 * ([line][token]) with `content` + `color` per token. Consumers
 * render tokens through Vue templates as <span :style> entries —
 * never via v-html (D11). Cache keyed by `lang::code` so the same
 * block isn't re-tokenized.
 *
 * Falls back to `null` when the language is not in the supported
 * set OR when Shiki throws — consumers then render plain text.
 */

import { codeToTokens } from 'shiki';

const SUPPORTED_LANGUAGES = new Set([
  'js',
  'javascript',
  'ts',
  'typescript',
  'vue',
  'html',
  'css',
  'scss',
  'json',
  'bash',
  'sh',
  'shell',
  'python',
  'py',
  'markdown',
  'md',
  'yaml',
  'yml',
  'diff',
]);

const SHIKI_THEME = 'tokyo-night';

const cache = new Map();

export async function highlightCode(code, language) {
  if (typeof code !== 'string' || code.length === 0) {
    return null;
  }
  const lang = (language || '').toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    return null;
  }
  const key = `${lang}::${code}`;
  if (cache.has(key)) {
    return cache.get(key);
  }
  try {
    const result = await codeToTokens(code, {
      lang,
      theme: SHIKI_THEME,
    });
    cache.set(key, result.tokens);
    return result.tokens;
  } catch {
    cache.set(key, null);
    return null;
  }
}
