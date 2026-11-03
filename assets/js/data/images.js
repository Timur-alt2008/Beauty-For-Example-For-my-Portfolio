// All photos are from Unsplash and used under the free Unsplash License
// (https://unsplash.com/license). Each one was checked for that license.
// They are hot-linked from images.unsplash.com, as Unsplash recommends.
// None of the photos come from the salon websites studied during research.

export const PHOTOS = {
  hero:      { id: '1600948836101-f9ffda59d250', by: 'Greg Trowman',        page: 'salon-chairs-with-mirrors-and-products-jsuWg7IXx1k', alt: 'Dark salon with round mirrors and black styling chairs' },
  hair:      { id: '1580618672591-eb180b1a973f', by: 'Adam Winger',         page: 'hairstylist-blow-drying-client-hair-FkAZqQJTbXM', alt: 'Stylist blow-drying a client’s hair with a round brush' },
  curl:      { id: '1629397685944-7073f5589754', by: 'Giorgio Trovato',     page: 'hairstylist-curling-hair-in-salon-wSpkThmoZQc', alt: 'Hairstylist curling a client’s hair' },
  facial:    { id: '1570172619644-dfd03ed5d881', by: 'Rosa Rafael',         page: 'woman-receiving-facial-mask-treatment-at-spa-Pe9IXUuC6QU', alt: 'Client receiving a facial mask treatment' },
  cream:     { id: '1616394584738-fc6e612e71b9', by: 'engin akyurt',        page: 'woman-lying-on-blue-towel-with-white-cream-on-face-g-m8EDc4X6Q', alt: 'Client resting with a cream mask on her face' },
  nails:     { id: '1610992015762-45dca7fa3a85', by: 'Chelson Tamares',     page: 'hand-with-light-pink-manicured-nails-vtQHwU4F13s', alt: 'Hand with soft pink manicured nails' },
  nails2:    { id: '1519014816548-bf5fe059798b', by: 'DESIGNECOLOGIST',     page: 'selective-focus-photography-of-womans-pink-manicure-r-Ej0NQmFlQ', alt: 'Close-up of a pink manicure' },
  stones:    { id: '1600334089648-b0d9d3028eb2', by: 'engin akyurt',        page: 'person-with-hot-stones-at-spa-ZbzYDboN7fg', alt: 'Hot stone massage with smooth black stones' },
  massage:   { id: '1544161515-4ab6ce6db874',    by: 'alan caishan',        page: 'woman-lying-with-prone-position-cU53ZFBr3lk', alt: 'Client relaxing during a massage' },
  makeup:    { id: '1709477542149-f4e0e21d590b', by: 'LOLA AZIZADA',        page: 'a-woman-getting-her-make-up-done-with-a-brush-I3y-aJ4DWng', alt: 'Makeup artist applying powder with a brush' },
  brushes:   { id: '1596462502278-27bfdc403348', by: 'Shamblen Studios',    page: 'pink-and-brown-makeup-brush-set-xwM61TPMlYk', alt: 'Set of makeup brushes' },
  interior2: { id: '1521590832167-7bcbfaa6381f', by: 'Guilherme Petri',     page: 'salon-chairs-at-white-vanity-PtOfbGkU3uI', alt: 'Salon chairs facing a long white vanity and mirror' },
  interior3: { id: '1560066984-138dadb4c035',    by: 'Adam Winger',         page: 'grayscale-photo-of-woman-using-laptop-near-three-salon-chairs-VjRpkGtS55w', alt: 'Black and white photo of a salon with three chairs' },
  candles:   { id: '1620733723572-11c53f73a416', by: 'Mediamodifier',       page: 'reed-diffuser-with-candles-and-towel-W7AyAs7azHc', alt: 'Reed diffuser, rolled towel and lit candles' },
  bottle:    { id: '1515377905703-c4788e51af15', by: 'Christin Hume',       page: 'person-holding-amber-glass-bottle-0MoF-Fe0w0A', alt: 'Hand holding an amber glass bottle' },
  products:  { id: '1598440947619-2c35fc9aa908', by: 'michela ampolo',      page: 'skincare-products-and-jade-roller-7tDGb3HrITg', alt: 'Skincare products and a jade roller on a striped towel' },
  p1:        { id: '1544005313-94ddf0286df2',    by: 'Štefan Štefančík',    page: 'smiling-woman-wearing-white-and-black-pinstriped-collared-top-QXevDflbl8A', alt: 'Portrait of a smiling woman' },
  p2:        { id: '1506863530036-1efeddceb993', by: 'Rachel McDermott',    page: 'grayscale-photo-of-woman-wearing-necklace-and-top-0fN7Fxv1eWA', alt: 'Black and white portrait of a woman' },
  p3:        { id: '1611451444023-7fe9d86fe1d0', by: 'Evgeny Bauder',       page: 'woman-in-white-crew-neck-shirt-POtlM7Oa0mE', alt: 'Portrait of a woman in a white shirt' },
  p4:        { id: '1636153279424-cb5d1e00f5a2', by: 'Valeria Lendel',      page: 'a-woman-with-long-black-hair-standing-in-front-of-a-wall-0b_7r_dNjFs', alt: 'Portrait of a woman with long dark hair' },
  p5:        { id: '1674932668403-33398b81c92f', by: 'Yoad Shejtman',       page: 'a-close-up-of-a-woman-with-a-ponytail-YhMFYJZgMA0', alt: 'Close-up portrait of a woman with a ponytail' },
  p6:        { id: '1574015974293-817f0ebebb74', by: 'Ayo Ogunseinde',      page: 'grayscale-photography-of-woman-wearing-long-sleeved-shirt-UqT55tGBqzI', alt: 'Black and white portrait of a woman' },
};

/** Unsplash image URL at a given width (Imgix parameters). */
export function photo(key, w = 1200, h) {
  const p = PHOTOS[key];
  if (!p) return '';
  return `https://images.unsplash.com/photo-${p.id}?w=${w}${h ? `&h=${h}` : ''}&q=75&auto=format&fit=crop`;
}

export const alt = (key) => PHOTOS[key]?.alt || '';

/** <img> with srcset, lazy loading and a warm placeholder behind it. */
export function img(key, { w = 900, ratio, cls = '', eager = false, sizes = '(max-width: 760px) 100vw, 50vw', altText } = {}) {
  const p = PHOTOS[key];
  if (!p) return '';
  const h = ratio ? Math.round(w / ratio) : undefined;
  const set = [0.5, 1, 1.6].map((k) => {
    const ww = Math.round(w * k);
    return `${photo(key, ww, h ? Math.round(h * k) : undefined)} ${ww}w`;
  }).join(', ');
  return `<img class="${cls}" src="${photo(key, w, h)}" srcset="${set}" sizes="${sizes}" alt="${altText ?? p.alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onload="this.classList.add('is-loaded')" onerror="this.classList.add('is-missing')">`;
}
