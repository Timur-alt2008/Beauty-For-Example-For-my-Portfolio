// Salon details. Everything here is fictional (portfolio demo).

export const SALON = {
  name: 'Beauty Example',
  tagline: 'Hair · Skin · Hands · Body',
  address: '27 Alder Row, Old Town',
  city: 'Old Town',
  phone: '+1 (555) 014-2290',
  phoneHref: 'tel:+15550142290',
  email: 'hello@beauty-example.test',
  instagram: '@beauty.example',
  // 0 = Sunday … 6 = Saturday; null = closed
  hours: [
    null,
    [10, 19],
    [9, 20],
    [9, 20],
    [9, 21],
    [9, 21],
    [9, 18],
  ],
  firstVisit: { code: 'FIRSTGLOW', percent: 15 },
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const STATS = [
  { value: 12, suffix: '', label: 'years in Old Town' },
  { value: 6, suffix: '', label: 'senior specialists' },
  { value: 4.9, suffix: '', decimals: 1, label: 'average guest rating' },
  { value: 38, suffix: 'k', label: 'appointments so far' },
];

export const REVIEWS = [
  { quote: 'The calmest two hours of my month. Ava listened first, cut second — and the shape still works eight weeks later.', name: 'Helena R.', service: 'Precision cut & gloss' },
  { quote: 'I came in for a facial and left with a skin plan I can actually follow. No hard sell, just very good hands.', name: 'Marta K.', service: 'Signature facial' },
  { quote: 'Booking took a minute, they texted the day before, and the manicure lasted three full weeks.', name: 'Daniel P.', service: 'Gel manicure' },
  { quote: 'Iris found a blonde that finally looks like mine. The tone preview helped me explain what I wanted.', name: 'Sofia L.', service: 'Lived-in balayage' },
  { quote: 'Hot stones, low light, no small talk unless you want it. Exactly the kind of quiet I was looking for.', name: 'Noor A.', service: 'Hot stone ritual' },
];

export const FAQ = [
  { q: 'How early should I arrive?', a: 'Ten minutes is perfect: enough for tea, a quick consultation and changing if your treatment needs it. If you are more than 15 minutes late we may need to shorten the service so the next guest is not kept waiting.' },
  { q: 'Can I change or cancel my appointment?', a: 'Yes — free of charge up to 24 hours before your visit, right from “My visits” or by phone. Later cancellations and no-shows are charged at 50% of the service price.' },
  { q: 'Do I need a patch test for colour or lashes?', a: 'If you are new to us or have not had colour with us for six months, we ask for a quick patch test at least 48 hours before. It takes five minutes and is free — choose “Patch test” when you book.' },
  { q: 'Which products do you use?', a: 'Professional, cruelty-free ranges chosen per treatment. Your specialist will tell you exactly what was used and write it on your aftercare card, so you can repeat the routine at home.' },
  { q: 'Is there parking or step-free access?', a: 'There is a public car park 2 minutes away on Mill Lane, and the salon is on the ground floor with step-free access and an accessible washroom.' },
  { q: 'Do you offer gift cards?', a: 'Yes. Digital gift cards are delivered by email instantly or on a date you choose, are valid for 12 months and can be used for any service or product.' },
];
