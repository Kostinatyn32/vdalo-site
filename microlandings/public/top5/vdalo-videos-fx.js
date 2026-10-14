/* VDALO · 10 відео «факапи» (f-*): жорсткі болі з візуальними ефектами: глітч, тріщини, сирена,
   дощ і сльози, вода, вибух сповіщень, доміно, батарейка, черга: і як VDALO це прибирає.
   Підключати ПІСЛЯ vdalo-videos.js і vdalo-videos-more.js. */
(() => {
  'use strict';
  const V = window.VDALOVideo;
  if (!V || !V.kit || !V.kit.types) return;
  const { cl, pr, eo, eio, h, ICON: I, types: T, reg } = V.kit;
  const NS = 'http://www.w3.org/2000/svg';
  const rnd = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const inWin = (t, wins) => (wins || []).some(([x, y]) => t >= x && t <= y);
  const lerpKeys = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * eio(pr(t, keys[i - 1][0], keys[i][0]));
    return keys[keys.length - 1][1];
  };
  const svgEl = (w, hgt, inner, style = '') => h(`<svg xmlns="${NS}" viewBox="0 0 ${w} ${hgt}" style="position:absolute;${style}" aria-hidden="true">${inner}</svg>`);

  // ---------- effects ----------
  // glitch: any html; RGB split + jitter + slices inside time windows e.gl
  T.glitch = e => {
    const el = h(`<div style="position:absolute;${e.pos || 'inset:0'}">${e.html}</div>`);
    return { el, sub: t => {
      if (inWin(t, e.gl)) {
        const k = Math.floor(t * 22), s = 2 + rnd(k) * 6, dx = (rnd(k + 1) - .5) * 14;
        const y1 = Math.floor(rnd(k + 2) * 80), y2 = Math.min(100, y1 + 8 + Math.floor(rnd(k + 3) * 30));
        el.style.filter = `drop-shadow(${s}px 0 0 rgba(255,40,90,.85)) drop-shadow(${-s}px 0 0 rgba(0,220,255,.8))`;
        el.style.translate = `${dx.toFixed(1)}px 0`;
        el.style.clipPath = rnd(k + 4) > .45 ? `polygon(0 0,100% 0,100% ${y1}%,${(rnd(k + 5) * 10).toFixed(0)}% ${y1}%,${(rnd(k + 5) * 10).toFixed(0)}% ${y2}%,100% ${y2}%,100% 100%,0 100%)` : '';
      } else { el.style.filter = ''; el.style.translate = ''; el.style.clipPath = ''; }
    } };
  };
  // crack: glass cracks spreading from (cx, cy)
  T.crack = (e, a) => {
    const cx = e.cx ?? 180, cy = e.cy ?? 320;
    let paths = '';
    for (let i = 0; i < 11; i++) {
      let x = cx, y = cy, d = `M${cx} ${cy}`;
      const ang0 = i / 11 * Math.PI * 2 + rnd(i) * .4;
      for (let j = 0; j < 5; j++) { const ang = ang0 + (rnd(i * 9 + j) - .5) * .7, len = 30 + rnd(i * 7 + j) * 60; x += Math.cos(ang) * len; y += Math.sin(ang) * len; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
      paths += `<path d="${d}" pathLength="1"/>`;
    }
    for (let r = 1; r <= 2; r++) paths += `<circle cx="${cx}" cy="${cy}" r="${r * 26}" pathLength="1"/>`;
    const el = svgEl(360, 640, `<g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.6" stroke-linejoin="round" style="filter:drop-shadow(0 0 2px rgba(255,255,255,.6))">${paths}</g>`, 'inset:0;width:360px;height:640px');
    const ps = el.querySelectorAll('path,circle');
    ps.forEach(p => { p.setAttribute('stroke-dasharray', '1 1'); });
    return { el, sub: t => { const k = eo(pr(t, a, a + .45)); ps.forEach((p, i) => p.setAttribute('stroke-dashoffset', (1 - cl(k * 1.3 - i * .02)).toFixed(3))); } };
  };
  // siren: rotating red beams + pulse
  T.siren = (e, a) => {
    const el = h('<div style="position:absolute;inset:0;pointer-events:none;overflow:hidden"><i style="position:absolute;left:-180px;top:-260px;width:720px;height:720px;border-radius:50%;background:conic-gradient(from 0deg,rgba(255,40,70,.42) 0 28deg,transparent 28deg 180deg,rgba(255,40,70,.42) 180deg 208deg,transparent 208deg)"></i><b style="position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 0%,rgba(255,30,60,.55),transparent 70%)"></b></div>');
    const [beam, glow] = el.children;
    return { el, sub: t => { beam.style.transform = `rotate(${((t - a) * 260).toFixed(1)}deg)`; glow.style.opacity = (.35 + .65 * (.5 + .5 * Math.sin(t * 12))).toFixed(3); } };
  };
  // rain: falling streaks
  T.rain = () => {
    let lines = '';
    for (let i = 0; i < 46; i++) lines += `<line x1="0" y1="0" x2="-4" y2="${14 + rnd(i) * 14}" data-x="${(rnd(i + 50) * 400).toFixed(1)}" data-y="${(rnd(i + 99) * 700).toFixed(1)}" data-v="${(380 + rnd(i + 7) * 260).toFixed(0)}"/>`;
    const el = svgEl(360, 640, `<g stroke="rgba(190,210,255,.42)" stroke-width="1.4" stroke-linecap="round">${lines}</g>`, 'inset:0;width:360px;height:640px;pointer-events:none');
    const ls = [...el.querySelectorAll('line')];
    return { el, sub: t => ls.forEach(l => { const y = (+l.dataset.y + t * +l.dataset.v) % 700 - 40, x = +l.dataset.x - y * .08; l.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); }) };
  };
  // face: sad (with tears) or happy
  T.face = e => {
    const s = e.size || 90, sad = e.mood !== 'happy';
    const mouth = sad ? '<path d="M32 70 Q50 56 68 70" stroke="#5A2C1A" stroke-width="5" fill="none" stroke-linecap="round"/>' : '<path d="M30 60 Q50 80 70 60" stroke="#5A2C1A" stroke-width="5" fill="none" stroke-linecap="round"/>';
    const brows = sad ? '<path d="M24 38 L40 31 M76 38 L60 31" stroke="#5A2C1A" stroke-width="4" stroke-linecap="round"/>' : '';
    const tears = sad ? [0, 1, 2, 3].map(i => `<path class="tr" data-i="${i}" d="M0 0 C-6 9 -7 14 0 18 C7 14 6 9 0 0Z" fill="#7CC7FF"/>`).join('') : '';
    const el = svgEl(100, 160, `<circle cx="50" cy="50" r="44" fill="#FFD27A"/>${brows}<ellipse cx="36" cy="46" rx="5" ry="${sad ? 4 : 6}" fill="#5A2C1A"/><ellipse cx="64" cy="46" rx="5" ry="${sad ? 4 : 6}" fill="#5A2C1A"/>${mouth}${tears}`, `${e.pos || ''};width:${s}px;height:${s * 1.6}px`);
    const ts = [...el.querySelectorAll('.tr')];
    return { el, sub: t => ts.forEach(p => { const i = +p.dataset.i, ph = ((t * 1.1 + i * .5) % 2) / 2, x = i % 2 ? 66 : 34, y = 54 + ph * 100; p.setAttribute('transform', `translate(${x} ${y.toFixed(1)}) scale(${(1 + ph * .4).toFixed(2)})`); p.setAttribute('opacity', (1 - ph).toFixed(2)); }) };
  };
  // water level rising (keys: [[t, px], ...])
  T.water = e => {
    const el = h(`<div style="position:absolute;left:0;right:0;bottom:0;height:0;pointer-events:none">
        <svg viewBox="0 0 720 30" preserveAspectRatio="none" style="position:absolute;left:0;top:-18px;width:720px;height:20px"><path d="M0 15 Q45 0 90 15 T180 15 T270 15 T360 15 T450 15 T540 15 T630 15 T720 15 V30 H0Z" fill="rgba(80,150,230,.62)"/></svg>
        <i style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(80,150,230,.62),rgba(40,80,170,.8))"></i></div>`);
    const wave = el.querySelector('svg');
    return { el, sub: t => { el.style.height = `${lerpKeys(t, e.lv).toFixed(1)}px`; wave.style.transform = `translateX(${(-((t * 60) % 180)).toFixed(1)}px)`; } };
  };
  // burst: chips flying out of (cx, cy)
  T.burst = (e, a) => {
    const el = h('<div style="position:absolute;inset:0;pointer-events:none"></div>');
    const items = e.items.map((txt, i) => {
      const c = h(`<span class="vdv-chip bad" style="top:0;left:0">${txt}</span>`); el.append(c);
      return { c, ang: rnd(i + 3) * Math.PI * 2, sp: 90 + rnd(i + 11) * 170, d: i * .09, rot: (rnd(i + 21) - .5) * 70 };
    });
    return { el, sub: t => items.forEach(({ c, ang, sp, d, rot }) => {
      const k = pr(t, a + d, a + d + 1.6), back = e.back ? eio(pr(t, e.back, e.back + .8)) : 0;
      const dist = sp * eo(k) * (1 - back);
      c.style.opacity = (Math.min(1, k * 4) * (1 - back)).toFixed(3);
      c.style.transform = `translate(${(e.cx - 50 + Math.cos(ang) * dist).toFixed(1)}px,${(e.cy - 15 + Math.sin(ang) * dist).toFixed(1)}px) rotate(${(rot * k).toFixed(1)}deg)`;
    }) };
  };
  // battery level (keys)
  T.battery = e => {
    const el = h(`<div style="position:absolute;${e.pos || ''}"><div style="position:relative;width:200px;height:96px;border:6px solid currentColor;border-radius:18px;padding:6px">
        <i style="display:block;height:100%;border-radius:9px"></i><b style="position:absolute;right:-20px;top:28px;width:12px;height:28px;border-radius:0 6px 6px 0;background:currentColor"></b></div>
        <span style="display:block;text-align:center;margin-top:10px;font:800 34px var(--vd-display);font-variant-numeric:tabular-nums"></span></div>`);
    const bar = el.querySelector('i'), lab = el.querySelector('span');
    return { el, sub: t => {
      const v = lerpKeys(t, e.keys);
      bar.style.width = `${v.toFixed(1)}%`;
      bar.style.background = v < 20 ? '#E8566D' : v < 50 ? '#FFB347' : '#5CC898';
      lab.textContent = `${Math.round(v)}%`; lab.style.color = bar.style.background;
    } };
  };
  // person figure
  T.person = e => {
    const c = e.color || '#C9B3D3';
    const el = svgEl(40, 90, `<circle cx="20" cy="13" r="11" fill="${c}"/><rect x="6" y="28" width="28" height="44" rx="12" fill="${c}"/>${e.bag ? '<rect x="30" y="56" width="10" height="16" rx="3" fill="#FF92BD"/>' : ''}${e.mark ? `<text x="20" y="-4" text-anchor="middle" font-size="16" font-weight="800" fill="${e.markColor || '#FF8C9E'}">${e.mark}</text>` : ''}`, `${e.pos || ''};width:${e.w || 36}px;height:${(e.w || 36) * 2.25}px;overflow:visible`);
    return { el };
  };

  // ---------- shared bits ----------
  const sheet = `<div class="vdv-box" style="left:24px;right:24px;top:132px;padding:10px;display:grid;gap:4px;background:#F6F8F4;border-color:#cfd8cc;color:#1F3A2A;font:500 11px/1 'Courier New',monospace">
      ${[['A', 'B', 'C', 'D'], ['302', 'Іван', 'пт–нд', '3600'], ['105', 'Олена', 'сб', '1200'], ['201', 'Booking', 'пт–сб', '2400'], ['303', 'Airbnb', 'нд–вт', '4800'], ['104', '?', 'пт', ':'], ['202', 'Марко', 'сб–нд', '2400']]
        .map((r, i) => `<div style="display:grid;grid-template-columns:44px 1fr 1fr 60px;gap:4px">${r.map(c => `<span style="padding:6px 5px;background:${i ? '#fff' : '#DDE7D8'};border:1px solid #d5ddd2">${c}</span>`).join('')}</div>`).join('')}</div>`;
  const board = top => `<div class="vdv-box" style="left:24px;right:24px;top:${top}px;padding:12px;display:grid;gap:7px;background:#1B0F20;border-color:rgba(255,245,247,.14);color:#FFF5F7">
      ${[['101', 0, 2, '#C76A96', 'Сайт'], ['105', 1, 3, '#2F6FDB', 'Booking'], ['201', 0, 1, '#FF5A5F', 'Airbnb'], ['302', 0, 2, '#2F6FDB', 'Booking'], ['303', 2, 2, '#FF5A5F', 'Airbnb']].map(([n, f, l, c, lab]) => `<div style="display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center;font:700 12px var(--vd-body)"><span>${n}</span><span style="position:relative;height:24px;border-radius:6px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 calc(25% - 2px),transparent calc(25% - 2px) 25%)"><i style="position:absolute;top:3px;bottom:3px;left:${f * 25}%;width:calc(${l * 25}% - 3px);border-radius:6px;background:${c};font:700 10px/18px var(--vd-display);color:#fff;padding-left:6px;font-style:normal">${lab}</i></span></div>`).join('')}</div>`;
  const door = (left, top, open, label = '203') => `<div style="position:absolute;left:${left}px;top:${top}px;width:120px;height:200px;border-radius:10px 10px 0 0;background:#2A1A30;border:5px solid #4F3657;box-shadow:0 20px 40px rgba(0,0,0,.4)">
      <div style="position:absolute;inset:8px;border-radius:6px;background:${open ? 'linear-gradient(180deg,#FFE6AE,#F3C77A)' : '#3A2440'};${open ? 'transform:perspective(300px) rotateY(-38deg);transform-origin:left;box-shadow:inset -10px 0 20px rgba(0,0,0,.25)' : ''}"></div>
      <span style="position:absolute;left:0;right:0;top:-30px;text-align:center;font:800 15px var(--vd-display);color:var(--pink-l)">${label}</span>
      <i style="position:absolute;right:-26px;top:84px;width:18px;height:30px;border-radius:5px;background:#140A17;border:2px solid #4F3657"><b style="display:block;margin:5px auto 0;width:7px;height:7px;border-radius:50%;background:${open ? '#5CC898' : '#E8566D'};box-shadow:0 0 8px ${open ? '#5CC898' : '#E8566D'}"></b></i></div>`;
  const foot = (txt, at) => ({ type: 'html', at, anim: 'fade', html: `<div class="vdv-foot" style="bottom:22px">${txt}</div>` });

  // =====================================================================
  reg('f-excel', {
    title: 'Факап: Excel з бронюваннями зламався', group: 'fail', pain: 'Файл з бронюваннями пошкоджено: сезон зник', theme: 'ink',
    quake: [[3.0, 3.7, 7]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Усі бронювання сезону :', top: 56, size: 26, at: .1 },
        { type: 'big', html: 'в одному Excel.', top: 88, size: 34, at: .5, anim: 'slam' },
        { type: 'glitch', html: sheet, gl: [[2.2, 2.5], [2.8, 3.6], [4.4, 4.6], [5.6, 5.8]], at: .9, anim: 'up' },
        { type: 'flash', at: 3.0 },
        { type: 'html', at: 3.1, anim: 'pop', html: `<div style="position:absolute;left:38px;right:38px;top:226px;background:#F0F0F0;color:#222;border-radius:8px;box-shadow:0 20px 50px rgba(0,0,0,.6);font:13px/1.35 Arial,sans-serif;overflow:hidden">
            <div style="background:#D83B3B;color:#fff;padding:7px 10px;font-weight:700">Помилка</div>
            <div style="display:flex;gap:10px;padding:12px"><b style="flex:none;width:30px;height:30px;border-radius:50%;background:#D83B3B;color:#fff;display:grid;place-items:center">✕</b><span>Файл «Бронювання_2026.xlsx» пошкоджено. Відновити не вдалося.</span></div></div>` },
        { type: 'glitch', html: '<p class="vdv-big" style="position:static;font-size:34px"><em class="r">Сезон: зник.</em></p>', gl: [[3.9, 4.3], [5.2, 5.4]], at: 3.8, anim: 'slam', pos: 'left:24px;right:24px;top:398px' },
        { type: 'chip', html: 'хто заїжджає завтра?', top: 470, at: 4.8, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'хто вже заплатив?', top: 518, at: 5.3, cls: 'bad', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO бронювання <em>не зникають</em>', size: 30 },
        { type: 'html', at: 7.4, anim: 'up', html: board(150) },
        { type: 'chip', html: 'система, а не файл на ноутбуці', top: 352, at: 8.8, cls: 'pk', pos: 'left:24px' },
        { type: 'chip', html: 'видно з будь-якого телефона', top: 400, at: 9.3, cls: 'pk', pos: 'left:24px' }
      ] }
    ]
  });

  reg('f-tears', {
    title: 'Факап: гість плаче під зачиненими дверима', group: 'fail', pain: 'Нічний заїзд: рецепція зачинена, гість під дощем', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'rain', at: 0, out: 6.9, anim: 'fade' },
        { type: 'chip', html: '02:10 · дощ', top: 54, at: 0, anim: 'fade', pos: 'left:24px' },
        { type: 'big', html: 'Сім\'я з дитиною.', top: 96, size: 32, at: .2 },
        { type: 'big', html: '<em class="r">Двері зачинені.</em>', top: 134, size: 36, at: .8, anim: 'slam' },
        { type: 'html', at: 1.2, anim: 'up', html: door(160, 236, false, 'Рецепція') },
        { type: 'face', mood: 'sad', size: 92, at: 1.8, anim: 'pop', pos: 'left:46px;top:296px' },
        { type: 'html', at: 3.6, anim: 'pop', shake: [3.8, 6.4], shakeA: 3, html: '<div class="vdv-chip bad" style="top:470px;left:24px">☎ 5 пропущених вам</div>' },
        { type: 'big', html: 'А ви спите й не чуєте телефон.', top: 520, size: 22, at: 4.4 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Інструкція для заїзду <em>під рукою</em>', size: 29 },
        { type: 'bub', side: 'r', html: '<small>Сторінка гостя</small>Ваш номер 203. Заїзд з 14:00. Інструкція, як зайти, тут.', top: 150, at: 7.4 },
        { type: 'html', at: 8.2, anim: 'up', html: door(160, 270, true, '203') },
        { type: 'face', mood: 'happy', size: 92, at: 8.6, anim: 'pop', pos: 'left:46px;top:316px' },
        { type: 'chip', html: 'посилання з інструкцією надіслано', top: 512, at: 9.6, cls: 'ok', pos: 'left:24px' },
        foot('PIN-заселення: з розумним замком.', 7.4)
      ] }
    ]
  });

  reg('f-twoguests', {
    title: 'Факап: двоє гостей, один номер', group: 'fail', pain: 'Номер продано двічі: двоє гостей під одними дверима', theme: 'ink',
    quake: [[3.3, 4.0, 8]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Двоє гостей.', top: 58, size: 40, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Один номер.</em>', top: 104, size: 40, at: .7, anim: 'slam' },
        { type: 'html', at: .9, anim: 'fade', html: door(120, 236, false, '302') },
        { type: 'person', color: '#7FA8F0', bag: true, mark: 'B', markColor: '#7FA8F0', w: 40, at: 1.2, anim: 'left', pos: 'left:44px;top:330px' },
        { type: 'person', color: '#F08C93', bag: true, mark: 'A', markColor: '#FF8C9E', w: 40, at: 1.6, anim: 'right', pos: 'left:276px;top:330px' },
        { type: 'chip', html: 'Booking · оплачено', top: 438, at: 2.2, pos: 'left:16px' },
        { type: 'chip', html: 'Airbnb · оплачено', top: 438, at: 2.5, pos: 'left:198px' },
        { type: 'crack', cx: 180, cy: 330, at: 3.3, anim: 'none', out: 6.8 },
        { type: 'flash', at: 3.3 },
        { type: 'stamp', html: 'Обидва заплатили', top: 498, at: 3.6, pos: 'left:52px', rot: -6 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А з VDALO 302 <em>продається один раз</em>', size: 29 },
        { type: 'card', icc: 'b', ic: 'B', t: 'Booking · 302 · пт–нд', s: 'нове бронювання', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: I.check, t: 'Доступність в Airbnb', s: 'оновлюється після підключення', top: 228, at: 8.3, check: 8.8 },
        { type: 'card', icc: 'p', ic: I.check, t: 'Доступність на сайті', s: 'залежить від інтеграції', top: 286, at: 9.0, check: 9.5 },
        { type: 'big', html: 'Один номер: <em>один гість.</em>', top: 380, size: 32, at: 9.9 }
      ] }
    ]
  });

  reg('f-siren', {
    title: 'Передплата: статус у бронюванні', group: 'fail', pain: 'Не завжди зрозуміло, чи надійшла передплата', theme: 'red',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Передплату внесли?', top: 70, size: 38, at: .1, anim: 'slam', cls: 'c' },
        { type: 'big', html: '<em class="r">Статус треба уточнювати.</em>', top: 132, size: 30, at: .7, cls: 'c' },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Бронювання · номер 203', s: 'Сума бронювання: 4 800 грн', top: 236, at: 1.5, check: 2.0 },
        { type: 'chip', html: 'Передплата: уточнити', top: 336, at: 2.6, cls: 'bad', pos: 'left:40px' },
        { type: 'chip', html: 'Залишок: уточнити', top: 384, at: 3.0, cls: 'bad', pos: 'left:40px' },
        foot('Сценарій демонстраційний. Фіксуйте фактичні суми та статуси бронювання.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Статус передплати <em>в картці бронювання</em>', size: 30 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Внесена сума', s: 'зафіксована в бронюванні', top: 166, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Залишок до сплати', s: 'видно команді об’єкта', top: 224, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Спосіб оплати', s: 'узгоджуєте з гостем окремо', top: 282, at: 8.8, check: 9.3 },
        { type: 'stamp', html: 'Суми зафіксовано', cls: 'ok', top: 380, at: 9.8, pos: 'left:76px', rot: -5 }
      ] }
    ]
  });

  const TILES = [['Дзвінок', 'без відповіді'], ['Гість', 'чекає'], ['Бронь', 'під питанням'], ['Заїзд', 'потребує уваги'], ['Команда', 'уточнює']];
  reg('f-domino', {
    title: 'Факап: ефект доміно', group: 'fail', pain: 'Один пропущений дзвінок тягне за собою втрату бронювання', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Один пропущений дзвінок.', top: 60, size: 30, at: .1, anim: 'slam' },
        ...TILES.map(([a1, a2], i) => ({ type: 'html', at: .6 + i * .15, anim: 'up', spin: [2.2 + i * .45, 2.6 + i * .45, 72], html: `<div style="position:absolute;left:${22 + i * 64}px;top:220px;width:56px;height:170px;border-radius:10px;background:${i === 4 ? 'var(--bad)' : '#F4ECF6'};color:${i === 4 ? '#fff' : '#39233E'};display:grid;align-content:center;justify-items:center;gap:4px;font:800 12px/1.1 var(--vd-display);text-align:center;box-shadow:6px 8px 0 rgba(0,0,0,.35);transform-origin:100% 100%"><span>${a1}</span><span style="font-weight:600;font-size:10.5px">${a2}</span></div>` })),
        { type: 'html', at: .5, anim: 'fade', html: '<div style="position:absolute;left:14px;right:14px;top:392px;height:4px;border-radius:2px;background:rgba(255,255,255,.2)"></div>' },
        { type: 'big', html: '<em class="r">І це тільки одна ніч.</em>', top: 460, size: 30, at: 4.8 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Підготуйте <em>відповіді заздалегідь</em>', size: 30 },
        { type: 'bub', html: 'Є вільний номер на завтра?', top: 170, at: 7.4 },
        { type: 'bub', side: 'r', html: '<small>Сторінка гостя</small>Додайте інформацію про вільні номери та надішліть посилання.', top: 216, at: 8.1 },
        { type: 'card', icc: 'p', ic: 'V', t: 'Гість переглянув умови', s: 'запит можна продовжити в повідомленні', top: 322, at: 9.0, check: 9.5 },
        { type: 'big', html: 'Частину відповідей <em>можна підготувати наперед.</em>', top: 404, size: 26, at: 10.0 }
      ] }
    ]
  });

  reg('f-explode', {
    title: 'Факап: телефон вибухає від повідомлень', group: 'fail', pain: 'Сотні повідомлень за вечір з усіх каналів', theme: 'ink',
    quake: [[1.6, 5.6, 4]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Телефон', top: 58, size: 42, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">не витримує.</em>', top: 104, size: 42, at: .6, anim: 'slam' },
        { type: 'html', at: .8, anim: 'pop', shake: [1.4, 6.4], shakeA: 2.5, html: `<div class="vdv-mphone" style="left:130px;top:250px;width:100px;height:180px"><div class="isl"></div><div class="in" style="place-content:center;justify-items:center">
            <b style="font:800 30px var(--vd-display);color:#FF8C9E">1%</b><span style="font-size:10px;color:rgba(255,245,247,.6)">батарея</span></div></div>` },
        { type: 'burst', cx: 180, cy: 330, at: 1.4, out: 6.8, anim: 'none', items: ['Booking', 'Airbnb', 'Viber', 'Дзвінок', 'Telegram', 'Гість 104', 'Покоївка', 'Адмін', 'SMS', 'Пошта', 'Wi‑Fi?', 'Паркінг?', 'Ключ?', 'Оплата?', 'Сніданок?', 'Таксі?'] },
        { type: 'num', from: 0, to: 147, n1: 1.4, n2: 5.4, top: 480, at: 1.4, cls: 'c r', label: 'повідомлень за вечір · умовно', fmt: n => Math.round(n), pos: 'font-size:inherit' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Робочі дані та задачі <em>в одному місці</em>', size: 31 },
        { type: 'card', icc: 'b', ic: 'B', t: 'Бронювання: 12', s: 'статуси в підключених каналах', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: I.chat, t: 'Інформація для гостей', s: 'зібрана на сторінці об’єкта', top: 228, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'n', ic: I.broom, t: 'Задачі команді: 6', s: 'у покоївки й техніка', top: 286, at: 8.8, check: 9.3 },
        { type: 'big', html: 'Вам: <em>тільки важливе.</em>', top: 380, size: 34, at: 9.8 },
        foot('Цифри умовні.', 7.4)
      ] }
    ]
  });

  reg('f-flood', {
    title: 'Факап: потоп у номері', group: 'fail', pain: 'Поломку написали в Viber уночі: побачили зранку', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Тече кран у 105.', top: 58, size: 36, at: .1, anim: 'slam' },
        { type: 'bub', html: '<small>Покоївка · Viber · 23:10</small>Там у 105 вода на підлозі…', top: 116, at: .7 },
        { type: 'big', html: 'Ви побачили', top: 214, size: 30, at: 1.6 },
        { type: 'big', html: '<em class="r">о 9 ранку.</em>', top: 250, size: 40, at: 2.1, anim: 'slam' },
        { type: 'water', at: 2.4, anim: 'none', lv: [[2.4, 0], [6.4, 340], [7.0, 340], [8.0, 0]], out: 8.2 },
        { type: 'chip', html: '105 закрито на ремонт', top: 400, at: 4.0, cls: 'bad', pos: 'left:24px', move: [4.0, 6.6, 0, -14] },
        { type: 'chip', html: 'залило 005 знизу', top: 446, at: 4.5, cls: 'bad', pos: 'left:70px', move: [4.5, 6.6, 0, -12] },
        { type: 'chip', html: 'мінус 3 ночі продажів', top: 492, at: 5.0, cls: 'bad', pos: 'left:24px', move: [5.0, 6.6, 0, -10] }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO поломка: <em>це задача, а не повідомлення</em>', size: 26 },
        { type: 'card', icc: 'n', ic: I.broom, t: 'Задача технікові · 23:11', s: '105 · тече кран', top: 176, at: 8.2, check: 8.7 },
        { type: 'card', icc: 'x', ic: '!', t: '105 позначено «на огляді»', s: 'гостя туди не поселять', top: 234, at: 8.8, check: 9.3 },
        { type: 'card', icc: 'g', ic: I.check, t: 'Технік: виконано · 23:40', s: 'ви бачите статус у телефоні', top: 292, at: 9.4, check: 9.9 }
      ] }
    ]
  });

  reg('f-noshow', {
    title: 'Факап: гість не приїхав', group: 'fail', pain: 'No-show без передоплати: номер порожній, гроші втрачено', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Гість не приїхав.', top: 58, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Слухавку не бере.</em>', top: 100, size: 30, at: .7 },
        { type: 'html', at: 1.1, anim: 'up', html: `<div class="vdv-box" style="left:40px;right:40px;top:168px;height:190px;overflow:hidden;background:#1E1124">
            <div style="position:absolute;left:24px;right:24px;bottom:24px;height:56px;border-radius:10px;background:#5E4265"></div>
            <div style="position:absolute;left:24px;bottom:72px;width:90px;height:34px;border-radius:10px;background:#E9E1EC"></div>
            <div style="position:absolute;right:24px;top:20px;width:64px;height:64px;border-radius:50%;border:4px solid rgba(255,255,255,.35)"><i style="position:absolute;left:28px;top:8px;width:4px;height:22px;background:#fff;border-radius:2px;transform-origin:50% 100%"></i></div>
            <span style="position:absolute;left:24px;top:24px;font:700 12px var(--vd-body);color:rgba(255,245,247,.5)">203 · заброньовано</span></div>` },
        { type: 'num', from: 18 * 60, to: 26 * 60, n1: 1.4, n2: 4.6, top: 372, at: 1.4, cls: 'c', label: 'чекаєте…', fmt: m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60) % 60).padStart(2, '0')}` },
        { type: 'stamp', html: 'Статус броні · перевірити', top: 500, at: 4.9, pos: 'left:36px', rot: -5 },
        foot('Ілюстративний сценарій. Втрата бронювання та суми залежать від об’єкта.', 5)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Погоджена передплата <em>до заїзду</em>', size: 29 },
        { type: 'html', at: 7.4, anim: 'pop', html: `<div style="position:absolute;left:36px;right:36px;top:170px;padding:14px;border-radius:18px;background:#fff;color:#39233E;display:grid;gap:8px;box-shadow:0 18px 40px rgba(0,0,0,.35)">
            <b style="font:800 15px var(--vd-display)">Номер 203 · пт–сб</b><span style="font:500 12px var(--vd-body);color:#7a6a7e">Передплата: 1 000 грн</span>
            <span style="background:#FF92BD;border-radius:999px;padding:10px;text-align:center;font:700 13px var(--vd-body)">Реквізити для передплати</span></div>` },
        { type: 'card', icc: 'g', ic: I.check, t: 'Передплату зафіксовано', s: 'статус видно в бронюванні', top: 320, at: 8.8, check: 9.3 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Умови скасування', s: 'погодьте їх із гостем', top: 378, at: 9.5, check: 10.0 }
      ] }
    ]
  });

  reg('f-burnout', {
    title: 'Факап: власник на нулі', group: 'fail', pain: 'Власник вигорає: усе тримається на ньому', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: '16 годин на ногах.', top: 58, size: 36, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Сьомий день поспіль.</em>', top: 100, size: 30, at: .7 },
        { type: 'battery', keys: [[.8, 100], [5.4, 3]], at: .8, anim: 'up', pos: 'left:80px;top:190px;color:rgba(255,245,247,.8)', out: 6.8 },
        { type: 'face', mood: 'sad', size: 80, at: 4.2, anim: 'pop', pos: 'left:140px;top:360px' },
        { type: 'big', html: 'А готель: <em class="r">досі на вас.</em>', top: 520, size: 26, at: 5.0 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Менше повторів. <em>Більше порядку.</em>', size: 30 },
        { type: 'battery', keys: [[7.2, 3], [9.2, 100]], at: 7.2, anim: 'fade', pos: 'left:80px;top:150px;color:rgba(255,245,247,.8)' },
        { type: 'card', icc: 'p', ic: I.key, t: 'Інструкції до заїзду', top: 330, at: 7.8, check: 8.2 },
        { type: 'card', icc: 'p', ic: I.chat, t: 'Інструкції для гостей', top: 386, at: 8.4, check: 8.8 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Статуси передплат у бронюваннях', top: 442, at: 9.0, check: 9.4 },
        { type: 'face', mood: 'happy', size: 60, at: 9.8, anim: 'pop', pos: 'left:150px;top:500px' }
      ] }
    ]
  });

  reg('f-queue', {
    title: 'Факап: черга на заселення', group: 'fail', pain: 'Пік заїздів: черга в лобі, один адмін', theme: 'dark',
    quake: [[3.6, 5.2, 2.5]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'П\'ятниця, 15:00.', top: 58, size: 36, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Черга на заселення.</em>', top: 100, size: 32, at: .7, anim: 'slam' },
        { type: 'html', at: .9, anim: 'up', html: '<div style="position:absolute;left:24px;right:24px;top:196px;height:44px;border-radius:10px 10px 0 0;background:#5E4265"><span style="position:absolute;left:12px;top:13px;font:700 12px var(--vd-body);color:#FFE1EC">Рецепція · 1 адмін</span></div>' },
        { type: 'person', color: '#FF92BD', w: 30, at: .9, anim: 'fade', pos: 'left:290px;top:150px' },
        ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ type: 'person', color: ['#7FA8F0', '#F08C93', '#C9B3D3', '#8DD3B5', '#F0C27F', '#7FA8F0', '#C9B3D3', '#F08C93'][i], bag: true, mark: i % 3 === 0 ? '!' : '', w: 32, at: 1.4 + i * .3, anim: 'up', shake: [3.6, 5.4], shakeA: 3, pos: `left:${30 + (i % 4) * 78}px;top:${262 + Math.floor(i / 4) * 92}px` })),
        { type: 'num', from: 5, to: 40, n1: 2.0, n2: 5.8, top: 468, at: 2.0, cls: 'r', label: 'хвилин очікування · гості злі', fmt: n => `${Math.round(n)} хв` }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Гості отримують <em>інструкції до приїзду</em>', size: 29 },
        { type: 'card', icc: 'p', ic: I.key, t: 'Інформація про заїзд', s: 'посилання на сторінку гостя', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'g', ic: I.check, t: 'Менше повторних уточнень', s: 'інструкції доступні до заїзду', top: 228, at: 8.2, check: 8.7 },
        { type: 'card', icc: 'p', ic: I.broom, t: 'Адмін: на гостях, а не на ключах', top: 286, at: 9.0, check: 9.5 },
        foot('PIN-заселення: з розумним замком.', 7.4)
      ] }
    ]
  });
})();
