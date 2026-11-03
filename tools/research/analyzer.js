/*
 * Beauty Site Analyzer — runs inside a loaded web page and returns a compact JSON report.
 *
 * Works in three ways:
 *   1. Playwright: page.evaluate(analyzerSource)  (see run.py / run.mjs)
 *   2. Browser automation tools that execute JavaScript in the page
 *   3. Pasted into DevTools console
 *
 * It only reads what the browser has already rendered for a normal visitor:
 * DOM, computed styles, same-origin stylesheets and global objects. It never
 * submits forms, logs in, or bypasses any protection.
 */
(() => {
  const W = innerWidth, H = innerHeight;
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.02; };
  const txt = (el, n = 80) => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const top = (map, n = 6) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${Math.round(v)})`);
  const all = Array.from(document.querySelectorAll('body *'));
  const visible = all.filter((el) => { try { return vis(el); } catch (e) { return false; } });
  const html = document.documentElement.outerHTML;
  const has = (re) => re.test(html);

  /* ---------- tech / platform ---------- */
  const scripts = Array.from(document.scripts).map((s) => s.src).filter(Boolean);
  const scriptStr = scripts.join(' ') + ' ' + Array.from(document.querySelectorAll('link[href]')).map((l) => l.href).join(' ');
  const tech = [];
  const probe = {
    GSAP: () => window.gsap || /gsap/i.test(scriptStr), ScrollTrigger: () => window.ScrollTrigger || /ScrollTrigger/i.test(scriptStr),
    Lenis: () => window.Lenis || window.lenis || document.documentElement.classList.contains('lenis'), Locomotive: () => /locomotive/i.test(scriptStr) || document.querySelector('[data-scroll-container]'),
    Swiper: () => window.Swiper || document.querySelector('.swiper'), Splide: () => document.querySelector('.splide'), Slick: () => document.querySelector('.slick-slider'),
    Barba: () => window.barba || document.querySelector('[data-barba]'), Three: () => window.THREE || /three(\.min)?\.js/i.test(scriptStr),
    Webflow: () => window.Webflow || document.documentElement.dataset.wfPage, Framer: () => document.querySelector('[data-framer-name],[data-framer-component-type]') || /framer/i.test(scriptStr),
    Shopify: () => window.Shopify, WordPress: () => /wp-content/i.test(scriptStr), Squarespace: () => /squarespace/i.test(scriptStr), Wix: () => /wixstatic|parastorage/i.test(scriptStr),
    'Next.js': () => window.__NEXT_DATA__ || document.getElementById('__next'), Nuxt: () => window.__NUXT__, React: () => document.querySelector('[data-reactroot]') || window.React,
    jQuery: () => window.jQuery, AOS: () => window.AOS || document.querySelector('[data-aos]'), Lottie: () => window.lottie || document.querySelector('lottie-player,[data-animation-type="lottie"]'),
  };
  for (const [k, f] of Object.entries(probe)) { try { if (f()) tech.push(k); } catch (e) {} }
  const bookingVendors = ['fresha', 'vagaro', 'booksy', 'mindbody', 'treatwell', 'squareup', 'zenoti', 'boulevard', 'glossgenius', 'acuityscheduling', 'calendly', 'phorest', 'timely', 'setmore', 'mangomint', 'meevo', 'salonized', 'opentable', 'resy', 'simplybook'];
  const linkStr = (scriptStr + ' ' + Array.from(document.querySelectorAll('a[href],iframe[src],form[action]')).map((a) => a.href || a.src || a.action).join(' ')).toLowerCase();
  const booking = bookingVendors.filter((v) => linkStr.includes(v));

  /* ---------- typography ---------- */
  const fontArea = {}, sizes = [];
  visible.forEach((el) => {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    fontArea[fam] = (fontArea[fam] || 0) + (r.width * r.height) / 1000;
    sizes.push(parseFloat(s.fontSize));
  });
  const headStyle = (sel) => {
    const el = Array.from(document.querySelectorAll(sel)).find(vis); if (!el) return null;
    const s = getComputedStyle(el);
    return { text: txt(el, 70), family: s.fontFamily.split(',')[0].replace(/["']/g, ''), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, transform: s.textTransform, style: s.fontStyle };
  };
  const bodyS = getComputedStyle(document.querySelector('p') || document.body);

  /* ---------- colours ---------- */
  const bg = {}, fg = {};
  visible.forEach((el) => {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect(); const a = (Math.min(r.width, W) * Math.min(r.height, H * 3)) / 10000;
    if (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor)) bg[s.backgroundColor] = (bg[s.backgroundColor] || 0) + a;
    if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) fg[s.color] = (fg[s.color] || 0) + 1;
  });

  /* ---------- header / navigation ---------- */
  const header = document.querySelector('header') || visible.find((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position) && el.getBoundingClientRect().top <= 5 && el.getBoundingClientRect().height < 200);
  const navLinks = header ? Array.from(header.querySelectorAll('a')).filter(vis).map((a) => txt(a, 30)).filter(Boolean) : [];
  const burger = !!document.querySelector('[aria-label*="menu" i],[class*="burger" i],[class*="hamburger" i],[class*="menu-toggle" i]');
  const cta = Array.from(document.querySelectorAll('a,button')).filter(vis).map((b) => txt(b, 40)).filter((t) => t.length <= 32 && /book|appointment|reserve|schedule|shop now|consult/i.test(t));

  /* ---------- hero (first viewport) ---------- */
  const inHero = (el) => { const r = el.getBoundingClientRect(); return r.top < H && r.bottom > 0; };
  const heroMedia = {
    videos: Array.from(document.querySelectorAll('video')).filter((v) => inHero(v) && vis(v)).length,
    images: Array.from(document.querySelectorAll('img,picture')).filter((i) => inHero(i) && vis(i) && i.getBoundingClientRect().width > W * 0.3).length,
    bgImages: visible.filter((el) => inHero(el) && getComputedStyle(el).backgroundImage.includes('url(') && el.getBoundingClientRect().width > W * 0.4).length,
    canvas: Array.from(document.querySelectorAll('canvas')).filter((c) => inHero(c) && vis(c)).length,
  };
  const h1 = headStyle('h1');

  /* ---------- sections ---------- */
  const root = document.querySelector('main') || document.body;
  let blocks = Array.from(root.children).filter(vis);
  if (blocks.length < 4) blocks = Array.from(root.querySelectorAll(':scope > * > *')).filter(vis);
  const sections = blocks.filter((b) => b.getBoundingClientRect().height > 120).slice(0, 24).map((b) => {
    const hEl = b.querySelector('h1,h2,h3');
    const s = getComputedStyle(b);
    const grid = b.querySelector('[style*="grid"],[class*="grid" i]') ? 'grid' : '';
    return { heading: txt(hEl, 60), h: Math.round(b.getBoundingClientRect().height), imgs: b.querySelectorAll('img,picture,video').length, bg: s.backgroundColor, layout: grid, links: b.querySelectorAll('a').length };
  });

  /* ---------- motion & effects ---------- */
  const fx = { transitions: 0, animations: 0, sticky: 0, blend: 0, clip: 0, backdrop: 0, transform3d: 0, scrollSnap: 0, cursorNone: 0, marqueeLike: 0, maskImage: 0 };
  visible.forEach((el) => {
    const s = getComputedStyle(el);
    if (s.transitionDuration && s.transitionDuration !== '0s') fx.transitions++;
    if (s.animationName && s.animationName !== 'none') { fx.animations++; if (/marquee|scroll|ticker|loop/i.test(s.animationName)) fx.marqueeLike++; }
    if (s.position === 'sticky') fx.sticky++;
    if (s.mixBlendMode !== 'normal') fx.blend++;
    if (s.clipPath && s.clipPath !== 'none') fx.clip++;
    if (s.backdropFilter && s.backdropFilter !== 'none') fx.backdrop++;
    if (/matrix3d/.test(s.transform)) fx.transform3d++;
    if (s.scrollSnapType && s.scrollSnapType !== 'none') fx.scrollSnap++;
    if (s.cursor === 'none') fx.cursorNone++;
    if ((s.maskImage || s.webkitMaskImage || 'none') !== 'none') fx.maskImage++;
  });
  const keyframes = [], media = new Set(); let cssRules = 0, crossOriginSheets = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch (e) { crossOriginSheets++; continue; }
    const walk = (list) => { for (const r of Array.from(list || [])) { cssRules++; if (r.type === 7) keyframes.push(r.name); if (r.type === 4) { (r.conditionText || r.media.mediaText).match(/\d+px/g)?.forEach((m) => media.add(parseInt(m, 10))); walk(r.cssRules); } } };
    walk(rules);
  }
  const dataAttrs = {};
  all.forEach((el) => { for (const a of el.attributes) if (/^data-(aos|scroll|speed|parallax|reveal|animate|anim|split|lag|cursor|magnetic|framer-appear)/.test(a.name)) dataAttrs[a.name] = (dataAttrs[a.name] || 0) + 1; });
  const classHints = {};
  all.forEach((el) => { const c = typeof el.className === 'string' ? el.className : ''; (c.match(/\b[\w-]*(reveal|parallax|marquee|fade|split|stagger|magnetic|cursor|hover-img|lightbox|accordion|tabs?|slider|carousel|ticker)[\w-]*\b/gi) || []).forEach((k) => { const key = k.toLowerCase().replace(/[-_]{2,}.*/, '').slice(0, 30); classHints[key] = (classHints[key] || 0) + 1; }); });

  /* ---------- beauty-specific components ---------- */
  const bodyText = document.body.innerText;
  const priceMatches = bodyText.match(/(?:[$£€₴]\s?\d{2,4}(?:[.,]\d{2})?|\d{2,4}\s?(?:USD|EUR|GBP|грн|₴))/g) || [];
  const comp = {
    priceMentions: priceMatches.length,
    priceSamples: priceMatches.slice(0, 6),
    durations: (bodyText.match(/\b\d{2,3}\s?(?:min|mins|minutes|мин)\b/gi) || []).length,
    team: /our (team|stylists|artists|experts|therapists|practitioners)|meet the|specialists|founder/i.test(bodyText),
    beforeAfter: /before\s*(&|and|\/)?\s*after/i.test(bodyText) || !!document.querySelector('input[type=range],[class*="before" i][class*="after" i],[class*="compare" i]'),
    testimonials: /testimonial|reviews?|what (our )?clients say|kind words/i.test(bodyText),
    faq: document.querySelectorAll('details,summary,[aria-expanded]').length,
    galleryImgs: Math.max(0, ...Array.from(document.querySelectorAll('section,div')).map((d) => d.querySelectorAll(':scope > * img, :scope > img').length)),
    forms: Array.from(document.forms).map((f) => ({ inputs: f.querySelectorAll('input,select,textarea').length, types: [...new Set(Array.from(f.querySelectorAll('input')).map((i) => i.type))].slice(0, 6).join(',') })).slice(0, 4),
    dateInputs: document.querySelectorAll('input[type=date],input[type=datetime-local],[role=grid]').length,
    iframes: Array.from(document.querySelectorAll('iframe')).map((i) => (i.src || '').split('/')[2]).filter(Boolean).slice(0, 5),
    instagram: /instagram/i.test(html),
    giftCards: /gift ?card|gift voucher/i.test(bodyText),
    membership: /membership|subscription|club/i.test(bodyText),
  };

  /* ---------- images & buttons ---------- */
  const imgs = Array.from(document.images);
  const imgInfo = { total: imgs.length, lazy: imgs.filter((i) => i.loading === 'lazy' || i.dataset.src).length, cover: imgs.filter((i) => getComputedStyle(i).objectFit === 'cover').length, withAlt: imgs.filter((i) => i.alt && i.alt.trim()).length };
  const radii = {}, btnCase = { upper: 0, normal: 0 };
  Array.from(document.querySelectorAll('a,button')).filter(vis).forEach((b) => {
    const s = getComputedStyle(b);
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.borderStyle !== 'none') radii[s.borderRadius] = (radii[s.borderRadius] || 0) + 1;
    if (s.textTransform === 'uppercase') btnCase.upper++; else btnCase.normal++;
  });

  return {
    url: location.href,
    title: document.title.slice(0, 90),
    description: (document.querySelector('meta[name=description]')?.content || '').slice(0, 160),
    viewport: `${W}x${H}`,
    pageHeight: document.documentElement.scrollHeight,
    tech, booking,
    typography: { fonts: top(fontArea, 5), h1, h2: headStyle('h2'), body: { family: bodyS.fontFamily.split(',')[0], size: bodyS.fontSize, lh: bodyS.lineHeight }, maxSize: Math.max(0, ...sizes) },
    colors: { backgrounds: top(bg, 6), text: top(fg, 5) },
    nav: { headerPosition: header ? getComputedStyle(header).position : 'none', links: navLinks.slice(0, 12), burger, cta: [...new Set(cta)].slice(0, 5) },
    hero: { ...heroMedia, h1: h1?.text || '' },
    sections,
    motion: { ...fx, keyframes: [...new Set(keyframes)].slice(0, 20), dataAttrs, classHints: top(classHints, 12) },
    breakpoints: [...media].sort((a, b) => a - b).slice(0, 14),
    css: { rules: cssRules, crossOriginSheets },
    components: comp,
    images: imgInfo,
    buttons: { radii: top(radii, 4), ...btnCase },
  };
})();
