/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 */

/**
 *   __  __                          _          __
 *  / /_/ /  ___   ___  _______ ____(_)__  ____/ /_
 * / __/ _ \/ -_) / _ \/ __/ -_) __/ / _ \/ __/ __/
 * \__/_//_/\__/ / .__/_/  \__/\__/_/_//_/\__/\__/
 *              /_/
 *
 * eslint.config.mjs — CCS code standards for browser JS
 * 2026-04-17
 *
 * ESLint flat-config enforcing Cyber Code Syndicate conventions
 * for browser JS. No TypeScript, no Node globals. The naming
 * table below is enforced via code review since ESLint core
 * cannot distinguish variable/function/class naming natively.
 *
 *   | Scope       | Style         | Example              |
 *   |-------------|---------------|----------------------|
 *   | functions   | camelCase     | startOverlay()       |
 *   | variables   | snake_case    | overlay_timer        |
 *   | constants   | UPPER_CASE    | MAX_RETRY            |
 *   | classes     | PascalCase    | HudController        |
 *   | filenames   | kebab-case    | scene-switcher.js    |
 *
 *   Global ignores
 *   Import ordering (simple-import-sort)
 *   Code quality rules
 *   Formatting rules
 *   Security bans (eval, innerHTML, document.write)
 *   Security plugin rules
 *   Unicorn extras
 *   JSDoc
 *   Test file overrides (Vitest globals)
 *
 * Guidelines:
 *   2-space indent, single quotes, semicolons, trailing commas
 *   prefer-const, no-var, eqeqeq always
 *   prefer-template over string concatenation
 *   No magic numbers (ignore -1, 0, 1, 2)
 *   Composables clean up listeners in onUnmounted
 *
 * Requirements:
 * detect-object-injection on loop indexes are false positives
 *
 * Cristian D. Moreno (Kyonax)
 * kyonax.corp@gmail.com
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import vue from 'eslint-plugin-vue';
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
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      jsdoc,
      'simple-import-sort': simpleImportSort,
      security,
      unicorn,
    },

    rules: {
      // ── Naming conventions (CCS standards) ─────────────────
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'method',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'parameter',
          format: ['snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
          filter: { regex: '[/\\-@: ]|^__.*__$', match: true },
        },
        {
          selector: 'objectLiteralProperty',
          format: ['PascalCase', 'camelCase', 'snake_case', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: ['snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
      ],

      // ── Import ordering ────────────────────────────────────
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // ── Filename conventions ─────────────────────────────────
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
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Vitest globals (enabled via `test.globals: true` in
        // vite.config.js — no import needed inside tests).
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-magic-numbers': 'off',
      'no-console': 'off',
      'max-len': 'off',
    },
  },

  // ── Vue SFC base (plugin, processor, essential rules) ────────
  ...vue.configs['flat/essential'],
  ...vue.configs['flat/strongly-recommended'],

  // ── Vue SFC overrides (project-specific rules) ──────────────
  {
    files: ['**/*.vue'],

    languageOptions: {
      parserOptions: {
        parser: tsParser,
        project: './tsconfig.eslint.json',
        extraFileExtensions: ['.vue'],
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      security,
      unicorn,
    },

    rules: {
      // ── Vue rule overrides ─────────────────────────────────
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': ['warn', 2],
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/prop-name-casing': 'off',
      'vue/valid-define-props': 'off',

      // ── Naming conventions (CCS standards) ─────────────────
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'method',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'parameter',
          format: ['snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
          filter: { regex: '[/\\-@: ]|^__.*__$', match: true },
        },
        {
          selector: 'objectLiteralProperty',
          format: ['PascalCase', 'camelCase', 'snake_case', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: ['snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
      ],

      // ── Import ordering ────────────────────────────────────
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      // ── Code quality (same as JS ruleset) ──────────────────
      'no-console': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'all'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': ['error', 'always'],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          enforceConst: true,
        },
      ],

      // ── Security ───────────────────────────────────────────
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-unsafe-regex': 'error',

      // ── Unicorn ────────────────────────────────────────────
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['^App\\.vue$'],
        },
      ],
    },
  },
];
