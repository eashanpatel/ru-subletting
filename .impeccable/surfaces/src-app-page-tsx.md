---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/browse"]
---

# Browse page (route /)

Mode: Operate. Audience: Rutgers students and others near Rutgers needing short-term housing; often first visit on a phone from a group-chat link, desktop equally important. Task: narrow listings to a shortlist by dates, budget, campus, then open one. Frontend only with demo data for now.

## Direction contract

THESIS: Timing and campus distance are drawn on every card, not written as fine print. Refuses the Zillow/Airbnb arrangement of a white photo grid with red price pins where every card looks the same and dates hide in text.

OWN-WORLD: Grey stone ground (not cream), lighter stone cards, graphite ink. Olive is the working color: primary actions, saved, active selection, date overlap. Brick is rationed to small attention signals: New tag and your-dates markers. Geist text, Geist Mono for prices, dates, minutes. 8px radius, hairline borders, near-zero shadow. Dark mode keeps roles on deep stone-charcoal.

STORY: A renter scans a column of cards and sees, without opening any, which places cover their semester and how far each is from their campus; they save a few and open one.

FIRST VIEWPORT: Desktop: 64px header (wordmark, nav, olive Post a sublet), filter row of native-select chips (Campus, When, Price, Room, More filters), results heading with count and sort, listing grid on the left (1-2 columns), sticky map at ~42% right with campus zones and cluster bubbles. Mobile: single column, horizontal filter row, floating List/Map toggle. Signature interactions: commute ruler (dimension line scaled by minutes), semester fit bar (listing span against chosen semester, overlap filled olive), card/pin hover sync.

FORM: User-pinned direction from the shape round (Stone + olive + brick; commute ruler, semester fit bar, campus zones). No concept roll this round; earlier seed 4153482d superseded by the user's request for a restrained, non-catalog style.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions
Exact address visibility; final contact method; landlord listing labels; permanent product name.
