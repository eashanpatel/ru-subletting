# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

RU Subletting is a two-sided marketplace for short-term housing around Rutgers.

**People with a place to sublet**
- **Rutgers students subletting their place.** They're leaving for the summer, a semester, an internship, or study abroad, and still owe rent on a lease. They're working against a move-out deadline and need someone reliable to take over the room. Today they post a photo and a few details in group chats and on Instagram, Facebook, and Reddit, then answer the same questions over and over.
- **Landlords and property managers near Rutgers.** They want to fill short gaps between leases. They post listings through the same flow as students for now. A separate landlord tier, verification, or labeling is a later decision (see open decisions).

**People looking for a place**
- **Rutgers students.** They need housing near a specific campus for a summer or a semester. They compare price, dates, distance to campus, and amenities, and they're wary of scams.
- **Non-students near Rutgers.** Interns, visiting researchers, grad workers, and summer workers who need short-term housing in New Brunswick. They often don't know the area, so the neighborhood and campus context matters even more to them.

Both sides use the product on both desktop and mobile. People often find it through a link shared in a group chat and first open it on a phone.

## Product Purpose

The product turns the informal social media sublet post (a photo plus location, price, amenities, and details) into a searchable, map-based marketplace. People can post a place quickly and find one by price, dates, beds/baths, amenities, and distance to a Rutgers campus.

Success means:
- Enough active listings that it's the first place people check, instead of scrolling group chats
- Sublessors fill their place before their move-out date
- Renters can judge a listing and contact the owner without any back-and-forth over basic details

## Positioning

It's built around Rutgers specifically, not around rentals in general:
- Distance from each campus (College Ave, Busch, Livingston, Cook/Douglass, and optionally Newark and Camden)
- Neighborhood names students actually use (Easton Ave, Hamilton St, Highland Park)
- Dates that follow the Rutgers academic calendar (presets like "Summer 2027" and "Spring semester")

A general rental site can't credibly offer any of these, and a group chat can't make listings searchable.

## Operating Context

- **Seasonal demand.** Listings and searches spike in the weeks before summer and winter breaks and before each semester starts.
- **Supply comes from social media.** The first listings will come from the Rutgers sublet groups and chats where these posts already happen. Shared listing links need to look good in link previews.
- **Contact happens off-platform.** There's no in-app messaging in the MVP. The owner chooses whether to show their email and/or phone to logged-in users.
- **Single campus at launch, with room to expand.** The data model includes a `schools` table, so other campuses can be added later. Never hardcode "Rutgers" outside seed data and branding.

## Capabilities and Constraints

The full scope, stack, data model, and roadmap are in `PROJECT_PLAN.md`. Durable facts:

- **Price:** free for everyone, with no monetization for now.
- **Accounts:** open signup with Google OAuth or email/password, not restricted to `.edu` emails. Email verification is off for now (it's planned for later).
- **Listings:** photos, title, description, price per month, available dates, beds/baths, address, neighborhood, and amenities. Owners can create, edit, pause, and delete their own listings.
- **Discovery:** a listing grid synced with a map, filters, sort options, search within the visible map area, and favorites.
- **Trust and safety:**
  - Listers choose who sees the exact address (only people they share it with, signed-in members, or everyone); the street and an approximate area are always shown
  - Every listing has a report button
  - Rate limits on posting
  - Safety tips on the listing page and in the contact flow
  - Row Level Security (RLS), so users can only edit their own data
- **Out of scope for the MVP:** messaging, search alerts, a moderation dashboard, and a verified "Rutgers student" badge.
- **Terminology:**
  - "Sublet" and "sublease" both mean the arrangement
  - A "listing" is one place on offer
  - The "owner" or "lister" is whoever posted it
  - Rutgers campuses are called by their own names: College Ave, Busch, Livingston, Cook/Douglass

**Open decisions:**
- Whether owner-controlled email/phone contact, shown to logged-in users only, is final for the MVP
- How landlord listings are labeled or told apart from student sublets
- A permanent product name ("RU Subletting" is the working name)

## Brand Commitments

- **Working name:** RU Subletting.
- **Affiliation:** independent and student-made ("by Rutgers students, for Rutgers students"). It's clearly unofficial and not affiliated with or endorsed by Rutgers University. Don't use Rutgers logos, crests, official marks, or anything that could read as official university branding.
- **UI foundation:** shadcn/ui with Lucide icons.

## Evidence on Hand

There are no real listings, users, testimonials, metrics, or partnerships yet. Don't invent any of them: no fake listing counts, student quotes, "trusted by" claims, or Rutgers endorsements. Use placeholder listings only when they're clearly marked as seed or demo data.

## Product Principles

1. **Faster than posting in the group chat.** Creating a listing should take less effort than the social media post it replaces.
2. **Answer the renter's questions up front.** Price, dates, distance to campus, beds/baths, and amenities should be visible at a glance, so nobody has to message just to ask.
3. **Earn trust without gatekeeping.** Signup is open, so safety comes from address privacy, reporting, and clear safety guidance, not from barriers to entry.
4. **Local knowledge is the advantage.** Campus names, neighborhoods, and semester dates should be built into how people search and post.
5. **Desktop and mobile are equal.** Neither layout is an afterthought.
