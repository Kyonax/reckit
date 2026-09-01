<!--
  Copyright (c) 2026 Cristian D. Moreno — @Kyonax
  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/

  ui-org-content — domain-agnostic recursive renderer for org-mode
  ASTs produced by uniorg-parse. Walks `node.children` via v-for,
  dispatches one template branch per node type per Plan #context-
  screen D10 (futuristic-but-readable styling). Zero v-html, zero
  innerHTML — D11 (project ESLint bans innerHTML assignment via
  no-restricted-syntax; v-html compiles to innerHTML under the
  hood). All text content flows through Vue's template engine via
  mustache or scoped <span>; code blocks via <pre><code>{{ value }}
  </code></pre>.

  Self-referential — uses defineOptions({ name }) so the recursive
  template binding resolves.

  Props:
    ast — Array of OrgNode. Default empty array.
-->

<template>
  <div class="org-content">
    <template
      v-for="(node, index) in ast"
      :key="index"
    >
      <!-- section: unwrap, render its children -->
      <UiOrgContent
        v-if="node.type === 'section'"
        :ast="node.children"
      />

      <!-- headline: maps level 1 → h2 (page-level h1 lives in strip) -->
      <component
        :is="headlineTag(node.level)"
        v-else-if="node.type === 'headline'"
        :class="['org-headline', `org-headline--h${node.level}`]"
      >
        <UiOrgContent
          v-if="node.children && node.children.length"
          :ast="node.children"
        />
      </component>

      <!-- paragraph -->
      <p
        v-else-if="node.type === 'paragraph'"
        class="org-paragraph"
      >
        <UiOrgContent :ast="node.children" />
      </p>

      <!-- text leaf -->
      <span
        v-else-if="node.type === 'text'"
      >{{ node.value }}</span>

      <!-- inline marks -->
      <strong
        v-else-if="node.type === 'bold'"
        class="org-bold"
      >
        <UiOrgContent :ast="node.children" />
      </strong>
      <em
        v-else-if="node.type === 'italic'"
        class="org-italic"
      >
        <UiOrgContent :ast="node.children" />
      </em>
      <code
        v-else-if="node.type === 'verbatim'"
        class="org-verbatim"
      >{{ node.value }}</code>
      <code
        v-else-if="node.type === 'code'"
        class="org-inline-code"
      >{{ node.value }}</code>
      <s
        v-else-if="node.type === 'strike-through'"
        class="org-strike"
      >
        <UiOrgContent :ast="node.children" />
      </s>
      <u
        v-else-if="node.type === 'underline'"
        class="org-underline"
      >
        <UiOrgContent :ast="node.children" />
      </u>

      <!-- plain-list -->
      <ul
        v-else-if="node.type === 'plain-list' && node.listType === 'unordered'"
        class="org-list org-list--unordered"
      >
        <UiOrgContent :ast="node.children" />
      </ul>
      <ol
        v-else-if="node.type === 'plain-list' && node.listType === 'ordered'"
        class="org-list org-list--ordered"
      >
        <UiOrgContent :ast="node.children" />
      </ol>
      <dl
        v-else-if="node.type === 'plain-list' && node.listType === 'descriptive'"
        class="org-list org-list--descriptive"
      >
        <UiOrgContent :ast="node.children" />
      </dl>

      <!-- list-item (with optional checkbox) -->
      <li
        v-else-if="node.type === 'list-item'"
        :class="['org-list-item', checkboxModifierClass(node)]"
      >
        <span
          v-if="node.checkbox"
          class="org-checkbox"
        >{{ checkboxGlyph(node.checkbox) }}</span>
        <UiOrgContent :ast="node.children" />
      </li>

      <!-- table — rows and cells rendered inline (NOT through recursive
           UiOrgContent) because the recursive call wraps children in a
           `<div class="org-content">`, and Chromium does not reliably
           honor `display: contents` on a div sitting inside <tbody> /
           <tr>. The browser inserts an anonymous tbody to repair table
           structure, which collapses widths and hides cells. Iterating
           rows + cells directly keeps table layout valid; cell contents
           still flow through UiOrgContent so inline marks render. -->
      <table
        v-else-if="node.type === 'table'"
        class="org-table"
      >
        <tbody>
          <tr
            v-for="(row, ri) in standardRows(node)"
            :key="ri"
            class="org-table__row"
          >
            <td
              v-for="(cell, ci) in (row.children || [])"
              :key="ci"
              class="org-table__cell"
            >
              <UiOrgContent :ast="cell.children || []" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- src-block: Shiki tokens when available; plain fallback otherwise.
           Each token is split into whitespace / non-whitespace runs so
           the WS runs can render with 2px-square indent markers. -->
      <pre
        v-else-if="node.type === 'src-block'"
        class="org-src-block"
      ><span
        v-if="node.language"
        class="org-src-block__lang"
      >{{ node.language }}</span><code
        v-if="tokenized.get(srcKey(node))"
        class="org-src-block__code"
      ><template
        v-for="(line, lineIdx) in tokenized.get(srcKey(node))"
        :key="lineIdx"
      ><template
        v-for="(tok, tIdx) in line"
        :key="tIdx"
      ><template
        v-for="(seg, sIdx) in splitWhitespaceSegments(tok.content)"
        :key="sIdx"
      ><span
        v-if="seg.is_ws"
        class="org-src-block__ws"
      >{{ seg.text }}</span><span
        v-else
        :style="{ color: tok.color }"
      >{{ seg.text }}</span></template></template>{{ '\n' }}</template></code><code
        v-else
        class="org-src-block__code"
      >{{ node.value }}</code></pre>

      <!-- #+RESULTS: block (fixed-width with affiliated.RESULTS) -->
      <pre
        v-else-if="node.type === 'fixed-width' && hasResults(node)"
        class="org-results"
      ><span class="org-results__label">OUTPUT</span><code class="org-results__code">{{ node.value }}</code></pre>

      <!-- example-block -->
      <pre
        v-else-if="node.type === 'example-block'"
        class="org-example"
      ><code>{{ node.value }}</code></pre>

      <!-- alert-style quote-block (GitHub-flavored alerts: NOTE, TIP,
           IMPORTANT, WARNING, CAUTION). Detected when a quote-block's
           first text leaf starts with `[!TYPE]`. The prefix is
           stripped from the rendered body and the type drives the
           surface + label color. -->
      <aside
        v-else-if="node.type === 'quote-block' && detectAlertType(node)"
        :class="['org-alert', `org-alert--${detectAlertType(node).toLowerCase()}`]"
      >
        <header class="org-alert__header">
          <svg
            class="org-alert__icon"
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          ><path :d="ALERT_SVG_PATHS[detectAlertType(node)]" /></svg>
          <span class="org-alert__label">{{ detectAlertType(node) }}</span>
        </header>
        <div class="org-alert__body">
          <UiOrgContent :ast="alertBody(node)" />
        </div>
      </aside>

      <!-- quote-block (plain) -->
      <blockquote
        v-else-if="node.type === 'quote-block'"
        class="org-quote"
      >
        <UiOrgContent :ast="node.children" />
      </blockquote>

      <!-- link -->
      <a
        v-else-if="node.type === 'link' && isExternalLink(node)"
        class="org-link"
        :href="node.rawLink"
        target="_blank"
        rel="noopener noreferrer"
      >
        <UiOrgContent
          v-if="node.children && node.children.length"
          :ast="node.children"
        />
        <span v-else>{{ node.rawLink }}</span>
      </a>
      <span
        v-else-if="node.type === 'link'"
        class="org-link org-link--internal"
      >
        <UiOrgContent
          v-if="node.children && node.children.length"
          :ast="node.children"
        />
        <span v-else>{{ node.rawLink }}</span>
      </span>

      <!-- horizontal rule -->
      <hr
        v-else-if="node.type === 'horizontal-rule'"
        class="org-hr"
      >

      <!-- property-drawer / drawer / unknown: silently filtered -->
    </template>
  </div>
</template>

<script setup>
import { highlightCode } from '@shared/utils/highlight.js';
import { ref, watch } from 'vue';

const HEADLINE_LEVEL_OFFSET = 1;
const MAX_HEADLINE_TAG = 6;

const CHECKBOX_GLYPH_OFF = '▢';
const CHECKBOX_GLYPH_ON = '▣';
const CHECKBOX_GLYPH_TRANS = '▨';

const EXTERNAL_LINK_TYPES = new Set([
  'http',
  'https',
  'ftp',
  'mailto',
  'tel',
]);

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
const ALERT_PREFIX_RE = /^\[!(\w+)\]\s*/;
/*
 * Octicon path data straight from GitHub's primer/octicons repository
 * (16px viewBox, MIT licensed). Each glyph fills with `currentColor`
 * so the icon inherits the alert header's brand color (the saturated
 * 100-shade per family, set per `.org-alert--<type>` below).
 *
 * info / light-bulb / report / alert / stop are the exact icons GitHub
 * renders inside its NOTE / TIP / IMPORTANT / WARNING / CAUTION
 * Markdown alerts.
 */
const ALERT_SVG_PATHS = {
  NOTE: 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
  TIP: 'M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z',
  IMPORTANT: 'M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  WARNING: 'M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  CAUTION: 'M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
};

defineOptions({ name: 'UiOrgContent' });

const props = defineProps({
  ast: {
    type: Array,
    default: () => [],
  },
});

const tokenized = ref(new Map());

function headlineTag(level) {
  const target = (level || 1) + HEADLINE_LEVEL_OFFSET;
  const clamped = target > MAX_HEADLINE_TAG ? MAX_HEADLINE_TAG : target;
  return `h${clamped}`;
}

function checkboxGlyph(state) {
  if (state === 'on') {
    return CHECKBOX_GLYPH_ON;
  }
  if (state === 'trans') {
    return CHECKBOX_GLYPH_TRANS;
  }
  return CHECKBOX_GLYPH_OFF;
}

function checkboxModifierClass(node) {
  if (!node.checkbox) {
    return '';
  }
  if (node.checkbox === 'on') {
    return 'org-list-item--done';
  }
  if (node.checkbox === 'trans') {
    return 'org-list-item--partial';
  }
  return 'org-list-item--todo';
}

function hasResults(node) {
  return Boolean(node.affiliated && 'RESULTS' in node.affiliated);
}

function isExternalLink(node) {
  return EXTERNAL_LINK_TYPES.has(node.linkType);
}

function standardRows(table_node) {
  if (!Array.isArray(table_node.children)) {
    return [];
  }
  return table_node.children.filter(
    (child) => child.type === 'table-row' && child.rowType === 'standard',
  );
}

/*
 * GitHub-flavored alert detection.
 * A quote-block becomes an alert when its first text leaf starts with
 * `[!TYPE]` for any of: NOTE, TIP, IMPORTANT, WARNING, CAUTION.
 * Detection walks into the first paragraph's first text node (the
 * common uniorg shape for `#+begin_quote\n[!NOTE]\n…body\n#+end_quote`).
 */
function firstAlertText(quote_node) {
  if (!Array.isArray(quote_node.children)) {
    return null;
  }
  const first = quote_node.children[0];
  if (!first) {
    return null;
  }
  if (first.type === 'paragraph' && Array.isArray(first.children)) {
    const text_leaf = first.children.find((child) => child.type === 'text');
    return text_leaf ? text_leaf.value : null;
  }
  if (first.type === 'text') {
    return first.value;
  }
  return null;
}

/*
 * Memoize the detection so the template (which calls this 3× per
 * alert quote-block — `v-else-if`, `:class`, and the label `{{ }}`)
 * only walks the AST + runs the regex once per node. The cache is a
 * WeakMap keyed by the AST node object itself; nodes are stable refs
 * from uniorg-parse, and the WeakMap GC's its entries when an AST is
 * dropped on the next context selection.
 */
const ALERT_TYPE_CACHE = new WeakMap();

function detectAlertType(quote_node) {
  if (ALERT_TYPE_CACHE.has(quote_node)) {
    return ALERT_TYPE_CACHE.get(quote_node);
  }
  const text = firstAlertText(quote_node);
  let result = null;
  if (typeof text === 'string') {
    const match = ALERT_PREFIX_RE.exec(text);
    if (match) {
      const candidate = match[1].toUpperCase();
      if (ALERT_TYPES.includes(candidate)) {
        result = candidate;
      }
    }
  }
  ALERT_TYPE_CACHE.set(quote_node, result);
  return result;
}

/*
 * Returns the alert body — quote-block children with the leading
 * `[!TYPE]` prefix stripped from the first text leaf. The original AST
 * is not mutated; nodes are shallow-cloned along the path from the
 * quote-block root down to the affected text leaf.
 */
function alertBody(quote_node) {
  if (!Array.isArray(quote_node.children)) {
    return [];
  }
  const out = [];
  let stripped = false;
  for (const child of quote_node.children) {
    if (stripped) {
      out.push(child);
      continue;
    }
    if (child.type === 'paragraph' && Array.isArray(child.children)) {
      const cleaned_children = stripPrefixFromChildren(child.children);
      if (cleaned_children.length > 0) {
        out.push({ ...child, children: cleaned_children });
      }
      stripped = true;
      continue;
    }
    if (child.type === 'text') {
      const cleaned_value = child.value.replace(ALERT_PREFIX_RE, '');
      if (cleaned_value) {
        out.push({ ...child, value: cleaned_value });
      }
      stripped = true;
      continue;
    }
    out.push(child);
    stripped = true;
  }
  return out;
}

function stripPrefixFromChildren(children) {
  const out = [];
  let stripped = false;
  for (const node of children) {
    if (stripped) {
      out.push(node);
      continue;
    }
    if (node.type === 'text') {
      const cleaned = node.value.replace(ALERT_PREFIX_RE, '');
      if (cleaned) {
        out.push({ ...node, value: cleaned });
      }
      stripped = true;
      continue;
    }
    out.push(node);
    stripped = true;
  }
  return out;
}

function srcKey(node) {
  return `${node.language || 'plain'}::${node.value}`;
}

/*
 * Split a Shiki token's content into alternating whitespace / non-
 * whitespace runs so the template can render each whitespace run as a
 * <span class="org-src-block__ws"> with a 2px-square marker per 1ch
 * column. Non-whitespace runs render with the token's syntax color.
 */
function splitWhitespaceSegments(content) {
  if (typeof content !== 'string' || content.length === 0) {
    return [];
  }
  const segments = [];
  let i = 0;
  while (i < content.length) {
    const start_is_ws = content[i] === ' ' || content[i] === '\t';
    let j = i + 1;
    while (j < content.length) {
      const char_is_ws = content[j] === ' ' || content[j] === '\t';
      if (char_is_ws !== start_is_ws) {
        break;
      }
      j++;
    }
    segments.push({
      text: content.slice(i, j),
      is_ws: start_is_ws,
    });
    i = j;
  }
  return segments;
}

function collectSrcBlocks(nodes, sink) {
  for (const node of nodes) {
    if (node.type === 'src-block' && typeof node.value === 'string') {
      sink.push(node);
    }
    if (Array.isArray(node.children) && node.children.length) {
      collectSrcBlocks(node.children, sink);
    }
  }
}

async function tokenizeAst(nodes) {
  const blocks = [];
  collectSrcBlocks(nodes, blocks);
  for (const node of blocks) {
    const key = srcKey(node);
    if (tokenized.value.has(key)) {
      continue;
    }
    const tokens = await highlightCode(node.value, node.language);
    if (tokens) {
      const next = new Map(tokenized.value);
      next.set(key, tokens);
      tokenized.value = next;
    }
  }
}

watch(
  () => props.ast,
  (next_ast) => {
    if (Array.isArray(next_ast) && next_ast.length) {
      tokenizeAst(next_ast);
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
@use "@app/scss/abstracts/mixins" as *;

.org-content {
  display: flex;
  flex-direction: column;
  gap: 0.85em;
  font-family: var(--font-mono);
  font-size: var(--fs-325);
  line-height: 1.35;
  /* `color` deliberately omitted — base text color is set on the
   * sidebar body so the recursive `.org-content` nested inside an
   * `.org-headline` (which sets `color: --clr-neutral-100`) inherits
   * the headline's chosen tone instead of clobbering it back to
   * the body's neutral-200. */
  contain: layout paint;
}

/* Headlines — Geomanist with a 3-dot gold accent stacked left of every
 * level (single 3px gold square + two box-shadow clones at ±6px). Text
 * is neutral-100 (the sidebar's chosen title shade); the dot stack is
 * the small 10% gold accent that marks every headline. The lower-third
 * strip title is set to the same neutral-100 so both compositions
 * share the same title tone. */
.org-headline {
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--clr-neutral-100);
  line-height: 1.1;
  margin-top: 0.2em;
  margin-bottom: 0;
  border-radius: 0;
  position: relative;
  padding-left: 0.5em;
}

/* Three vertically-stacked 3px gold squares mark the headline. Single
 * 3px square + two box-shadow clones at ±6px so the gap between
 * squares matches the square size. Stack centered against the first
 * line of the headline via `top: 0.5em` + `translateY(-50%)` so it
 * adapts as the headline font size scales across h1–h4. */
.org-headline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5em;
  width: 3px;
  height: 3px;
  background-color: var(--clr-primary-100);
  box-shadow:
    0 -6px 0 var(--clr-primary-100),
    0 6px 0 var(--clr-primary-100);
  transform: translateY(60%);
}

.org-headline--h1 { font-size: var(--fs-525); }
.org-headline--h2 { font-size: var(--fs-450); }
.org-headline--h3 { font-size: var(--fs-400); }
.org-headline--h4 { font-size: var(--fs-350); }

.org-paragraph {
  margin: 0;
}

/* Inline marks — kept as default `display: inline` so they flow with
 * surrounding text and never expand to full width. The wrapping fix
 * (preventing block-level break-out from the recursive UiOrgContent
 * `<div class="org-content">`) is handled below in the
 * `display: contents` rule for nested .org-content. */
.org-bold {
  font-weight: 700;
  /* Lighter than the surrounding `.org-content` text (neutral-200) to
   * draw attention without using the gold brand color. */
  color: var(--clr-neutral-100);
}

.org-italic {
  font-style: italic;
  color: var(--clr-neutral-200);
}

.org-verbatim,
.org-inline-code {
  /* `width: fit-content` is a defensive safeguard: even if any ancestor
   * accidentally lays this out as a flex/grid item, the element still
   * sizes to its actual text instead of stretching to a full row. */
  width: fit-content;
  font-family: var(--font-mono);
  font-size: 0.9em;
  line-height: 1.5em;
  /* Dark-neutral pill — solid neutral-400 surface (hsl(0,0%,25%)) with
   * off-white text. Stays in the dark side of the palette (no white
   * surface) while still reading distinctly against the surrounding
   * neutral-200 body text and the black sidebar. */
  background: var(--clr-neutral-400);
  color: var(--clr-neutral-100);
  padding: 0.05em 0.4em;
  border-radius: 0;
}

/*
 * Every `<UiOrgContent>` invocation wraps its children in a
 * `<div class="org-content">` whose default layout is `display: flex;
 * flex-direction: column`. That column stacks children vertically —
 * which is what we want at the TOP level (paragraphs, headlines, lists
 * spaced apart in the sidebar body) but is exactly what we DON'T want
 * for any recursive nested invocation, because every text leaf,
 * verbatim, bold, etc. inside a paragraph would otherwise become its
 * own row in a flex column. That's the root cause of "lines jumping".
 *
 * Rule: any `.org-content` nested inside another `.org-content`
 * (regardless of depth — paragraph, bold, list-item, link, anything)
 * dissolves to `display: contents`. Its box vanishes from layout and
 * its children participate in the OUTER context — which is the inline
 * flow of the actual semantic element (paragraph, strong, em, etc.).
 *
 * Only the single top-level `.org-content` (direct child of the
 * sidebar body) keeps the flex-column layout that drives vertical
 * spacing between top-level org elements.
 */
.org-content .org-content {
  display: contents;
}

.org-strike {
  text-decoration: line-through;
  opacity: 0.55;
}

/* Lists */
.org-list {
  margin: 0;
  padding-left: 1.4em;
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  list-style: none;
}

/* Every non-ordered list-item gets a graphic marker — checkbox states
 * own their own glyph (▢▣▨); everything else (unordered + descriptive +
 * un-classed) renders a chevron. Ordered lists keep the browser's
 * decimal marker via list-style.
 *
 * `align-self: center` + `translateY(0.05em)` mirrors the `.org-checkbox`
 * treatment: the list-item is a flex container with
 * `align-items: baseline`, so the marker would otherwise sit on the
 * text baseline and read as floating above the line. Centering it
 * cross-axis and nudging down 0.05em lands it on the text x-height. */
.org-list:not(.org-list--ordered) .org-list-item:not(.org-list-item--done):not(
    .org-list-item--partial):not(.org-list-item--todo)::before {
  content: '\276F';
  color: var(--clr-primary-100);
  margin-right: 0.3em;
  font-weight: 700;
  display: inline-block;
  align-self: center;
  transform: translateY(0.05em);
}

.org-list--ordered {
  list-style: decimal;
  padding-left: 1.6em;
  color: var(--clr-primary-100);
}

.org-list--ordered .org-list-item {
  color: var(--clr-neutral-100);
}

.org-list-item {
  border-radius: 0;
  padding-left: 0.1em;
}

/* Non-ordered list-items (unordered + descriptive) use flex baseline so
 * the chevron/checkbox + the paragraph child sit on the same line.
 * Ordered lists keep default block flow so the browser's
 * `list-style: decimal` numbering renders. */
.org-list:not(.org-list--ordered) .org-list-item {
  display: flex;
  align-items: baseline;
  gap: 0.45em;
}

.org-list:not(.org-list--ordered) .org-list-item > .org-paragraph {
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
}

.org-list--ordered .org-list-item > .org-paragraph {
  margin: 0;
  display: inline;
}

/* Checkboxes — distinct color per state */
.org-list-item--done .org-checkbox { color: var(--clr-success-100); }
.org-list-item--partial .org-checkbox { color: var(--clr-warning-100); }
.org-list-item--todo .org-checkbox { color: var(--clr-neutral-100); }

.org-list-item--done {
  color: color-mix(in srgb, var(--clr-neutral-100) 65%, transparent);
}

.org-checkbox {
  display: inline-block;
  margin-right: 0.25em;
  font-family: var(--font-mono);
  font-size: 1.3em;
  line-height: 1;
  /* The list-item is a flex container with `align-items: baseline`, so
   * `vertical-align` is ignored on this flex child. Override the
   * cross-axis alignment for the checkbox specifically (centered
   * instead of baseline-aligned), then nudge it down a hair with a
   * transform so the glyph reads centered on the text x-height rather
   * than floating above it. */
  align-self: center;
  transform: translateY(0.05em);
}

/* Tables — bordered, header-row distinct, alternate rows subtle */
.org-table {
  border-collapse: collapse;
  /* `table-layout: fixed` distributes column widths equally regardless
   * of cell content, so a 6-column table inside the narrow sidebar
   * gets six even columns instead of one wide column auto-sized to its
   * longest cell that pushes the rest out of view. Combined with
   * `word-break` on cells, content wraps inside narrow columns instead
   * of overflowing the sidebar's `overflow-x: hidden` boundary. */
  table-layout: fixed;
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--fs-225);
  /* Neutral frame — the table belongs to the 30% support tier, not
   * the 10% gold accent tier. */
  border: 1px solid var(--clr-neutral-300);
  border-radius: 0;
  margin: 0.3em 0;
}

.org-table__row {
  border-top: 1px solid var(--clr-border-200);
}

.org-table__row:first-child {
  /* Header row — neutral tint instead of gold-10. The header reads as
   * structure (30% tier), not accent. */
  background: var(--clr-neutral-50-04);
  border-top: none;
}

.org-table__row:first-child .org-table__cell {
  color: var(--clr-neutral-100);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.org-table__row:nth-child(odd):not(:first-child) {
  background: var(--clr-neutral-50-04);
}

.org-table__cell {
  padding: 0.45em 0.85em;
  border-right: 1px solid var(--clr-border-200);
  vertical-align: top;
  /* Allow content to wrap inside narrow fixed-width columns. Verbatim
   * tokens like `=very_long_identifier=` would otherwise force a
   * column wider than the sidebar and clip the rest. */
  word-break: break-word;
  overflow-wrap: anywhere;
}

.org-table__cell:last-child {
  border-right: none;
}

/* Code blocks — same surface aesthetic as the rest of the HUD: low-alpha
 * tint background + 1px solid border in the matching saturated color.
 * Src blocks use neutral; output blocks use primary (gold). Tokens only,
 * no inline rgba/hsl literals. No corner decoration — the plain border
 * carries the surface; the absolute-positioned lang/OUTPUT label is the
 * only chrome. Top padding clears the label so code never overlaps it.
 * Long code lines wrap (`pre-wrap`) because the sidebar is narrow and
 * horizontal scrolling would be clipped by the parent body's
 * `overflow-x: hidden`. */
.org-src-block,
.org-results,
.org-example {
  position: relative;
  font-family: var(--font-mono);
  font-size: var(--fs-200);
  line-height: 1.35;
  padding: 2.5em 1.1em 0.85em;
  margin: 0.3em 0;
  border-radius: 0;
  border: 1px solid;
  contain: layout paint;
}

.org-src-block {
  --ws-marker: var(--clr-neutral-400);
  background-color: var(--clr-neutral-50-04);
  border-color: var(--clr-neutral-300);
  color: var(--clr-neutral-100);
  /* Code surfaces feel tighter at the bottom — output blocks keep the
   * default to leave room for the gold OUTPUT framing. */
  padding-bottom: 0.4em;
}

.org-results {
  --ws-marker: var(--clr-primary-400);
  background-color: var(--clr-primary-100-06);
  border-color: var(--clr-primary-100);
  color: var(--clr-primary-100);
  font-weight: 500;
}

.org-example {
  --ws-marker: var(--clr-neutral-400);
  background-color: var(--clr-neutral-50-02);
  border-color: var(--clr-neutral-400);
  color: var(--clr-neutral-200);
  padding-bottom: 0.4em;
}

/*
 * Whitespace markers — paint a 3px-wide colored stripe at the center of
 * each 1ch-wide column via repeating linear-gradient. The gradient is
 * 1ch tall (height-tile) with the colored band centered horizontally;
 * the result is a visible 3px square per character, helpful for tab /
 * indent visibility. Color = --ws-marker (set per-block above).
 */
.org-src-block__ws {
  position: relative;
  display: inline-block;
  background-image: linear-gradient(
    to right,
    transparent calc((1ch - 3px) / 2),
    var(--ws-marker, currentColor) calc((1ch - 3px) / 2),
    var(--ws-marker, currentColor) calc((1ch + 3px) / 2),
    transparent calc((1ch + 3px) / 2)
  );
  background-size: 1ch 3px;
  background-position: 0 50%;
  background-repeat: repeat-x;
}

.org-src-block__lang,
.org-results__label {
  position: absolute;
  top: 0.7em;
  right: 0.55em;
  font-family: var(--font-mono);
  font-size: var(--fs-125);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 0.05em 0.45em;
  border-radius: 0;
}

.org-src-block__lang {
  color: var(--clr-primary-100);
  background: var(--clr-primary-100-14);
  border: 1px solid var(--clr-primary-100);
}

.org-results__label {
  /* Border + text use `--clr-neutral-300` — the same border color the
   * src-block code blocks ship with — so OUTPUT visually rhymes with
   * the surrounding code block frames instead of standing alone. */
  color: var(--clr-neutral-300);
  background-color: lighten(--clr-neutral-500, 8%);
  border: 1px solid var(--clr-neutral-300);
}

.org-src-block__code,
.org-results__code {
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/*
 * GitHub-flavored alerts. Each variant pairs a saturated palette family
 * with a faint 6% color-mix surface tint so the alert reads as a typed
 * callout (10% accent on the border + glyph) without flooding the
 * sidebar with a saturated panel (60-30-10 discipline).
 *
 * NOTE      → secondary (blue)
 * TIP       → success   (green)
 * IMPORTANT → tertiary  (purple — added to the palette for this)
 * WARNING   → warning   (orange)
 * CAUTION   → error     (red)
 */
.org-alert {
  margin: 0.4em 0;
  /* Only the LEFT edge gets a border — the other three sides stay
   * borderless. Per-type rules below set `border-color` (4-side
   * shorthand), but since only the left has a `solid` style, only the
   * left edge renders. */
  border-left: 1px solid;
  padding: 0.6em 0.9em;
  border-radius: 0;
  /* Body voice = display font (Geomanist) so callouts read as
   * narrative text, not as code. Inline `<code>` / verbatim spans
   * still flip back to `var(--font-mono)` via their own rules. */
  font-family: var(--font-display);
  font-size: var(--fs-225);
  /* Tighter line-height than the body's 1.35 — alerts read as a
   * compact narrative aside, not paragraph-height prose. */
  line-height: 1.2;
}

/* Alert header — same display font + tracking as `.org-headline` so
 * the section titles in the body and the alert callout titles read as
 * the same typographic system. */
.org-alert__header {
  display: flex;
  align-items: center;
  gap: 0.45em;
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: var(--fs-200);
  line-height: 1;
  margin-bottom: 0.3em;
}

.org-alert__icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
}

/* Italic body — both the alerts and the plain blockquote share this
 * voice so the callout reads as a stylized aside. */
.org-alert__body {
  color: var(--clr-neutral-200);
  font-style: italic;
}

/* All descendants inside an alert use the display font (Geomanist).
 *
 * Critical override: `.org-alert .org-content` MUST be in this list.
 * The recursive UiOrgContent always wraps its children in
 * `<div class="org-content">` whose own rule sets
 * `font-family: var(--font-mono)`, and even though nested .org-content
 * uses `display: contents` (no layout box), the element still exists
 * in the DOM and its font-family cascades to descendants. So without
 * the .org-content override the entire alert body inherits mono no
 * matter how many sibling-class overrides we add.
 *
 * Universal `*` is added with the `:where()` selector for any
 * descendant tag whose ancestor isn't already covered above —
 * `:where(*)` keeps specificity 0,2,0 the same as the explicit list
 * but acts as a final catch. */
.org-alert .org-content,
.org-alert .org-verbatim,
.org-alert .org-inline-code,
.org-alert .org-table,
.org-alert .org-src-block,
.org-alert .org-results,
.org-alert .org-example,
.org-alert .org-src-block__lang,
.org-alert .org-results__label,
.org-alert :where(*) {
  font-family: var(--font-display);
}

/* Per-type accent: header (icon + label) AND border use the saturated
 * 100-shade of the family — that's the "main color" of the alert.
 * Surface stays at a faint 6% color-mix so the callout doesn't pool
 * saturated color (60-30-10 discipline). */
.org-alert--note {
  border-color: var(--clr-secondary-100);
  background-color: color-mix(in srgb, var(--clr-secondary-100) 6%, transparent);
}
.org-alert--note .org-alert__header { color: var(--clr-secondary-100); }

.org-alert--tip {
  border-color: var(--clr-success-100);
  background-color: color-mix(in srgb, var(--clr-success-100) 6%, transparent);
}
.org-alert--tip .org-alert__header { color: var(--clr-success-100); }

.org-alert--important {
  border-color: var(--clr-tertiary-100);
  background-color: color-mix(in srgb, var(--clr-tertiary-100) 6%, transparent);
}
.org-alert--important .org-alert__header { color: var(--clr-tertiary-100); }

.org-alert--warning {
  border-color: var(--clr-warning-100);
  background-color: color-mix(in srgb, var(--clr-warning-100) 6%, transparent);
}
.org-alert--warning .org-alert__header { color: var(--clr-warning-100); }

.org-alert--caution {
  border-color: var(--clr-error-100);
  background-color: color-mix(in srgb, var(--clr-error-100) 6%, transparent);
}
.org-alert--caution .org-alert__header { color: var(--clr-error-100); }

/* Plain quote — same border-left-only treatment as `.org-alert` but
 * with the neutral border-100 (faint white) for the bar instead of a
 * typed brand color, since the quote is unlabelled. Faint surface
 * tint + italic text + display title shape kept consistent with the
 * alerts so the family reads as one system. */
.org-quote {
  margin: 0.4em 0;
  padding: 0.6em 0.9em;
  border-left: 1px solid var(--clr-border-100);
  border-radius: 0;
  background-color: var(--clr-neutral-50-02);
  font-family: var(--font-mono);
  font-size: var(--fs-225);
  font-style: italic;
  color: var(--clr-neutral-200);
}

/* Links */
.org-link {
  color: var(--clr-primary-100);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--clr-primary-100-40);
}

.org-link:hover {
  text-decoration-color: var(--clr-primary-100);
}

.org-link--internal {
  color: var(--clr-neutral-100);
  text-decoration: none;
}

/* Horizontal rule */
.org-hr {
  border: none;
  border-top: 1px solid var(--clr-border-200);
  margin: 0.8em 0;
}
</style>
