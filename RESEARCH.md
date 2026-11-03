# Design research — Beauty Example

Before the final design pass I built a small research tool (`tools/research/`) and used it on
public home pages of beauty, spa and skin-care sites. This file records **what was actually
studied, what was found, and what was taken into this project**. The goal was inspiration,
not copying: no source code, photos, copy or brand styling were taken from any site.

## How the research was done

- **Tool**: `tools/research/analyzer.js` runs inside a page and reports tech used, booking
  vendor (detected from script/link/iframe/form URLs only), fonts and sizes, colour palette by
  area, header/navigation, hero media, sections, motion (transitions, animations, sticky,
  masks, clip-paths, scroll-snap…), beauty components (prices, durations, team, before/after,
  reviews, FAQ, gift cards, membership) and image loading.
- `tools/research/run.py` is a Playwright runner for local use: it checks `robots.txt`, scrolls
  the page, takes desktop and mobile screenshots and saves JSON.
- In this session the cloud workspace had no direct internet, so the analyzer was run through
  the built-in browser on the user's Mac (`run-in-browser.js` and condensed variants of the same
  checks). `robots.txt` was checked for every site before analysis.
- Only public home pages were opened. No logins, no form submissions, no bot-protection
  workarounds. One page that the browser was not allowed to open (a Square booking page) was
  skipped rather than worked around. thewell.com did not load (certificate error) and was skipped.

## Sites studied (round 1) and findings

Raw results are in `tools/research/data/*.json`.

| Site | Type | What stood out |
|---|---|---|
| albumhair.com | Hair salon | Info strip right under the hero (address · hours · services · book); sticky header with a short "BOOK ONLINE" CTA; "Before you book" FAQ; team section; prices shown openly. Mindbody booking. |
| heydayskincare.com | Skin studio | First-visit offer in the hero; announcement marquee; **vertical tab module** (one list, one changing panel); reviews carousel; membership block; heavy use of `mask-image` (42 elements) and AOS reveals. |
| aesop.com | Cosmetics brand | Restraint: small headings (h1 30px), warm creams, quiet 0.2–0.5s ease transitions; editorial split blocks; 63 of 72 images lazy-loaded. |
| raoul-hair.nl | Hair salon (Webflow) | Announcement marquee above the header; inset video hero in a frame; "MENU" burger; big uppercase display type mixed with a script accent. No robots.txt served. |
| thecollectivehair.com | Hair salon | Services as short human descriptions; **"Book" on each stylist card that preselects that stylist** in the booking system; gift cards in the main navigation. |
| skinlaundry.com | Skin clinic chain | Before/after cards with context (time span, concern, protocol) and an honest "Individual results may vary" note; first-visit offer in the top bar; light-weight (300) display serif; one unexpected accent colour against warm neutrals; location cards with Book buttons. |
| aman.com (spa link redirected to home) | Luxury hospitality / spa | Under 700 words on the home page; header with only **Menu + Reserve**, everything else in a full-screen overlay menu; small tracked eyebrow labels over serif headings; slow 0.35–0.6s transitions. |

## What was selected, and why

Each idea was scored on: does it help a guest book or decide (usefulness), does it fit a quiet
luxury feel (tone), does it work on a phone (mobile), and can it be built accessibly without
heavy libraries (cost).

| Idea (seen on) | Use | Tone | Mobile | Cost | Decision |
|---|---|---|---|---|---|
| Info strip under hero (Album) | ★★★ | ★★ | ★★★ | low | **Taken** — with a live "open now / opens at" status |
| Vertical tab service module (Heyday) | ★★★ | ★★★ | ★★ | low | **Taken** — becomes a chip scroller on mobile |
| Book from a specialist card with preselect (Collective) | ★★★ | ★★ | ★★★ | low | **Taken** — plus each card shows that person's next free slot |
| Announcement marquee (Raoul, Heyday) | ★★ | ★★ | ★★★ | low | **Taken** — first-visit code + policies, pauses on hover |
| Menu + Book header, overlay menu (Aman) | ★★ | ★★★ | ★★★ | low | **Taken** — overlay with image preview per item |
| Eyebrow + serif heading, slow easing (Aman, Aesop) | ★ | ★★★ | ★★★ | none | **Taken** as the type system |
| Before/after with context + disclaimer (Skin Laundry) | ★★ | ★★ | ★★ | medium | **Adapted** — we have no real client photos, so it became a *tone preview* that clearly says it is simulated |
| First-visit offer (Skin Laundry, Heyday) | ★★ | ★★ | ★★★ | low | **Taken** — real promo code that works at checkout |
| Gift cards in navigation (Collective) | ★★ | ★★ | ★★★ | low | **Taken** — with a live gift card builder |
| Location finder (Skin Laundry) | ★ | ★ | ★★ | medium | Skipped — one salon |
| Full-screen video hero (Raoul) | ★ | ★★ | ★ | high | Skipped — heavy on mobile; replaced by an arched photo with a slow zoom |

## How it was implemented (own code)

- **Hero**: words rise from masks line by line, arched photo with a slow Ken Burns zoom, a small
  parallax photo and a rotating text badge. Under the buttons, a live **"Next free appointment"**
  link computed from the demo schedule opens booking with service, specialist, day and time already filled in.
- **Info strip** with a live open/closed status.
- **Service explorer**: accessible tabs (arrow keys, hover on desktop), image cross-fade, mini price list.
- **Signature rituals**: scroll-snap carousel with drag, buttons and a progress line.
- **Tone studio**: before/after slider (keyboard accessible range input) with four tone filters
  and a clear "simulated, not a client result" note.
- **Specialists**: grayscale-to-colour portraits, next free slot, "Book with …" preselects the person;
  profile drawer with a 7-day availability strip.
- **Price list** page: filters, search, expandable rows, "visit plan" that adds up time and price.
- **Booking**: 4 steps (service + add-ons → specialist or "first available" → calendar with
  availability levels and grouped time slots → details), sticky summary, promo code, validation,
  confirmation with .ics calendar file, "My visits" with cancellation policy.
- **Gift card builder** with live preview.
- Motion uses one easing curve, respects `prefers-reduced-motion`, and animates only
  transform/opacity/clip-path.

## Round 2 — checks and fixes after building

Desktop (1440×900) and mobile (390×844) screenshots and an automated flow test (book → cancel,
price list, gift card, profile, menu) were run with Playwright. Weak spots found and fixed:

- Image masks never revealed: `IntersectionObserver` ignores elements hidden by `clip-path`
  → the parent is now observed.
- Hero headline wrapped onto three lines at 1440px → smaller fluid size.
- "Nails from $15" was really an add-on price → "from" prices now ignore add-ons.
- Header "Book now" button overlapped the logo on phones → hidden there (a bottom book bar takes over).
- Team cards on phones were one huge column → two compact columns.
- Uneven card heights → actions pinned to the bottom.
- Map pin was off the named street; parking label overflowed its block → redrawn.
- Toasts covered the mobile book bar → moved up on phones.
- Skip link appeared after programmatic focus → shown only on keyboard focus.
- Confirmation title read "See you Tomorrow" → natural phrasing.

## Limits — said plainly

- 7 sites in round 1 is a small sample; the analyzer reads computed styles, so it sees *what* a page
  does, not always *how*.
- Some runs used a condensed in-page variant of the analyzer because of browser-tool output limits.
- The cloud workspace could not load Unsplash images, so automated screenshots used neutral
  placeholders; layout was checked there and photos were verified separately in the browser.
