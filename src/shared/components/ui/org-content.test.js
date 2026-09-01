/**
 * Copyright (c) 2026 Cristian D. Moreno — @Kyonax
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. See LICENSE or https://mozilla.org/MPL/2.0/
 *
 * Tests for <UiOrgContent> — recursive AST renderer (Plan #context-
 * screen D10 + D11). Mounts the parsed body AST from a fixture
 * .org string and asserts each major node type produces the
 * expected DOM. No v-html, no innerHTML — verified by template
 * walk only.
 */

import { collectBodyNodes } from '@shared/utils/org.js';
import UiOrgContent from '@ui/org-content.vue';
import { mount } from '@vue/test-utils';
import { unified } from 'unified';
import uniorgParse from 'uniorg-parse';
import { describe, expect, it } from 'vitest';

const FIXTURE = `#+TITLE: Fixture
#+DESCRIPTION: Body fixture

* Headline One

A *bold* and /italic/ paragraph with =verbatim=.

** Headline Two

- plain item
- [ ] todo
- [X] done

A separating paragraph between lists.

1. ordered one
2. ordered two

| col | val |
|-----+-----|
| a   | 1   |

#+begin_src js
const x = 1;
#+end_src

#+RESULTS:
: 1

#+begin_quote
A quote
#+end_quote

[[https://example.com][a link]]

-----
`;

const EXPECTED_HEADLINE_COUNT = 2;
const EXPECTED_LIST_ITEMS = 4;
const EXPECTED_TABLE_CELLS = 2;

function buildBodyAst(raw_string) {
  const ast = unified().use(uniorgParse).parse(raw_string);
  return collectBodyNodes(ast);
}

function mountFixture() {
  return mount(UiOrgContent, {
    props: { ast: buildBodyAst(FIXTURE) },
  });
}

describe('<UiOrgContent>', () => {
  it('renders without throwing on the empty default', () => {
    const wrapper = mount(UiOrgContent);
    expect(wrapper.find('.org-content').exists()).toBe(true);
  });

  it('renders headlines as h2/h3 with org-headline classes', () => {
    const wrapper = mountFixture();
    const headlines = wrapper.findAll('.org-headline');
    expect(headlines.length).toBe(EXPECTED_HEADLINE_COUNT);
    expect(headlines[0].element.tagName).toBe('H2');
    expect(headlines[0].classes()).toContain('org-headline--h1');
    expect(headlines[1].element.tagName).toBe('H3');
    expect(headlines[1].classes()).toContain('org-headline--h2');
  });

  it('renders bold + italic + verbatim as semantic elements', () => {
    const wrapper = mountFixture();
    expect(wrapper.find('strong.org-bold').exists()).toBe(true);
    expect(wrapper.find('em.org-italic').exists()).toBe(true);
    expect(wrapper.find('code.org-verbatim').exists()).toBe(true);
  });

  it('renders unordered + ordered lists with checkbox items', () => {
    const wrapper = mountFixture();
    expect(wrapper.find('ul.org-list--unordered').exists()).toBe(true);
    expect(wrapper.find('ol.org-list--ordered').exists()).toBe(true);
    const items = wrapper.findAll('.org-list-item');
    expect(items.length).toBeGreaterThanOrEqual(EXPECTED_LIST_ITEMS);
    expect(wrapper.find('.org-list-item--todo').exists()).toBe(true);
    expect(wrapper.find('.org-list-item--done').exists()).toBe(true);
  });

  it('renders tables with cells', () => {
    const wrapper = mountFixture();
    expect(wrapper.find('table.org-table').exists()).toBe(true);
    const cells = wrapper.findAll('td.org-table__cell');
    expect(cells.length).toBeGreaterThanOrEqual(EXPECTED_TABLE_CELLS);
  });

  it('renders src-block as <pre><code> with lang label', () => {
    const wrapper = mountFixture();
    const src_block = wrapper.find('pre.org-src-block');
    expect(src_block.exists()).toBe(true);
    expect(src_block.find('code.org-src-block__code').exists()).toBe(true);
    expect(src_block.find('.org-src-block__lang').text()).toBe('js');
  });

  it('renders #+RESULTS: as a fixed-width block with OUTPUT label', () => {
    const wrapper = mountFixture();
    const results = wrapper.find('pre.org-results');
    expect(results.exists()).toBe(true);
    expect(results.find('.org-results__label').text()).toBe('OUTPUT');
  });

  it('renders quote-block as <blockquote.org-quote>', () => {
    const wrapper = mountFixture();
    expect(wrapper.find('blockquote.org-quote').exists()).toBe(true);
  });

  it('renders external link as <a> with target=_blank + rel=noopener', () => {
    const wrapper = mountFixture();
    const link = wrapper.find('a.org-link');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
  });

  it('renders horizontal rule as <hr.org-hr>', () => {
    const wrapper = mountFixture();
    expect(wrapper.find('hr.org-hr').exists()).toBe(true);
  });

  it('does not inject script tags through any node value', () => {
    const wrapper = mountFixture();
    expect(wrapper.html()).not.toContain('<script');
  });
});
