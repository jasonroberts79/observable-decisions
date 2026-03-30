# Mobile UX Improvements

**Date:** 2026-03-30
**Scope:** Frontend only (`app/src/`)
**Breakpoint convention:** `sm` = 640px. All mobile styles apply below `sm`; all existing styles preserved at `sm` and above.

---

## Problem

The app has no mobile layout. `AppLayout` hardcodes `ml-56` on the main content area and `Nav` is a `fixed w-56` sidebar with no responsive breakpoints. On a 375px phone, content is squeezed into ~151px. Several interactive elements are also below the 44px touch target minimum.

---

## Section 1 — Layout & Navigation

### AppLayout (`app/src/layouts/AppLayout.tsx`)

- Remove `ml-56` on mobile; keep it at `sm:ml-56`
- The sidebar `<Nav>` is hidden on mobile via `hidden sm:flex` (or equivalent)

### Nav (`app/src/components/nav.tsx`)

The component renders two different UIs depending on screen size:

**Mobile (below `sm`):** A compact top bar, `h-[44px]`, containing:
- App name ("Observable Decisions") on the left
- Inline nav links (Decisions, Settings) on the right
- No Sign Out button — moved to the Settings page on mobile to avoid crowding

**Desktop (`sm` and up):** Existing fixed sidebar, unchanged.

### Settings page (`app/src/pages/SettingsPage.tsx`)

- Add a Sign Out button at the bottom of the Settings page, visible only on mobile (`sm:hidden`)

---

## Section 2 — Decision List

### DecisionList (`app/src/components/decision-list.tsx`)

**Mobile card view (below `sm`):**
- Hide the `<table>` on mobile (`hidden sm:block`)
- Render a card list instead, visible only on mobile (`sm:hidden`)
- Each card shows: title (links to detail), status badge, date, deciders (if any), tags (up to 3)
- The entire card is the tap target — no tiny link to hit
- j/k keyboard nav hint hidden on mobile

**Search bar:** `py-1.5` → `py-3` on mobile for a 44px touch target

**Status filter pills:** Wrap in a `min-h-[44px]` row; individual pills get `py-2` on mobile

**FAB (Floating Action Button):**
- `position: fixed`, bottom-right, visible only on mobile (`sm:hidden`)
- Label: "+ New Decision", links to `/decisions/new`
- Replaces the header "New" button on mobile; that button is hidden via `hidden sm:flex`

### DecisionsPage (`app/src/pages/DecisionsPage.tsx`)

- Header "New" button: `hidden sm:flex` (FAB handles it on mobile)

---

## Section 3 — Decision Form

### DecisionForm (`app/src/components/decision-form.tsx`)

**Status + Date row (`line 98`):**
- `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`

**Form inputs (text, select, date, textarea):**
- `py-2` → `py-2 sm:py-2` with `py-3` added on mobile for 44px touch targets
- Concretely: change `py-2` to `py-3 sm:py-2` on all form field classes in `DecisionForm` (inputs, selects, textareas)

**Save/Cancel action row (`line 192`):**
- Wrap in a `sticky bottom-0 bg-white border-t border-zinc-100` container on mobile
- Applies to both New and Edit modes (same `DecisionForm` component)

---

## Section 4 — Decision Detail

### DecisionDetailPage (`app/src/pages/DecisionDetailPage.tsx`)

**Pros/Cons grid (`line 149`):**
- `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`

**Back + action bar (`line 37`):**
- Becomes `sticky top-0 bg-white border-b border-zinc-100 py-2` on mobile
- Keeps Back link, Share button, and Edit button always visible while reading

---

## Section 5 — Touch Targets

All changes scoped to mobile via `sm:` prefix. Desktop appearance unchanged.

| Element | Current approx. height | Mobile fix |
|---|---|---|
| Form inputs (text, select, date) | ~36px (`py-2`) | ~44px (`py-3`) |
| Search bar | ~30px (`py-1.5`) | ~44px (`py-3`) |
| Status filter pills | ~20px (`py-0.5`) | `py-2` + `min-h-[44px]` row |
| Tag input | ~28px (`py-1.5`) | ~40px (`py-2.5`) |
| Top bar nav links | — | 44px bar height covers tap area |

---

## Files Changed

| File | Change |
|---|---|
| `app/src/layouts/AppLayout.tsx` | Responsive `ml-56`, hide sidebar on mobile |
| `app/src/components/nav.tsx` | Top bar on mobile, sidebar on desktop |
| `app/src/pages/SettingsPage.tsx` | Add mobile-only Sign Out button |
| `app/src/components/decision-list.tsx` | Card view + FAB on mobile, touch targets |
| `app/src/pages/DecisionsPage.tsx` | Hide header "New" button on mobile |
| `app/src/components/decision-form.tsx` | Stack grid, sticky action bar, touch targets |
| `app/src/pages/DecisionDetailPage.tsx` | Stack pros/cons, sticky action bar |

---

## Out of Scope

- No changes to the backend or API
- No changes to desktop layout or appearance
- No new routes or pages (Settings page gets one addition, not a new page)
- No changes to authentication flow (SignInPage is already responsive)
