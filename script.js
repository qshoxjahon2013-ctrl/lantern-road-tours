// Lantern Road Tours: sample website (fictional company)
(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- language ---------- */
  const langButtons = $$('.lang button');
  const STORAGE_KEY = 'lrt-lang';

  function setLang(lang) {
    root.lang = lang;
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $$('[data-ph-en]').forEach((el) => { el.placeholder = lang === 'uz' ? el.dataset.phUz : el.dataset.phEn; });
    document.title = lang === 'uz'
      ? 'Lantern Road Tours · Xivadan kichik guruhli turlar (namuna sayt)'
      : 'Lantern Road Tours · Small-group tours from Khiva (sample website)';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    const msg = $('#form-msg');
    if (msg) { msg.textContent = ''; msg.className = 'form-msg'; }
  }

  langButtons.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === root.lang) return;
    setLang(b.dataset.lang);
    root.classList.remove('lang-fade');
    void root.offsetWidth; // restart the fade
    root.classList.add('lang-fade');
    setTimeout(() => root.classList.remove('lang-fade'), 550);
    requestUpdate();
  }));
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  setLang(saved === 'uz' ? 'uz' : 'en');

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const nav = $('#main-nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- split headings into words (each word rises out of a mask) ---------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
  }
  $$('h1.split .t-en, h1.split .t-uz, .section h2 .t-en, .section h2 .t-uz, .route h2 .t-en, .route h2 .t-uz').forEach(splitWords);

  /* ---------- count-up numbers ---------- */
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const to = parseFloat(el.dataset.count);
    const from = parseFloat(el.dataset.from || '0');
    const prefix = el.dataset.prefix || '';
    if (reduceMotion || Number.isNaN(to)) { el.textContent = prefix + to; return; }
    const start = performance.now();
    const duration = 1500;
    (function tick(now) {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- intro: lantern lights up, gates open ---------- */
  const pre = $('#preloader');
  let started = false;
  function startPage() {
    if (started) return;
    started = true;
    root.classList.add('loaded');
    setTimeout(() => {
      root.classList.add('ready');
      setTimeout(() => $$('.stats dt').forEach(countUp), 1100);
    }, reduceMotion ? 0 : 450);
    setTimeout(() => { if (pre) pre.remove(); }, reduceMotion ? 0 : 1500);
  }
  if (reduceMotion) {
    startPage();
  } else {
    const minTime = new Promise((r) => setTimeout(r, 1700));
    const loaded = new Promise((r) => {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });
    Promise.all([minTime, loaded]).then(startPage);
    setTimeout(startPage, 4000); // never wait longer than 4 seconds
    if (pre) pre.addEventListener('click', startPage);
  }

  /* ---------- reveal on scroll ---------- */
  const revealTargets = [];
  function addReveal(el, i, variant) {
    el.classList.add('reveal');
    if (variant) el.classList.add(variant);
    el.style.setProperty('--d', `${(i || 0) * 120}ms`);
    revealTargets.push(el);
  }
  $$('.section .eyebrow, .route .eyebrow').forEach((el) => addReveal(el));
  $$('.section h2, .route h2').forEach((el) => { el.classList.add('words'); addReveal(el); });
  $$('.cards').forEach((group) => {
    const variant = group.closest('#tours') ? 'flip' : group.closest('#why') ? 'zoom' : null;
    [...group.children].forEach((card, i) => addReveal(card, i, variant));
  });
  $$('.days > li, .steps > li').forEach((li) => addReveal(li, [...li.parentNode.children].indexOf(li)));
  $$('.prices tbody tr').forEach((tr, i) => addReveal(tr, i));
  $$('.note, .note-light, .contact .lead, .contact-list, .route-stops, .sun-track').forEach((el) => addReveal(el));
  $$('.route-map').forEach((el) => addReveal(el, 1, 'zoom'));
  $$('.form').forEach((el) => addReveal(el, 1, 'from-right'));

  function show(el) {
    el.classList.add('in');
    const delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
    setTimeout(() => el.classList.add('revealed'), 1000 + delay);
    if (el.matches('[data-count]')) countUp(el);
    $$('[data-count]', el).forEach((n) => setTimeout(() => countUp(n), delay + 250));
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(show);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------- scroll-driven effects ---------- */
  const progress = $('.progress');
  const header = $('.site-header');
  const toTop = $('.to-top');
  const route = $('#route');
  const routeLine = $('#routeLine');
  const traveler = $('.traveler');
  const trail = $$('.trail circle');
  const stops = $$('.route-stops li');
  const cities = $$('.city');
  const itinerary = $('#itinerary');
  const days = $$('.days > li');
  const stepsWrap = $('.steps-wrap');
  const steps = $$('.steps > li');
  let routeLen = 0;

  if (routeLine) {
    routeLen = routeLine.getTotalLength();
    // where Bukhara sits along the path: measure the first curve on its own
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    probe.setAttribute('d', routeLine.getAttribute('d').split('S')[0]);
    probe.setAttribute('fill', 'none');
    routeLine.parentNode.appendChild(probe);
    const mid = (probe.getTotalLength() / routeLen).toFixed(3);
    probe.remove();
    if (stops[1]) stops[1].dataset.at = mid;
    if (cities[1]) cities[1].dataset.at = mid;
    routeLine.style.strokeDasharray = String(routeLen);
    routeLine.style.strokeDashoffset = String(routeLen);
  }

  let ticking = false;
  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    progress.style.setProperty('--p', (maxScroll > 0 ? y / maxScroll : 0).toFixed(4));
    header.classList.toggle('scrolled', y > 8);
    toTop.classList.toggle('show', y > vh * 0.8);

    if (route && routeLen) {
      const r = route.getBoundingClientRect();
      const travel = route.offsetHeight - vh;
      const rp = reduceMotion ? 1 : clamp(-r.top / (travel || 1), 0, 1);
      routeLine.style.strokeDashoffset = String(routeLen * (1 - rp));
      const pt = routeLine.getPointAtLength(routeLen * rp);
      traveler.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      trail.forEach((c, i) => {
        const q = routeLine.getPointAtLength(Math.max(0, routeLen * rp - (i + 1) * 10));
        c.setAttribute('cx', q.x.toFixed(1));
        c.setAttribute('cy', q.y.toFixed(1));
        c.style.display = rp > 0.01 ? '' : 'none';
      });
      let current = 0;
      stops.forEach((li, i) => {
        const on = rp >= parseFloat(li.dataset.at) - 0.03;
        li.classList.toggle('active', on);
        if (on) current = i;
      });
      stops.forEach((li, i) => li.classList.toggle('current', i === current));
      cities.forEach((c) => c.classList.toggle('active', rp >= parseFloat(c.dataset.at) - 0.03));
    }

    if (itinerary) {
      const r = itinerary.getBoundingClientRect();
      // the sun starts when the section's top reaches 60% of the screen and arrives when its bottom does
      const sp = reduceMotion ? 1 : clamp((vh * 0.6 - r.top) / r.height, 0, 1);
      itinerary.style.setProperty('--sp', sp.toFixed(3));
      days.forEach((d, i) => d.classList.toggle('lit', sp >= (i * 2 + 1) / 6 - 0.08));
    }

    if (stepsWrap) {
      const r = stepsWrap.getBoundingClientRect();
      const lp = reduceMotion ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25), 0, 1);
      stepsWrap.style.setProperty('--lp', lp.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle('lit', lp >= (i + 0.5) / steps.length));
    }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- buttons: click ripple ---------- */
  $$('.btn').forEach((b) => b.addEventListener('click', (e) => {
    if (reduceMotion) return;
    const r = b.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${(e.clientX || r.left + r.width / 2) - r.left - size / 2}px`;
    dot.style.top = `${(e.clientY || r.top + r.height / 2) - r.top - size / 2}px`;
    b.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  }));

  /* ---------- desktop pointer effects: cursor, magnetic buttons, 3D cards ---------- */
  let targetMX = 0;
  let targetMY = 0;
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      targetMX = e.clientX / window.innerWidth - 0.5;
      targetMY = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  if (finePointer && !reduceMotion) {
    root.classList.add('has-cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    (function follow() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
      requestAnimationFrame(follow);
    })();
    const hot = 'a, button, .card, input, textarea, .hero';
    document.addEventListener('pointerover', (e) => { if (e.target.closest(hot)) ring.classList.add('big'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest(hot)) ring.classList.remove('big'); });
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });

    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });

    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        if (!card.classList.contains('revealed')) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 10).toFixed(2)}deg) rotateY(${((px - 0.5) * 12).toFixed(2)}deg) translateY(-6px)`;
        card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- hero sky: floating lanterns, twinkling stars, shooting stars ---------- */
  const hero = $('.hero');
  const canvas = $('.hero-canvas');
  const layers = $$('.skyline .layer');
  if (hero && canvas && canvas.getContext && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let curMX = 0;
    let curMY = 0;

    function makeSprite(size) {
      const s = Math.ceil(size * 5);
      const c = document.createElement('canvas');
      c.width = c.height = Math.ceil(s * DPR);
      const g = c.getContext('2d');
      g.scale(DPR, DPR);
      const cx = s / 2;
      const cy = s / 2;
      const glow = g.createRadialGradient(cx, cy, 0, cx, cy, s / 2);
      glow.addColorStop(0, 'rgba(255, 210, 140, .55)');
      glow.addColorStop(0.3, 'rgba(245, 165, 85, .22)');
      glow.addColorStop(1, 'rgba(245, 165, 85, 0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, s, s);
      const w = size;
      const h = size * 1.25;
      const top = cy - h / 2;
      const body = g.createLinearGradient(0, top, 0, top + h);
      body.addColorStop(0, '#FFD995');
      body.addColorStop(0.55, '#F09A4E');
      body.addColorStop(1, '#C0582A');
      g.fillStyle = body;
      g.beginPath();
      g.moveTo(cx - w / 2, top + h * 0.15);
      g.quadraticCurveTo(cx - w / 2, top, cx, top);
      g.quadraticCurveTo(cx + w / 2, top, cx + w / 2, top + h * 0.15);
      g.lineTo(cx + w * 0.36, top + h);
      g.lineTo(cx - w * 0.36, top + h);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255, 246, 220, .95)';
      g.beginPath();
      g.ellipse(cx, top + h * 0.86, w * 0.2, h * 0.08, 0, 0, Math.PI * 2);
      g.fill();
      return { c, s };
    }
    const sprites = [9, 13, 17, 22].map(makeSprite);
    const lanterns = [];
    const stars = [];
    const shooting = [];
    const BASE = window.innerWidth < 700 ? 18 : 34;

    function resize() {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function spawn(x, y, boost) {
      const k = Math.floor(Math.random() * sprites.length);
      const depth = (k + 1) / sprites.length;
      lanterns.push({
        x, y, k, depth,
        vy: (0.22 + Math.random() * 0.3) * (0.55 + depth) * (boost || 1),
        amp: 6 + Math.random() * 16,
        ph: Math.random() * 6.28,
        a: 0.5 + depth * 0.5,
        fl: Math.random() * 6.28,
      });
    }
    resize();
    for (let i = 0; i < BASE; i++) spawn(Math.random() * W, Math.random() * H * 1.1);
    for (let i = 0; i < 80; i++) stars.push({ x: Math.random(), y: Math.random() * 0.65, r: Math.random() * 1.2 + 0.3, ph: Math.random() * 6.28 });

    let visible = true;
    let running = false;
    let last = performance.now();
    let nextShoot = last + 2200;

    function frame(now) {
      if (!visible || document.hidden) { running = false; return; }
      const dt = Math.min(50, now - last) / 16.67;
      last = now;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#F6F0E6';
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(now * 0.002 + s.ph));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, 6.283);
        ctx.fill();
      }

      if (now > nextShoot) {
        shooting.push({ x: W * (0.35 + Math.random() * 0.6), y: H * Math.random() * 0.3, vx: -(7 + Math.random() * 4), vy: 2.4 + Math.random() * 1.6, life: 1 });
        nextShoot = now + 3200 + Math.random() * 4800;
      }
      ctx.lineWidth = 1.8;
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= 0.017 * dt;
        if (s.life <= 0) { shooting.splice(i, 1); continue; }
        const tx = s.x - s.vx * 12;
        const ty = s.y - s.vy * 12;
        const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      curMX = lerp(curMX, targetMX, 0.05);
      curMY = lerp(curMY, targetMY, 0.05);
      for (let i = lanterns.length - 1; i >= 0; i--) {
        const l = lanterns[i];
        l.y -= l.vy * dt;
        if (l.y < -70) {
          if (lanterns.length > BASE) { lanterns.splice(i, 1); continue; }
          l.y = H + 50; l.x = Math.random() * W;
        }
        const sp = sprites[l.k];
        const x = l.x + Math.sin(now * 0.0006 * (1 + l.depth) + l.ph) * l.amp + curMX * 50 * l.depth;
        const yy = l.y + curMY * 24 * l.depth;
        ctx.globalAlpha = l.a * (0.85 + 0.15 * Math.sin(now * 0.006 + l.fl));
        ctx.drawImage(sp.c, x - sp.s / 2, yy - sp.s / 2, sp.s, sp.s);
      }
      ctx.globalAlpha = 1;

      const sy = Math.min(window.scrollY, 800);
      layers.forEach((g) => {
        const d = parseFloat(g.dataset.depth);
        g.style.transform = `translate(${(curMX * d * 28).toFixed(2)}px, ${(curMY * d * 14 + sy * (1 - d) * 0.35).toFixed(2)}px)`;
      });
      requestAnimationFrame(frame);
    }
    function run() {
      if (!running && visible && !document.hidden) {
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run(); }).observe(hero);
    document.addEventListener('visibilitychange', run);
    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });

    // click the sky to release lanterns
    hero.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const r = hero.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        spawn(e.clientX - r.left + (Math.random() - 0.5) * 36, e.clientY - r.top + Math.random() * 24, 2.4);
      }
      if (lanterns.length > 140) lanterns.splice(0, lanterns.length - 140);
    });
    run();
  }

  /* ---------- demo form: a lantern carries the message away (nothing is sent) ---------- */
  const form = $('#trip-form');
  const msg = $('#form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const uz = root.lang === 'uz';
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      msg.textContent = uz ? 'Iltimos, ismingiz va to‘g‘ri email manzilini yozing.' : 'Please add your name and a valid email address.';
      msg.className = 'form-msg';
      void msg.offsetWidth;
      msg.className = 'form-msg err';
      return;
    }
    if (!reduceMotion) {
      const btn = $('button[type="submit"]', form);
      const fr = form.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      for (let i = 0; i < 3; i++) {
        const l = document.createElement('span');
        l.className = 'send-lantern';
        l.style.left = `${br.left - fr.left + br.width / 2 - 11 + (i - 1) * 26}px`;
        l.style.top = `${br.top - fr.top - 10}px`;
        l.style.animationDelay = `${i * 0.25}s`;
        form.appendChild(l);
        setTimeout(() => l.remove(), 3400 + i * 250);
      }
    }
    msg.textContent = uz
      ? `Rahmat, ${name}! Bu namuna sayt, shuning uchun xabar hech qayerga yuborilmadi.`
      : `Thank you, ${name}! This is a sample website, so your message was not sent anywhere.`;
    msg.className = 'form-msg ok';
    form.reset();
  });
})();
