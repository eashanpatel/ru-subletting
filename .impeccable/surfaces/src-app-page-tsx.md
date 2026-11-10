---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/browse"]
---

# Browse page (route /)

Mode: Operate. Audience: Rutgers students and others near Rutgers needing short-term housing; often first visit on a phone from a group-chat link, desktop equally important. Task: narrow listings to a shortlist by dates, budget, campus, then open one.

## Direction contract

THESIS: Front Door. The page follows the rental-site convention people already know (filter chips, photo cards with a save heart, price pins on a map) and owns one idea: the price sits on a house-number plate, the same object on the card and on the map. Refuses the white page with a single green accent.

OWN-WORLD: Three colours. Navy is the shell, the ink, and the price plate. Door blue does the work: selection, focus, links, date overlap, form actions. Door red is rationed to the headline action (Post a sublet), saved hearts, the New tag, and your-dates markers. Pale porch-blue ground with white cards in light mode; deep navy ground with lifted navy cards and a pale plate in dark mode. Hanken Grotesk with tabular numerals, no monospace. Pill filter chips, 14px card corners, hairline borders, soft offset shadow only on the active card.

STORY: A renter scans photo cards, reads each price off its plate, sees from the fit bar which places cover their dates and from the commute line how far each is, saves a few with the heart, and opens one.

FIRST VIEWPORT: Desktop: 64px navy header (red RU tile wordmark, nav, theme toggle, red Post a sublet), filter row of pill chips on the porch ground (Campus, When, Price, Room, More filters), results heading with count and sort, two-column card grid on the left, sticky map at about 42% on the right with navy plate pins. Mobile: single column, horizontally scrolling chips, floating List/Map toggle. Signature: the price plate, shared by card and pin; the semester fit bar and commute line are kept from the previous design.

FORM: Assigned direction 4 of 7 (painted front doors and house-number plates), seed bba3a114. User steer after the round: reduce the four room-type door colours to a two or three colour theme, keep the semester overlap bar, and make the theme work in light and dark.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions
A header search pill (Near, When, Budget) as shown in the sketch; final contact method; landlord listing labels; permanent product name.
