---
target: the design so far (browse page)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\easha\\Documents\\ru-subletting\\src\\app\\page.tsx"
target_fingerprint: "sha256:f1cc0b69fa19c7270fdaaa6902e3befc2efa5c682ff381fbd6809aee41a38620"
target_path: "C:\\Users\\easha\\Documents\\ru-subletting\\src\\app\\page.tsx"
timestamp: 2026-10-11T18-35-46Z
slug: src-app-page-tsx
---
# Critique: browse page (/)
Method: dual-agent (A: aba0bd4d63af82297, B: a2f41de29d604f9df)

## Heuristics (25/40, Acceptable)
1 Visibility 3: map shows taken listing the count omits.
2 Real world 3: "65%" unexplained; "Closest to campus" mixes campuses when Campus=Any.
3 Control 2: Clear all skips Campus; no URL state; cluster opens only first item.
4 Consistency 2: inert Search this area, zoom, mobile menu, nav links; Gym amenity missing from filters.
5 Error prevention 3: 2-week overlap counts as semester match.
6 Recognition 3: mobile chip row clipped, Room/More filters hidden.
7 Flexibility 2: no shareable state, no focus-to-pin sync, no saved-only view.
8 Aesthetic 3: 7-8 rows per card on mobile.
9 Error recovery 2: empty state does not name the emptying filter; card links 404.
10 Help 2: no explanation of fit bar/ruler, safety, contact.

## Specificity
Fit bar and commute ruler are product-specific but undersized (10-12px under a dominant photo); page skeleton is category-standard. Ruler encodes little (38% + 2.6%/min, walk and bus share a scale). Detector: CLI clean; overlay flagged skipped-heading (h1 to h3, real, minor) and overused-font Geist (false positive, deliberate brief choice).

## Priority issues
- P1 Thesis elements are fine print; photo dominates card. Fix: promote fit bar and ruler to 14px main row, hide ticks with Any dates, shorter mobile photo or side thumbnail, true minute-scale ruler, dashed for bus. (/impeccable layout, typeset)
- P1 Mobile map not a decision surface: pin tap returns to list, cluster opens first only, note covers $690 pin, inert search/zoom. Fix: bottom peek card, cluster list in peek, note into info button. (/impeccable adapt)
- P1 Keyboard focus near-invisible; hover sync mouse-only; map last in tab order. Fix: focus-within ring, sync on focus, skip link, results h2. (/impeccable harden)
- P2 Filters not in URL; Clear all skips Campus. Fix: search-param state, Campus as lens or included in clear, Newest default when Campus=Any. (/impeccable harden)
- P2 Dead controls on primary surface. Fix: hide/disable or label as preview. (/impeccable clarify)

## Personas
Casey: clipped chip row, toggle covers cards, pin tap ejects to list, 36px save target.
Jordan: unexplained Summer 2027 bar and 65%, no "what is this" near top, no safety/contact guidance, 8 places vs 9 pins.
Sam: underline-only focus, bare "65%", Taken announced late, inert buttons announced, no live region on count.

## Minor
Stale "Tints emerald" comment; Gym missing from filters; default saved l1 with no saved count; loading skeleton fakes filter bar; 11px low-contrast map labels; mobile Sort takes a row.

## Questions
Should the first screen ask "Which semester?" Is the photo worth 45% of the card? Is Campus a lens in the header rather than a chip?
