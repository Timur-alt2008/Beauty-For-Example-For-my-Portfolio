# Beauty Example

A demo website for a quiet luxury beauty salon — hair, skin, nails, body and makeup.
Built as a portfolio project: the salon, people, prices and reviews are fictional, and bookings
and gift cards run in test mode (saved only in your browser).

**Live site:** https://timur-alt2008.github.io/Beauty-For-Example-For-my-Portfolio/

## Features

- **Home** — animated hero with a live "next free appointment", visit info strip with open/closed status,
  service explorer (tabs), signature rituals carousel, tone studio (before/after slider, clearly marked as simulated),
  specialists, gallery with lightbox, reviews, gift card and first-visit offers, FAQ, map, opening hours and contact form.
- **Services & prices** — full menu with category filters, search, length filter, expandable rows and a "visit plan"
  that adds up time and price.
- **Specialists** — filter by discipline, profiles with a 7-day availability strip, "Book with …" preselects the person.
- **Booking** — service + add-ons → specialist or first available → calendar and time slots → details.
  Promo code `FIRSTGLOW` (first visit, 15%), validation, confirmation and an `.ics` calendar file.
- **My visits** — upcoming and past bookings, cancellation with the 24-hour rule.
- **Gift cards** — amount or treatment, three designs, personal note, delivery date, live preview.
- Responsive from 320px, keyboard accessible, `prefers-reduced-motion` respected.

## Tech

Plain HTML, CSS and JavaScript (ES modules). No build step and no dependencies — runs on any static host,
including GitHub Pages.

```
index.html
assets/css/      base · layout · components · home · pages
assets/js/
  app.js          routes, page transitions, parallax
  router.js       hash router (#/book?service=…)
  store.js        localStorage + memory fallback
  services/api.js demo API: availability, bookings, gift cards
  data/           salon, services, team, photos
  components/     shell (header, menu, footer), UI helpers
  pages/          home, services, team, book, gift cards, visits
tools/research/   the design research tool (see RESEARCH.md)
```

Every page gets data only through `services/api.js`, whose functions are async and return
server-shaped objects — replace their bodies with `fetch()` calls to a real booking backend.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Research

See [RESEARCH.md](RESEARCH.md) for the sites studied, findings, what was selected and why.

## Photos

All photos are from [Unsplash](https://unsplash.com) and used under the free
[Unsplash License](https://unsplash.com/license); credits are on the site's *Photo credits* page.
Team portraits are stock photos used for a fictional team. No images were taken from the sites studied.
