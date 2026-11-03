// Specialists. Names and biographies are fictional; portraits are Unsplash
// stock photos (see data/images.js) and do not show real staff.

export const TEAM = [
  { id: 'ava', name: 'Ava Lindqvist', role: 'Creative director · Hair', cats: ['hair'], photo: 'p1', years: 14, off: [0, 1], level: 'Director', specialties: ['Precision cuts', 'Curly hair', 'Grow-out plans'], bio: 'Ava trained in Stockholm and London and still cuts every new guest’s first appointment herself. She plans shapes around how you actually style your hair on a Tuesday morning.' },
  { id: 'iris', name: 'Iris Moreau', role: 'Colour specialist', cats: ['hair'], photo: 'p4', years: 9, off: [0, 3], level: 'Senior', specialties: ['Balayage', 'Blonde', 'Grey blending'], bio: 'Iris paints colour by hand and is known for blondes that look natural in daylight. She will always tell you honestly how many sessions a change will take.' },
  { id: 'mira', name: 'Mira Okafor', role: 'Lead facialist', cats: ['skin', 'body'], photo: 'p3', years: 11, off: [0, 2], level: 'Senior', specialties: ['Sensitive skin', 'Sculpting massage', 'Peels'], bio: 'Mira reads skin before she treats it. Her facials change with the season and with what your skin is doing that day.' },
  { id: 'lena', name: 'Lena Novak', role: 'Nail artist', cats: ['nails'], photo: 'p5', years: 7, off: [0, 4], level: 'Senior', specialties: ['Structured gel', 'Minimal art', 'Natural nail repair'], bio: 'Lena is precise to the millimetre and quietly obsessed with cuticle work. Her gel manicures are famous for lasting three weeks.' },
  { id: 'june', name: 'June Harper', role: 'Massage therapist', cats: ['body'], photo: 'p2', years: 10, off: [0, 5], level: 'Senior', specialties: ['Hot stones', 'Deep tissue', 'Aromatherapy'], bio: 'June combines firm, focused work with long, slow strokes. Guests often say they forget the time in her room.' },
  { id: 'sara', name: 'Sara Velez', role: 'Makeup & brow artist', cats: ['makeup'], photo: 'p6', years: 8, off: [0, 1], level: 'Artist', specialties: ['Bridal', 'Brow mapping', 'Lash lift'], bio: 'Sara’s looks are soft, skin-first and built to last through long days and flash photos.' },
];

export const memberById = (id) => TEAM.find((m) => m.id === id);
export const teamFor = (cat) => TEAM.filter((m) => m.cats.includes(cat));
