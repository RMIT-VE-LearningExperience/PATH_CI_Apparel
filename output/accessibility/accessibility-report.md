# Accessibility audit report

Audit date: 7 September 2026
Target: local Next.js front end at `http://localhost:3000`, branch `Staging-Apparel`
Standard used: WCAG 2.2 Level AA

## Executive summary

Apparel shares its component architecture with Printer Workflows (same admin dashboard, step dialog, and public-guide patterns), and it inherits that app's core accessibility gaps — plus a few of its own. Automated public-page scores ranged from 95 to 100, but manual review found issues automated tooling missed entirely: **no page has a `<main>` landmark or skip link**, and **the document title never changes from the static "PATH CI Apparel"** on any route, including deep content pages.

The largest risk remains the authenticated admin UI: source review found the same mouse-only controls and unnamed icon buttons documented previously for Printer Workflows. These findings are source-verified only — no admin test credentials were available to exercise the UI in-browser.

One genuine improvement over the Printer Workflows baseline: Apparel's smooth-scroll step navigation already checks `prefers-reduced-motion` and skips the scroll animation when it's set. Color contrast is also clean throughout — the palette (`#45443F`/`#62615C` text on `#f2f2f2`/`#FFFFFF`) comfortably clears 4.5:1 everywhere checked, so no contrast finding is raised.

This is an engineering audit, not a formal third-party conformance certification.

## Scope and method

- Lighthouse accessibility audits on the homepage, a complete multi-step guide, login, and the not-found route.
- Playwright-driven browser inspection: accessibility tree queries (main landmarks, heading sequence, unlabeled buttons, tab wiring), document title per route, and mobile reflow at 320×568 CSS pixels.
- Source review of the public guide, login, not-found route, admin dashboard, sidebar, dialogs, images, and video handling — cross-checked against the prior Printer Workflows audit since the two apps share the same component patterns.
- `npm run lint` completed with no warnings or errors.

Not covered: authenticated end-to-end admin flows (no test credentials available), VoiceOver/NVDA/JAWS testing, browser zoom at 200%/400%, forced-colors/high-contrast mode, and cognitive usability testing with participants.

## Automated results

| View | Lighthouse accessibility score | Automated failures |
|---|---:|---|
| Homepage | 98 | Heading order |
| Complete step guide (Tote Bag) | 95 | Buttons do not have an accessible name (Back/Home nav icons) |
| Login | 100 | none |
| Not found | 100 | none |

Raw reports are stored beside this report as `lighthouse-home.json`, `lighthouse-steps.json`, `lighthouse-login.json`, and `lighthouse-notfound.json`.

The 100 scores for login and not-found are misleading on their own — Lighthouse's `landmark-one-main` check is informational in this version and doesn't fail on zero landmarks, and neither route's tab/heading semantics are checked by the automated ruleset. Manual review (below) found real issues on both.

## Findings

### A1 — High: Core admin interactions are not keyboard operable

WCAG: 2.1.1 Keyboard (Level A), 4.1.2 Name, Role, Value (Level A)

Evidence (source review, same pattern as Printer Workflows):

- No `TableSortLabel`/`aria-sort` usage found in `app/admin/AdminDashboard.tsx` — sortable headers, if present, are not exposed as sort controls.
- Row-level actions and disclosure sections follow the same generic-`Box`/`TableCell`-`onClick` pattern documented for Printer Workflows, with no keyboard handler or focusability.

Impact: keyboard, switch-control, and voice-input users cannot reliably operate these controls.

Fix: use native `button`/link elements for navigation and disclosure controls; add `aria-expanded`/`aria-controls` to disclosures; use MUI `TableSortLabel` with `aria-sort` for any sortable headers.

### A2 — High: Admin icon controls lack accessible names

WCAG: 4.1.2 Name, Role, Value (Level A), 2.4.6 Headings and Labels (Level AA)

Evidence (source review):

- Of the `IconButton` usages across `app/admin/AdminDashboard.tsx`, `app/admin/Sidebar.tsx`, and `app/admin/dialogs/*.tsx`, the large majority have no `aria-label` — including row menu/share buttons (`AdminDashboard.tsx:777-804`), the statistics icon button (`AdminDashboard.tsx:1522`), and upload/clear-image/crop controls in `AddEditStepDialog.tsx`.

Impact: screen-reader and voice-input users encounter unnamed "button" controls with no way to determine their purpose.

Fix: add explicit, contextual `aria-label`s (e.g. `` `More actions for ${item.name}` ``, `"Upload thumbnail"`, `"Remove step image"`). Keep tooltips as visual help, not the only label.

### A3 — High, conditional: Direct video has no caption or description track

WCAG: 1.2.2 Captions (Prerecorded), 1.2.5 Audio Description (Prerecorded)

Evidence: no `<track>` element exists anywhere in `app/`; direct MP4/WebM/Ogg rendering in both `app/components/PublicApp.tsx` and the admin preview renders only a bare `<source>`.

Impact: if an uploaded video contains speech or meaningful visual-only instruction, deaf/hard-of-hearing and blind/low-vision users miss essential content. Conditional because the audited guide content did not include a direct video.

Fix: require caption/audio-description assets in the content model before allowing publication of instructional video, and render `<track kind="captions">`.

### A4 — Medium: No `<main>` landmark or skip link anywhere in the app

WCAG: 1.3.1 Info and Relationships, 2.4.1 Bypass Blocks

Evidence: Playwright DOM inspection found zero `<main>`/`role="main"` elements and no skip link on **every** route checked — homepage, the level-2 item list, the full step guide, login, and not-found. `app/layout.tsx`'s `<body>` wraps everything in a plain `<div>` tree with no landmark region at all.

Impact: screen-reader users have no way to jump past repeated navigation into the actual content, on any page of the app. This is broader than the equivalent Printer Workflows finding, where the public guide views already had a main landmark and skip link and only the login/not-found utility routes lacked one.

Fix: wrap each view's primary content in `<main>` (e.g. `component="main"` on the relevant MUI `Box`/`Container`), and add a visible-on-focus skip link at the top of the page template.

### A5 — Medium: Heading hierarchy skips levels and pages are missing an `<h1>`

WCAG: 1.3.1 Info and Relationships, 2.4.6 Headings and Labels

Evidence (Playwright heading-sequence capture):

- Homepage: `H1 → H6` (the page's only `h1`, "Welcome", is followed immediately by card headings at `h6`).
- Level-2 item list (e.g. "Identify, Handle & Sew Materials"): no `h1` at all — three `h6` card headings only.
- Login: root heading is `h5` ("Admin Access"), no `h1`.
- Not-found: root heading is `h4` ("Page not found"), no `h1`.
- Step guide (Tote Bag): no page-level `h1`; step titles render at `h2` and content pasted from the source migration already contains `h3` sub-headings inside `contentHtml` (evidence of the embedded sub-step structure — see note below), giving a reasonable but page-`h1`-less sequence like `H2 → H2 → H3 → H2 → H3 → H3…`.

Impact: heading navigation gives screen-reader users a misleading or absent document outline.

Fix: give each view exactly one `h1` for its title, and keep card/step headings no more than one level below it. Style with MUI `variant` + `component` independently, as done elsewhere in the app.

Note for the separate Steps-layout work: the `h3` tags already appearing inside step `contentHtml` are the pasted-in sub-step headings (e.g. "2.1 Fold 6…", "3.1 Position and pin…") that the main/sub-step migration is meant to pull out into their own step records — useful confirmation that sub-steps are consistently marked with a heading in the source content.

### A6 — Medium: The image viewer is not exposed as a named dialog

WCAG: 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value, 1.1.1 Non-text Content

Evidence (source review, `app/components/PublicApp.tsx:1252-1281`): the enlarged-image view is an MUI `Modal` wrapping a generic `Box` — no `role="dialog"`, no `aria-modal`, no accessible name, and no visible Close button (closes only via Escape or backdrop click). The enlarged image always uses the hardcoded `alt="Step image"`, discarding whatever descriptive alt text the original image had. The zoom in/out `IconButton`s inside the modal also have no `aria-label`.

Fix: use `Dialog`/`DialogContent` or add `role="dialog"` + `aria-modal="true"` + an accessible name; add a visible Close button; label the zoom controls; store the original alt text alongside the selected image URL so it's retained when enlarged.

### A7 — Medium: Public back/home navigation buttons have no accessible name

WCAG: 4.1.2 Name, Role, Value (Level A)

Evidence: Lighthouse's `button-name` audit failed on the step-guide view; Playwright confirmed the two unlabeled buttons on both the level-2 item list and the step guide are the shared `NavIconButton` component (`app/components/PublicApp.tsx:120-135`), used for the Back (`ArrowBackIcon`) and Home (`HomeIcon`) actions — it accepts no `aria-label` prop and none of its six call sites supply one.

Impact: screen-reader and voice-input users encounter two unnamed "button" controls on every level-2-and-deeper view.

Fix: add an `ariaLabel` prop to `NavIconButton` and pass `"Back"` / `"Go to homepage"` at each call site.

### A8 — Medium: Login tabs are not programmatically connected to tab panels

WCAG: 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value

Evidence: Playwright confirmed both `role="tab"` elements in `app/login/page.tsx` have no `id` and no `aria-controls`, and there is no `role="tabpanel"` in the DOM at all.

Fix: give each tab an `id` and `aria-controls`; render each content section with `role="tabpanel"`, `id`, and `aria-labelledby`; label the tab list (e.g. "Admin access").

### A9 — Low: The document title never changes from the static default

WCAG: 2.4.2 Page Titled (Level A)

Evidence: `document.title` was checked on all five audited views (homepage, level-2 list, step guide, login, not-found) and returned the same static `"PATH CI Apparel"` from `app/layout.tsx` every time. No `document.title` assignment or route-level `generateMetadata` exists anywhere in `app/`.

Impact: screen-reader users navigating by browser tab/title, and anyone with multiple tabs open, get no indication of which page or guide they're on.

Fix: set a descriptive title per view — at minimum for login/not-found via route metadata, and ideally update it client-side as the SPA navigates between item levels and guides (e.g. "Tote Bag · PATH CI Apparel").

### A10 — Low: Step progress updates are visual-only

WCAG: 4.1.3 Status Messages

Evidence: the sticky "STEP x OF y" text (`app/components/PublicApp.tsx:1216`) updates as the intersection observer changes `activeStepIndex`, but it is not a live region.

Fix: expose the current step via a visually-hidden `role="status"`/`aria-live="polite"` region, debounced against scroll jitter (Printer Workflows' fix used an 800ms debounce as a reference point).

## Confirmed strengths

- `<html lang="en">` is set.
- Color contrast is clean throughout: body/caption text (`#45443F`, `#62615C`) against the light backgrounds in use (`#f2f2f2`, `#FFFFFF`) measures 5.5:1–8.7:1, well clear of the 4.5:1 minimum.
- Smooth-scroll step navigation already checks `window.matchMedia("(prefers-reduced-motion: reduce)")` and skips the scroll-behavior override when set — ahead of where Printer Workflows started.
- The guide reflows cleanly at 320px with no horizontal overflow on the homepage, item list, or step guide.
- `npm run lint` is clean.

## Remediation order

1. Add a `<main>` landmark and skip link to the shared page template (A4) — the single highest-leverage fix, since it's currently missing everywhere.
2. Name the two public `NavIconButton` instances (A7) — a two-line fix affecting every level-2-and-deeper view.
3. Fix heading hierarchy and add a page `h1` on each view (A5).
4. Rebuild the image viewer as a named dialog with a Close button, labeled zoom controls, and retained alt text (A6).
5. Add route-aware document titles (A9).
6. Complete login tab-panel semantics (A8).
7. Replace mouse-only admin controls and name every admin icon button (A1, A2).
8. Add a caption/transcript workflow before publishing direct video (A3).
9. Make step progress announce via a live region (A10).
10. Add regression coverage with axe/Lighthouse for public routes once the above land.

## Suggested acceptance criteria

- Every audited route has exactly one `<main>` landmark and a working skip link.
- Lighthouse accessibility score is 100 on all audited public routes with no failing axe rules, understanding that landmark/title/tab-semantics issues require manual verification alongside Lighthouse.
- Every interactive element has a unique, task-specific accessible name.
- The image viewer announces as a modal dialog, includes a visible close control, and retains the original alt text.
- The rendered heading outline has one `h1` per view and no skipped levels.
- The document title reflects the current view.
- Direct instructional video cannot be published without required captions and equivalent alternatives.

---

## Phase 4 re-audit — 9 September 2026 (public/front-end routes only)

Re-ran the same method (Lighthouse + Playwright DOM inspection) against the same four routes, on `Staging-Apparel` after the main/sub-step feature, the image-gallery pivot, all three products' content migrations, and this session's layout work landed. Admin routes (A1, A2) were not re-tested — still no admin credentials available in this environment; treat those two findings as unverified-but-presumed-unchanged. `npm run lint` still clean.

### Automated results — before / after

| View | Baseline score | Re-audit score | Change |
|---|---:|---:|---|
| Homepage | 98 | 98 | No change (heading-order still failing) |
| Complete step guide (Tote Bag) | 95 | **91** | **Worse** — new `frame-title` failure (see A12) |
| Login | 100 | 100 | No change |
| Not found | 100 | 100 | No change |

Raw reports: `lighthouse-*-reaudit.json` beside this file.

### Per-finding status

| Finding | Status | Notes |
|---|---|---|
| A1 — Admin keyboard operability | Not re-tested | No admin credentials in this environment |
| A2 — Admin icon control names | Not re-tested | No admin credentials in this environment |
| A3 — Video captions | **Open, now unconditional** | No `<track>` exists anywhere in `app/`, unchanged. Was flagged "conditional" because the originally-audited guide had no direct video in view; that's no longer true — real instructional videos are now a core, deliberately-organized part of every product's guide (Tote Bag, Sewing Kit, Japanese Apron all use the dedicated `videoUrl` field extensively). This finding should be treated as a live gap, not a hypothetical one. |
| A4 — No `<main>` landmark or skip link | **Unchanged** | Still zero `<main>`/`role="main"` elements and no skip link on any of the 5 routes checked. Still the single highest-leverage fix available. |
| A5 — Heading hierarchy / no page `h1` | **Partially improved** | The step guide's `h2`/`h3` structure is now genuine and structural (main step → `h2`, sub-step → `h3`, from the real component, not incidentally-pasted content headings as at baseline) — a side effect of the Day 5 main/sub-step work. The core issue remains open: no page ever has a true `h1`; on the step guide, the product title ("Tote Bag") and every main step title both render at `h2`, so the outline still doesn't distinguish "page title" from "section heading." Homepage, item list, login, and not-found are all unchanged from baseline. |
| A6 — Image viewer not a named dialog | **Unchanged, with one improvement** | Still `role="presentation"`, no `aria-modal`, hardcoded `alt="Step image"`, and the pre-existing zoom in/out buttons still have no `aria-label`. The new prev/next gallery-navigation buttons added this session (`aria-label="Previous image"`/`"Next image"`) *are* correctly labelled — worth keeping as the pattern to follow when this finding is eventually fixed properly. |
| A7 — Unlabeled Back/Home nav buttons | **Unchanged** | Confirmed still exactly 2 unlabeled buttons on the step guide via Playwright; same `NavIconButton` component, same fix as before. |
| A8 — Login tabs not connected | **Unchanged** | Tabs still have no `id`/`aria-controls`, no `role="tabpanel"` in the DOM. |
| A9 — Document title never changes | **Unchanged** | Checked all 5 routes again; `document.title` is still the static `"PATH CI Apparel"` everywhere. |
| A10 — Step progress visual-only | **Unchanged** | A `[role=status]` element was briefly observed during the initial Playwright pass — investigated directly and confirmed it's a transient MUI `CircularProgress` loading spinner (which carries a default ARIA role), not a step-progress live region. Re-checked after full load: no live region present. This finding stands exactly as at baseline. |
| **A12 — New, Low: Step-video iframes have no accessible title** | **New finding** | WCAG 2.4.1 Bypass Blocks / 4.1.2 Name, Role, Value. The iframe rendered for a step's own dedicated `videoUrl` field (`app/components/PublicApp.tsx`, the `embedUrl` block) has no `title` attribute — confirmed via Playwright: all 7 video iframes on the Tote Bag guide have `hasAttribute('title') === false`. This is a pre-existing gap in that rendering code, not something introduced this session, but it's now far more exposed: the Day 6–9 work deliberately reorganized many videos that used to sit as raw, Canvas-authored `<iframe title="...">` tags embedded in `contentHtml` (which *do* retain a title) into this dedicated field specifically because that's the correct data model — an accessibility regression as an unintended side effect of a genuine data-quality fix. This is the direct cause of the step guide's Lighthouse score dropping from 95 to 91. **Fix**: give the `embedUrl` iframe a `title` derived from the step's own title (e.g. `` `Video for step: ${step.title}` ``) — a small, contained fix. |

### What this means going forward

Nothing regressed from the *intended* Steps-layout work — A5's improvement is real, and the new A12 finding is a small, easy fix in one render block, not a sign the broader effort caused harm. But this confirms none of the larger baseline findings (A4 main landmark, A6 dialog semantics, A7 nav labels, A8 tab semantics, A9 titles, A10 live region) got fixed as side effects, and the video-caption finding (A3) is now clearly live rather than hypothetical. These are still open and would need their own scoped pass.
