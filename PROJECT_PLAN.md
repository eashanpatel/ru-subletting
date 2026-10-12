# RU Subletting: Project Plan (v3)

## Overview
A free, Zillow-like sublet marketplace, **Rutgers-first**. Students create listings for places they want to sublet, and others browse, filter, and contact them. The product replaces the social media sublet post (a photo plus location, price, amenities, and details) with listings that are searchable and shown on a map.

## Decisions locked in
- Free for everyone, with no monetization for now
- Open signup, not restricted to `.edu` emails
- Sign up and log in with **Google OAuth or email/password**
- **No email verification for now**, to allow testing with dummy emails (planned for later)
- **Responsive design for desktop and mobile equally**: both layouts are designed together, not mobile first with desktop added afterward
- Rutgers-only at launch, with a `schools` table so other campuses can be added later without a rewrite. Never hardcode "Rutgers" outside seed data and branding.
- **Phase 2 is out of scope**: messaging, search alerts, and moderation tooling
- UI is built on **shadcn/ui with Lucide icons**
- **Working name: RU Subletting.** It's presented as independent and student-made, with no Rutgers logos or official marks.
- **Audiences:** students subletting, students looking for a place, non-students near Rutgers (interns, researchers, summer workers), and landlords/property managers. Landlords post through the same flow as students for now.

## Tech stack
| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript, `src/`), React 19, Tailwind CSS 4, shadcn/ui |
| Forms / data | React Hook Form + Zod, TanStack Query |
| Maps | Mapbox GL JS (plus Mapbox geocoding) |
| Backend | Next.js server actions / route handlers, same repo |
| Database | Supabase Postgres with PostGIS |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Storage | Supabase Storage (listing photos) |
| Hosting | Vercel |
| Monitoring | Sentry, PostHog (installed, optional at start) |

**Role of TanStack Query:** it manages server data on the client, meaning anything fetched from Supabase into the browser (listings, photos, favorites). It handles:
- Caching
- Loading and error states
- Query keys that include the filters and map bounds
- Infinite scroll
- Optimistic updates for favorites
- Refetching data in the background

Server components handle the first render of pages that need SEO and link previews, such as the listing detail page. UI-only state stays in React state.

## MVP features

### 1. Accounts
- Sign up and log in with Google, or with email and password
- Email verification is turned off in Supabase. Structure the code so that enabling it later only takes a settings change plus a small UI addition.
- Basic profile: name, avatar, and optional contact info (email and phone)

### 2. Listings
- Create, edit, pause, and delete your own listings
- Fields: title, description, price/month, available start and end dates, beds, baths, address, neighborhood, amenities, photos
- Multi-photo upload with reordering, resized and compressed before storing
- The address is geocoded to a PostGIS point with Mapbox geocoding

### 3. Browse and search
- Listing grid with a synced Mapbox map
- Filters: price, dates, beds/baths, amenities, and distance to a chosen Rutgers campus
- Sort by price, newest, and distance
- Map interactions: pins, click to preview, and search "in this map area"

### 4. Listing detail page
- Photo gallery, full details, map location, owner info
- **Contact:** the owner chooses which contact methods to show, visible to logged-in users only. This stands in for in-app messaging for now.
  - **Built:** the lister adds any of email, phone, Instagram, WhatsApp, Snapchat, or another method, each optional. Schema change: replace `profile_contacts` email/phone + listing `show_email`/`show_phone` with a per-listing `listing_contact_methods` table (listing_id, kind enum, value, position), still exposed only through a signed-in-only function. The contact card renders one button per method (deep links: wa.me, instagram.com, snapchat.com/add, sms:, mailto:).

### 5. Saved listings (favorites)

### 6. Responsive layouts
- **Desktop:** list and map side by side, wider grids, a multi-column detail page
- **Mobile:** stacked views with a list/map toggle, touch-friendly controls, and filters in a bottom sheet

## Rutgers-specific features
- Campus distance filters: College Ave, Busch, Livingston, Cook/Douglass, and optionally Newark and Camden
- Neighborhood tags that students recognize, such as Easton Ave, Hamilton St, and Highland Park
- Semester presets tied to the Rutgers academic calendar, such as "Summer 2027" and "Spring semester"
- *Later:* Rutgers bus route info for each listing

## Trust and safety (lightweight for MVP)
With no `.edu` requirement and no email verification, the MVP relies on:
- Listers choose who sees the exact address: only people they share it with (default), signed-in members, or everyone. The street name and an approximate area (~100 m) are always public.
- A report button on every listing. Reports are saved to the database and reviewed manually for now.
- Rate limits on listing creation
- Safety tips on the listing page and in the contact flow
- Supabase Row Level Security (RLS), so users can only edit their own data

**Deferred:**
- Email verification
- An optional "Rutgers student" badge, earned by verifying a `@rutgers.edu` email
- A moderation dashboard

## Data model
- **schools:** name, email domain, map center, campus locations (Rutgers is the only row at launch)
- **profiles:** id (matches the Supabase auth user), name, avatar, contact email/phone, school_id (optional)
- **listings:** id, owner_id, school_id, title, description, price, start_date, end_date, beds, baths, `room_type` (private room / shared room / entire place / studio), address, `location` (PostGIS point), neighborhood, status, created_at
- **semesters** (or a column on schools): label and date range per term, used for semester presets and the fit bar on listing cards
- **listing_photos:** id, listing_id, storage path, position
- **amenities** / **listing_amenities:** many-to-many
- **favorites:** user_id, listing_id
- **reports:** id, listing_id, reporter_id, reason, created_at

`conversations` and `messages` are not created yet (Phase 2).

**Future monetization hooks** (don't build yet, just keep room for them): a `featured_until` field on listings, a `user_type` field (student/landlord/business), and a way to mark sponsored content.

## Roadmap
1. **Setup:** repo, Next.js, Supabase project, PostGIS, Mapbox token, Vercel deployment
2. **Auth:** Google login and email/password, profiles, RLS policies
3. **Listings:** create/edit form, photo upload, geocoding, detail page
4. **Discovery:** browse grid, filters, Mapbox map, campus distance search
5. **Favorites and reports**
6. **Polish:** a responsive pass on desktop and mobile, seed data, error handling
7. **Launch at Rutgers**, seeding from the existing social media sublet groups

## Current status
- The project is scaffolded and all stack libraries are installed. `npm run build` passes.
- shadcn/ui is initialized (`components.json`, `Button` component).
- Supabase, Google OAuth, and Mapbox keys are set in `.env.local` (names in `.env.example`).
- Not wired yet:
  - The TanStack Query provider isn't in the layout
  - Sentry and PostHog aren't configured
- `npm audit` reports 5 high-severity vulnerabilities that came with the base install. Review them before launch, and don't run `npm audit fix --force` blindly.
- Design skills are in `.claude/skills/`:
  - **`impeccable`** is the main skill, for app UI: browse, map, filters, the listing form, and the profile
  - **`design-taste-frontend`** is for the homepage/landing page
  - Other style skills in that folder overlap and push conflicting looks. Don't mix them in unless a direction has been chosen.

## Next steps
1. ~~Write `PRODUCT.md` with `/impeccable init`~~ Done. See `PRODUCT.md`.
2. ~~Choose a design direction~~ Done: Stone + olive + brick, with a commute ruler, semester fit bar, and campus zones on the map. The browse page (`/`) is built as frontend only with demo data in `src/lib/demo-listings.ts`; the direction contract is in `.impeccable/surfaces/`. Still to do: `DESIGN.md` (run `/impeccable document`).
3. ~~Write the Supabase schema~~ Applied to the hosted project (`supabase/migrations/`). Exact addresses live in `listing_locations` (signed-in only); listings carry a ~100 m rounded point. Contact info is private and shared via `get_listing_contact()`. Browse queries go through `search_listings()`.
4. Real data: browse, Saved, and My listings read from Supabase via `search_listings()`; the map is Mapbox GL; saving writes to `favorites`. Dev demo listings: `supabase/dev/` (load and remove scripts). `/saved`, `/my-listings`, `/listings/new` redirect to sign-in when signed out. Light mode only for now.
5. Listing page `/listings/[id]`: gallery, semester timeline, commute to every campus, amenities, description, location (street and approximate area for everyone; exact address per the lister's setting), owner, report form, and a contact card (sign-in required; shows only what the owner chose to share). Data via `get_listing()` / `get_listing_location()`.
6. Post a sublet (`/listings/new`) and edit (`/listings/[id]/edit`): room type, building, beds/baths, dates (calendar + semester presets), rent, Mapbox address search, neighborhood, photo upload (browser-compressed, reorderable, cover first), amenities, description, contact methods (email, phone, WhatsApp, Instagram, Snapchat, other), live browse-card preview, save draft or publish. Saved through `save_listing()` in one transaction via a server action that also prunes removed photos and refreshes the listing cache. My listings: edit, view, pause/resume, mark taken/relist, delete.
7. MVP completion: mobile menu, `/account` (display name, password, sign out), password reset (`/forgot-password` -> email -> `/update-password`), browse filters in the URL (shareable, survive refresh/back), phone map pin preview, footer, error and 404 pages, `robots.txt`, `sitemap.xml`, app icon. Photos compressed adaptively in the browser (target 600 KB); bucket limited to 1.5 MB WebP/JPEG.
8. Auth wiring done: Supabase clients in `src/lib/supabase/`, session refresh in `src/proxy.ts`, `/sign-in` (Google + email/password), `/auth/callback`, `/auth/sign-out`.

## Accounts the owner needs to set up
- A Supabase project (with PostGIS enabled)
- A Google Cloud OAuth client
- A Mapbox account and access token
- A Vercel account

## Open questions
1. **Contact method:** is "the owner chooses whether to show email and/or phone, to logged-in users only" final for the MVP?
3. **Landlord listings:** how they're labeled or told apart from student sublets
4. **Permanent product name**
