// Service menu. Prices are in USD, durations in minutes. Fictional.

export const CATEGORIES = [
  { id: 'hair', name: 'Hair', photo: 'hair', lead: 'Cuts that grow out well, colour that looks like yours, finishes that last past the weekend.', note: 'Every hair service starts with a 10-minute consultation.' },
  { id: 'skin', name: 'Skin', photo: 'facial', lead: 'Facials built on what your skin is doing today — not on a fixed protocol.', note: 'Skin analysis and an aftercare card are always included.' },
  { id: 'nails', name: 'Nails', photo: 'nails', lead: 'Clean, precise and long-wearing. Classic, gel and structured manicures and pedicures.', note: 'Only sterilised, single-client tools.' },
  { id: 'body', name: 'Body', photo: 'stones', lead: 'Slow, quiet rituals for tired shoulders, restless minds and long weeks.', note: 'Showers and robes are in every treatment room.' },
  { id: 'makeup', name: 'Makeup & Brows', photo: 'makeup', lead: 'From soft day looks to wedding mornings, plus brows and lashes shaped to your face.', note: 'Bridal trials are booked by phone.' },
];

export const SERVICES = [
  // Hair
  { id: 'h-cut', cat: 'hair', name: 'Precision cut & finish', duration: 60, price: 95, desc: 'Consultation, wash, cut and a smooth or textured finish. Shape planned to grow out well.', tags: ['popular'] },
  { id: 'h-blow', cat: 'hair', name: 'Signature blow-dry', duration: 45, price: 55, desc: 'Wash, scalp massage and a volume, sleek or soft-wave finish that lasts for days.' },
  { id: 'h-gloss', cat: 'hair', name: 'Gloss & tone', duration: 45, price: 70, desc: 'A sheer, conditioning gloss to refresh colour, neutralise brass or add shine.', tags: ['new'] },
  { id: 'h-colour', cat: 'hair', name: 'Root colour', duration: 90, price: 120, desc: 'Grey coverage or regrowth refresh with a gloss on the lengths.' },
  { id: 'h-balayage', cat: 'hair', name: 'Lived-in balayage', duration: 180, price: 290, desc: 'Hand-painted lightness that grows out softly. Includes toner, treatment and finish.', tags: ['signature'] },
  { id: 'h-ritual', cat: 'hair', name: 'Repair ritual', duration: 40, price: 60, desc: 'Bond-building treatment and steam for dry, coloured or heat-tired hair.' },
  // Skin
  { id: 's-signature', cat: 'skin', name: 'Signature facial', duration: 75, price: 140, desc: 'Analysis, double cleanse, enzyme exfoliation, extractions, sculpting massage and mask.', tags: ['signature', 'popular'] },
  { id: 's-express', cat: 'skin', name: 'Lunchtime glow', duration: 40, price: 85, desc: 'A quick, no-downtime facial for brightness and hydration.' },
  { id: 's-peel', cat: 'skin', name: 'Gentle resurfacing peel', duration: 50, price: 125, desc: 'A professional peel for uneven tone and texture, chosen for your skin type.' },
  { id: 's-lift', cat: 'skin', name: 'Sculpt & lift massage', duration: 60, price: 110, desc: 'Deep facial massage and gua sha work to release tension and define contours.', tags: ['new'] },
  { id: 's-teen', cat: 'skin', name: 'Clear skin consultation', duration: 30, price: 45, desc: 'A skin plan for breakouts, with a home routine and follow-up schedule.' },
  // Nails
  { id: 'n-classic', cat: 'nails', name: 'Classic manicure', duration: 40, price: 40, desc: 'Shape, cuticle care, hand massage and polish.' },
  { id: 'n-gel', cat: 'nails', name: 'Gel manicure', duration: 60, price: 60, desc: 'Long-wearing gel colour with careful cuticle work. Removal included.', tags: ['popular'] },
  { id: 'n-structure', cat: 'nails', name: 'Structured manicure', duration: 80, price: 75, desc: 'A builder gel overlay that strengthens natural nails and keeps them even.' },
  { id: 'n-pedi', cat: 'nails', name: 'Spa pedicure', duration: 60, price: 70, desc: 'Soak, exfoliation, callus care, massage and polish.' },
  { id: 'n-art', cat: 'nails', name: 'Minimal nail art', duration: 15, price: 15, desc: 'Fine lines, dots or a chrome finish — added to any manicure.' },
  // Body
  { id: 'b-stone', cat: 'body', name: 'Hot stone ritual', duration: 90, price: 160, desc: 'Full-body massage with warm basalt stones to melt deep tension.', tags: ['signature'] },
  { id: 'b-deep', cat: 'body', name: 'Deep tissue massage', duration: 60, price: 115, desc: 'Focused, firm work on back, neck and shoulders.' },
  { id: 'b-calm', cat: 'body', name: 'Calm aromatherapy massage', duration: 60, price: 105, desc: 'Slow, flowing massage with a blend of oils chosen with you.', tags: ['popular'] },
  { id: 'b-scrub', cat: 'body', name: 'Polish & glow body scrub', duration: 45, price: 80, desc: 'Salt or sugar exfoliation followed by a rich body balm.' },
  // Makeup & brows
  { id: 'm-event', cat: 'makeup', name: 'Event makeup', duration: 60, price: 95, desc: 'A long-wearing look for dinners, photos and celebrations. Lashes included.' },
  { id: 'm-lesson', cat: 'makeup', name: 'Everyday makeup lesson', duration: 75, price: 110, desc: 'Learn a 10-minute routine with your own products and leave with a face chart.' },
  { id: 'm-brow', cat: 'makeup', name: 'Brow shape & tint', duration: 30, price: 45, desc: 'Mapping, tint and precise shaping to suit your face.', tags: ['popular'] },
  { id: 'm-lamination', cat: 'makeup', name: 'Brow lamination', duration: 45, price: 65, desc: 'Brushed-up, fuller-looking brows that last around six weeks.' },
  { id: 'm-lash', cat: 'makeup', name: 'Lash lift & tint', duration: 50, price: 75, desc: 'A natural curl and depth to your own lashes, no extensions.' },
  { id: 'patch', cat: 'makeup', name: 'Patch test', duration: 10, price: 0, desc: 'Required 48 hours before colour, tint or lash services if you are new to us.' },
];

export const serviceById = (id) => SERVICES.find((s) => s.id === id);
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);
export const servicesIn = (cat) => SERVICES.filter((s) => s.cat === cat);
export const fromPrice = (cat) => Math.min(...servicesIn(cat).filter((s) => s.price > 0 && s.duration >= 30).map((s) => s.price));

/** Signature rituals used in the horizontal scroller on the home page. */
export const RITUALS = [
  { id: 's-signature', photo: 'cream', kicker: '75 min · Skin' },
  { id: 'b-stone', photo: 'stones', kicker: '90 min · Body' },
  { id: 'h-balayage', photo: 'curl', kicker: '3 h · Hair' },
  { id: 'n-structure', photo: 'nails2', kicker: '80 min · Nails' },
  { id: 'm-lash', photo: 'brushes', kicker: '50 min · Lashes' },
];
