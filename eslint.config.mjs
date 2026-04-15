/**
 * ================================================================
 *  RECKIT -- ESLint Flat-Config
 * ================================================================
 *
 *  Repository : kyo-recording-automation (RECKIT)
 *  Author     : Cristian D. Moreno -- Kyonax
 *  License    : MPL-2.0
 *
 *  Based on CCS code standards for **browser JS**
 *  (no TypeScript, no Node globals).
 *
 *  Enforced conventions
 *  --------------------
 *  | Scope       | Style         | Example              |
 *  |-------------|---------------|----------------------|
 *  | functions   | camelCase     | startOverlay()       |
 *  | variables   | snake_case    | overlay_timer        |
 *  | constants   | UPPER_CASE    | MAX_RETRY            |
 *  | classes     | PascalCase    | HudController        |
 *  | filenames   | kebab-case    | scene-switcher.js    |
 *
 *  Plugins
 *  -------
 *  - @eslint/js           -- ESLint recommended baseline
 *  - eslint-plugin-import -- import analysis (via simple-import-sort)
 *  - eslint-plugin-jsdoc  -- JSDoc quality
 *  - eslint-plugin-simple-import-sort -- deterministic import order
 *  - eslint-plugin-unicorn -- opinionated best-practices
 *  - eslint-plugin-security -- static security analysis
 *
 *  Last sync with CCS standards : 2026-04-13
 * ================================================================
 */

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

export default [
  // ── Global ignores ───────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.cache/**',
      'assets/**',
    ],
  },

  // ── Base: ESLint recommended ─────────────────────────────────
  js.configs.recommended,

  // ── Main ruleset (browser JS) ────────────────────────────────
  {
    files: ['**/*.{js,mjs}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
    },

    plugins: {
      import: importPlugin,
      jsdoc,
      'simple-import-sort': simpleImportSort,
      security,
      unicorn,
    },

    rules: {
      // ── Import ordering ────────────────────────────────────
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // ── Naming conventions ─────────────────────────────────
      // Enforced via code-review convention (ESLint core cannot
      // distinguish variable/function/class naming natively).
      // The unicorn/filename-case rule handles file names.
      'unicorn/filename-case': [
        'error',
        { case: 'kebabCase' },
      ],

      // ── Code quality ───────────────────────────────────────
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'max-len': [
        'warn',
        {
          code: 80,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          enforceConst: true,
        },
      ],
      'no-nested-ternary': 'error',
      'no-else-return': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': ['error', 'always'],

      // ── Formatting ─────────────────────────────────────────
      'comma-dangle': ['error', 'always-multiline'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-in-parens': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'eol-last': ['error', 'always'],

      // ── Security: explicit dangerous-pattern bans ──────────
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // ── Security plugin rules ──────────────────────────────
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-object-injection': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',

      // ── innerHTML ban (prefer textContent) ─────────────────
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'write',
          message: 'Use DOM APIs instead of document.write().',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'AssignmentExpression[left.property.name="innerHTML"]',
          message:
            'Do not assign to innerHTML. Use textContent or DOM '
            + 'APIs to avoid XSS vulnerabilities.',
        },
      ],

      // ── Unicorn extras ─────────────────────────────────────
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-dom-node-append': 'error',
      'unicorn/prefer-dom-node-remove': 'error',
      'unicorn/prefer-dom-node-text-content': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-modern-dom-apis': 'error',
      'unicorn/prefer-number-properties': 'error',

      // ── JSDoc ──────────────────────────────────────────────
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/check-alignment': 'warn',
    },
  },

  // ── Test file overrides ──────────────────────────────────────
  {
    files: [
      '**/*.test.{js,mjs}',
      '**/*.spec.{js,mjs}',
      '**/__tests__/**/*.{js,mjs}',
    ],
    rules: {
      'no-magic-numbers': 'off',
      'no-console': 'off',
      'max-len': 'off',
    },
  },
];
