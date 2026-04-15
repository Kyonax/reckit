<!--
  ─────────────────────────────────────────────────────────────
   RECKIT Pull Request Template
  ─────────────────────────────────────────────────────────────
   13 rules this template enforces — do not break them:

   1. NEVER mention gitignored / private files (session notes,
      COMMIT.org, PR.org, .rc.gpg, .env, BRANCHES.org).
   2. NO REDUNDANCY — each fact appears in exactly one section.
      Do not restate the Changes list inside Summary, Technical
      Details, Testing, or Deployment.
   3. CHANGES LIST FORMAT — every entry is:
         **[TAG]** `path` — one-line description
      Closed tag vocabulary: [NEW] / [MOD] / [DEL] / [MOV].
   4. CHANGES SUBSECTIONS — organize changes into 5 fixed
      themed subsections, in this order, omit if empty:
         Implementation, Release, CI & Tooling,
         Dependencies, Docs.
   5. PER-SUBSECTION INNER FORMAT — each subsection has its own
      inner layout (see the comment inside each one below).
      Implementation MUST open with the tag legend blockquote
      so reviewers learn what [NEW]/[MOD]/[DEL]/[MOV] mean
      without leaving the PR.
   6. TECHNICAL DETAILS — one bullet per decision with the
      4 required sub-fields: Chose / Over / Why / Trade-off.
   7. HOW TO TEST — optional flow tree at top (ASCII box-draw)
      + one ### group per area with a prereqs line + a
      NUMBERED LIST of steps (never checkboxes). Each step
      is followed by a 6-space-indented ***Expected:*** line
      (bold-italic) with an observable, specific outcome.
   8. SPECIAL DEPLOYMENT — NUMBERED LIST (never checkboxes)
      with closed severity vocabulary:
         CRITICAL, REQUIRED, OPTIONAL.
      Delete the section entirely if nothing to list.
   9. DOCUMENTATION — subsection heading is always
         ### <MEDIA-TYPE> — <Target>
      with closed vocab:
         DESKTOP, TABLET, MOBILE, VIDEO, DIAGRAM, SCREENSHOT.
      One italic 1-line context blurb under each heading.
   10. NO ARROW CHARACTERS anywhere in the body
       (no →, ⇒, =>, ➜). Use italic labels, em dashes (—),
       or line breaks instead. The only allowed "arrow-like"
       glyphs are the ASCII box-drawing characters inside
       the optional How-to-test flow tree.
   11. CHECKBOXES are only allowed in the top `## Checklist`
       block (author self-review). Every other section uses
       numbered lists or nested bullets.
   12. INLINE COLON-LABELS are always BOLD+ITALIC
       (triple asterisk on each side): ***Expected:***,
       ***Chose:***, ***Over:***, ***Why:***, ***Trade-off:***.
       Group headers that stand above their subordinate labels
       stay bold-only (e.g. **Prereqs:**, **Version:**).
   13. TESTING COVERAGE is a two-table section:
       #### Automated tests (| Test file | Covers | Tests |
       Status |) + #### Quality gates (| Gate | Source |
       Status |). Metadata above: **Test runner:** and
       **Command:**. If no suite exists, the Automated-tests
       table becomes one "none yet" paragraph, but the
       Quality-gates table is always populated with every
       gate that exists in the repo (Lint, Build, Security
       Scan, License Headers).

   Links in a PR body must be absolute URLs
   (https://github.com/Kyonax/reckit/blob/master/...) —
   relative paths 404 when GitHub renders the description.

   Delete any section that does not apply to this PR. Keep the
   checklist at the top — reviewers scan for it first.
  ─────────────────────────────────────────────────────────────
-->

## Checklist (check if it applies)

- [ ] Contains testing instructions
- [ ] Requires environment / credential changes
- [ ] Requires special deployment steps
- [ ] Has unit / integration tests
- [ ] Touches licensing, security, or CI
- [ ] License headers on new files ([LICENSING.org](https://github.com/Kyonax/reckit/blob/master/LICENSING.org))
- [ ] Attribution preserved on modified files
- [ ] Lint passes (`npm run lint`)
- [ ] Security rules followed ([SECURITY.org](https://github.com/Kyonax/reckit/blob/master/.github/SECURITY.org))
- [ ] No credentials committed
- [ ] All GitHub Checks have passed (no `Pre-Check Failed` label applied by CI)
- [ ] CHANGELOG.org updated *(release PRs only)*
- [ ] Version bumped *(release PRs only)*

## What does this PR do?

<!--
  One paragraph summary (functional, not structural) + user
  story + design link. Keep tight — details belong in the
  Changes subsections below, not restated here.
-->

> As a <role>, I want <outcome>, so that <benefit>.

**Design / Reference:** <link, or "N/A">

### Implementation

<!--
  Scope: everything under `src/`.
  MANDATORY: keep the tag legend below verbatim — it is the
  glossary for the whole Changes block (Implementation,
  Release, CI & Tooling, Docs all use the same tags). Do not
  repeat the legend in other subsections.

  Inner format (after the legend):
    - Flat list if ≤ 5 entries.
    - When ≥ 3 entries share a subsystem, group them under a
      bold inline label followed by the folder in backticks:
        **Widgets** (`src/shared/widgets/`)
        - **[NEW]** `audio-meter.vue` — …
    - Order within groups: [NEW] before [MOD] before [DEL]
      before [MOV], then alphabetical.
    - Nested sub-bullets for specific behaviors or decisions.
-->

> **[NEW]** new file · **[MOD]** modified file · **[DEL]** removed · **[MOV]** renamed or relocated

- **[NEW]** `<path>` — description
  - optional sub-bullet

### Release

<!--
  Scope: version bumps only (package.json "version",
  README.org version strings, CHANGELOG.org entry).
  Inner format: bold version header + exactly 3 Changes
  entries (the canonical release triad). If any of the three
  is missing, this is not a release PR — delete this section.
-->

**Version:** v<NEW> (was v<OLD>)

- **[MOD]** `package.json` — `"version"` bump
- **[MOD]** `README.org` — `#+VERSION:`, ASCII logo footer, shields.io badge → `v<NEW>`
- **[MOD]** `CHANGELOG.org` — new `[v<NEW>]` entry; TODO pruned

### CI & Tooling

<!--
  Scope: .github/workflows/*, eslint.config.mjs,
  vite.config.js, .gitignore, .env.example.
  Inner format: flat Changes list. For workflow files with
  multiple job fixes, add nested sub-bullets prefixed with
  **<Job name>:**.
-->

- **[MOD]** `<path>` — <one-line summary>
  - **<Job name>:** <fix>

### Dependencies

<!--
  Scope: package.json deps + package-lock.json.
  Inner format: exactly 4 bullets, always present, use `—`
  for empty values. Optional Lockfile line after.
-->

- **Runtime added:** —
- **Dev added:** —
- **Upgraded:** —
- **Removed:** —
- **Lockfile:** <status, if changed>

### Docs

<!--
  Scope: README.org prose (NOT version strings — those go in
  Release), LICENSING.org, NOTICE, .github/CODEOWNERS,
  .github/SECURITY.org, .github/PULL_REQUEST_TEMPLATE.md.
  Inner format: flat Changes list. Short, one line each.
-->

- **[MOD]** `<path>` — description

### Technical Details

<!--
  One bullet per decision. Each has exactly 4 sub-fields:
    *Chose:*     what we decided
    *Over:*      the alternative we rejected
    *Why:*       the rationale
    *Trade-off:* the cost we accept
  Use "—" for any field that is genuinely N/A; never drop it.
  Order decisions by impact: user-visible architecture first,
  internal tooling next, small optimizations last.
-->

- **<Decision title>**
  - ***Chose:*** <what we decided>
  - ***Over:*** <alternative rejected>
  - ***Why:*** <rationale>
  - ***Trade-off:*** <cost accepted>

### Testing Coverage

<!--
  Two-part format that handles both states: "we have a test
  suite" and "we do not yet have one". Never hide a passing
  quality gate, never invent a test that does not exist.

  Part 1 — metadata:
    **Test runner:** <framework @ version, or "not yet configured">
    **Command:**    <`npm run test`, or "—">

  Part 2 — #### Automated tests:
    If tests exist: 4-col table
      | Test file | Covers | Tests | Status |
      plus a bold **Total:** summary line.
    If none exist: one paragraph stating so + the follow-up
    tracker link.

  Part 3 — #### Quality gates (run on every PR):
    | Gate | Source | Status |
    Always include Lint, Build, Security scan, License headers
    when they exist. Status uses ✅ / ❌ / ⚠️ + short note.

  Omit this entire section only for PRs that touch nothing
  but docs.
-->

**Test runner:** <framework @ version, or "not yet configured">
**Command:** <`npm run test`, or "—">

#### Automated tests

| Test file | Covers | Tests | Status |
|-----------|--------|-------|--------|
| `<path>.test.js` | <short coverage phrase> | <N> | ✅ |

**Total:** <N> tests across <M> files, all passing.

#### Quality gates (run on every PR)

| Gate | Source | Status |
|------|--------|--------|
| Lint | `eslint.config.mjs` via `npm run lint` | ✅ 0 errors |
| Build | `vite.config.js` via `npm run build` | ✅ |
| Security scan | `.github/workflows/ci.yml` | ✅ |
| License headers | `.github/workflows/ci.yml` | ✅ |

## How to test this PR

<!--
  Optional ASCII flow tree at the top for PRs with ≥ 3 feature
  groups — characters: ├─ └─ │ ─. Keep it under 15 lines.
  Then one ### group per testable area, each with:
    - > **Prereqs:** <one-line list, or "none">
    - a NUMBERED LIST (never checkboxes) of steps.
  Each step's first line: action + optional em dash + command
  / URL in backticks. Next line, indented 6 spaces: the
  ***Expected:*** label in BOLD+ITALIC (triple asterisks each
  side) with an observable, specific outcome. No arrow
  characters anywhere.
-->

```
<PR title>
├─ Setup
├─ <Feature group A>
└─ <Feature group B>
```

### <Feature group name>

> **Prereqs:** <one-line list, or "none">

1. <action>
      ***Expected:*** <observable outcome>
2. <action> — `<command or url>`
      ***Expected:*** <outcome>

## Special Deployment Requirements

<!--
  Numbered list of ops preconditions. Never checkboxes.
  Each item: **<Topic> (<SEVERITY>)** — <requirement>
  Severity vocabulary (closed): CRITICAL, REQUIRED, OPTIONAL.
  Order: CRITICAL first, then REQUIRED, then OPTIONAL.
  Delete this entire section if the PR has no preconditions.
-->

1. **<Topic> (CRITICAL)** — <requirement>
2. **<Topic> (REQUIRED)** — <requirement>
3. **<Topic> (OPTIONAL)** — <requirement>

## Documentation

<!--
  One ### subsection per asset, using the fixed heading
  pattern:  ### <MEDIA-TYPE> — <Target>
  Closed media-type vocabulary:
    DESKTOP    — screenshot ≥ 1024px
    TABLET     — screenshot 560–1024px
    MOBILE     — screenshot ≤ 560px
    VIDEO      — screen recording
    DIAGRAM    — architecture / flow diagram
    SCREENSHOT — generic screenshot, no viewport implication
  Under each heading: one italic 1-line context blurb, then
  the asset (drag-and-drop into the PR editor).
  Order: group by target, then by tag:
    DESKTOP → TABLET → MOBILE → VIDEO → DIAGRAM.
-->

### DESKTOP — <Target>

> *<1-line context>*

<!-- ![desktop](https://github.com/user-attachments/...) -->

### MOBILE — <Target>

> *<1-line context>*

<!-- ![mobile](https://github.com/user-attachments/...) -->
