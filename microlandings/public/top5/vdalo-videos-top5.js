/* VDALO · 10 відео під ТОП-5 болів (t-*), по 2 різні формати на біль.
   1 документи й туристичний збір · 2 бронювання з Booking вручну · 3 гість чекає без адміністратора
   4 овербукінг через несинхронізовані бронювання · 5 нічні однакові питання.
   Підключати ПІСЛЯ vdalo-videos.js, vdalo-videos-more.js і vdalo-videos-fx.js. */
(() => {
  'use strict';
  const V = window.VDALOVideo;
  if (!V || !V.kit || !V.kit.types || !V.kit.types.person) return;
  const { cl, pr, eo, eio, h, ICON: I, types: T, reg } = V.kit;
  const rnd = k => { const x = Math.sin(k * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
  const pad = n => String(Math.floor(n)).padStart(2, '0');
  const foot = (txt, at) => ({ type: 'html', at, anim: 'fade', html: `<div class="vdv-foot" style="bottom:22px">${txt}</div>` });

  // ---------- new effects ----------
  // papers: sheets fall from the top and pile up at the bottom
  T.papers = (e, a) => {
    const el = h('<div style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>');
    const n = e.n || 22, lab = ['ЧЕК', 'ЗБІР', 'АКТ', 'ЗВІТ', 'КАСА', 'ЧЕК'];
    const ps = Array.from({ length: n }, (_, i) => {
      const p = h(`<div style="position:absolute;left:0;top:0;width:74px;height:94px;border-radius:4px;background:#FBF8F1;box-shadow:0 6px 14px rgba(0,0,0,.35);padding:8px 7px;display:grid;gap:5px;align-content:start">
          <b style="font:800 9px var(--vd-display);color:#C2457A">${lab[i % lab.length]}</b>${'<i style="display:block;height:3px;border-radius:2px;background:#D9D2C6"></i>'.repeat(5)}</div>`);
      el.append(p);
      return { p, x: 10 + rnd(i) * 270, y: 640 - 120 - Math.floor(i / 5) * 26 - rnd(i + 5) * 18, r0: (rnd(i + 9) - .5) * 160, r1: (rnd(i + 3) - .5) * 40, d: a + i * (e.gap || .16) };
    });
    return { el, sub: t => ps.forEach(({ p, x, y, r0, r1, d }) => {
      const k = pr(t, d, d + .9), fall = eio(k), away = e.away ? eio(pr(t, e.away, e.away + .8)) : 0;
      const y0 = e.from ?? -120;
      p.style.opacity = (t < d ? 0 : Math.min(1, k * 5) * (1 - away)).toFixed(3);
      p.style.transform = `translate(${(x + Math.sin(k * 6 + x) * 12 * (1 - k)).toFixed(1)}px,${(y0 + (y - y0) * fall - away * 700).toFixed(1)}px) rotate(${(r0 + (r1 - r0) * fall).toFixed(1)}deg)`;
    }) };
  };
  // race: two bars: manual (slow) vs VDALO (instant)
  T.race = e => {
    const row = (l, cls) => `<div style="display:grid;gap:8px"><div style="display:flex;justify-content:space-between;font:700 15px var(--vd-body)"><span>${l}</span><b class="${cls}" style="font:800 15px var(--vd-display);font-variant-numeric:tabular-nums"></b></div>
        <div style="height:18px;border-radius:10px;background:rgba(255,255,255,.1);overflow:hidden"><i class="${cls}b" style="display:block;height:100%;width:0;border-radius:inherit"></i></div></div>`;
    const el = h(`<div class="vdv-box" style="left:24px;right:24px;top:${e.top}px;padding:18px;display:grid;gap:22px">${row('Вручну', 'm')}${row('VDALO', 'v')}</div>`);
    const mv = el.querySelector('.m'), vv = el.querySelector('.v'), mb = el.querySelector('.mb'), vb = el.querySelector('.vb');
    mb.style.background = 'linear-gradient(90deg,#E8566D,#FF8C9E)'; vb.style.background = 'linear-gradient(90deg,#9C6BC0,#FF92BD)';
    return { el, sub: t => {
      const km = pr(t, e.m[0], e.m[1]), kv = eo(pr(t, e.v[0], e.v[1]));
      mb.style.width = `${(km * 100).toFixed(1)}%`; vb.style.width = `${(kv * 100).toFixed(1)}%`;
      const mins = km * e.mins; mv.textContent = `${Math.floor(mins / 60)} год ${pad(mins % 60)} хв`;
      vv.textContent = kv >= 1 ? 'готово ✓' : `${Math.round(kv * 100)}%`; vv.style.color = kv >= 1 ? '#5CC898' : '';
    } };
  };
  // cursor: pointer moving through keys [[t, x, y, click]]
  T.cursor = e => {
    const el = h(`<div style="position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:5">
        <i style="position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:2px solid #FF92BD;opacity:0"></i>
        <svg viewBox="0 0 24 24" style="position:absolute;left:0;top:0;width:26px;height:26px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#fff" stroke="#140A17" stroke-width="1.4" stroke-linejoin="round"/></svg></div>`);
    const ring = el.querySelector('i');
    return { el, sub: t => {
      const K = e.keys; let x = K[0][1], y = K[0][2];
      for (let i = 1; i < K.length; i++) { if (t <= K[i][0]) { const k = eio(pr(t, K[i - 1][0], K[i][0])); x = K[i - 1][1] + (K[i][1] - K[i - 1][1]) * k; y = K[i - 1][2] + (K[i][2] - K[i - 1][2]) * k; break; } x = K[i][1]; y = K[i][2]; }
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      const c = K.filter(k => k[3]).map(k => t - k[0]).find(d => d >= 0 && d < .45);
      ring.style.opacity = c != null ? (1 - c / .45).toFixed(2) : '0'; ring.style.transform = `scale(${c != null ? (.5 + c * 2.4).toFixed(2) : 1})`;
    } };
  };
  // chart: sleep line drawn over time; points in a 300x150 box; labels on spikes
  T.chart = (e, a) => {
    const pts = e.pts, d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    const el = h(`<div class="vdv-box" style="left:24px;right:24px;top:${e.top}px;height:220px;padding:14px">
        <svg viewBox="0 0 300 160" style="width:100%;height:170px;overflow:visible">
          <g stroke="rgba(255,255,255,.1)">${[20, 60, 100, 140].map(y => `<line x1="0" x2="300" y1="${y}" y2="${y}"/>`).join('')}</g>
          <text x="2" y="12" font-size="9" fill="rgba(255,245,247,.5)">не спить</text><text x="2" y="156" font-size="9" fill="rgba(255,245,247,.5)">глибокий сон</text>
          <path d="${d}" fill="none" stroke="${e.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>
          ${(e.labels || []).map(([x, y, s]) => `<g class="lb" data-x="${x}" opacity="0"><rect x="${x - 26}" y="${y - 24}" width="52" height="16" rx="8" fill="#E8566D"/><text x="${x}" y="${y - 13}" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">${s}</text></g>`).join('')}
        </svg>
        <div style="display:flex;justify-content:space-between;font:600 10px var(--vd-body);color:var(--muted);margin-top:4px"><span>23:00</span><span>01:00</span><span>03:00</span><span>05:00</span><span>07:00</span></div></div>`);
    const path = el.querySelector('path'), lbs = [...el.querySelectorAll('.lb')];
    return { el, sub: t => {
      const k = eio(pr(t, a + .2, e.end ?? a + 4)); path.setAttribute('stroke-dashoffset', (1 - k).toFixed(4));
      lbs.forEach(l => l.setAttribute('opacity', k * 300 >= +l.dataset.x ? '1' : '0'));
    } };
  };

  const board = (top, rows) => `<div class="vdv-box" style="left:24px;right:24px;top:${top}px;padding:12px;display:grid;gap:7px;background:#1B0F20;border-color:rgba(255,245,247,.14);color:#FFF5F7">
      <div style="display:grid;grid-template-columns:34px 1fr;gap:8px;font:600 10px var(--vd-body);color:rgba(255,245,247,.5)"><span>№</span><span style="display:grid;grid-template-columns:repeat(4,1fr);text-align:center"><span>пт</span><span>сб</span><span>нд</span><span>пн</span></span></div>
      ${rows.map(([n, f, l, c, lab]) => `<div style="display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center;font:700 12px var(--vd-body)"><span>${n}</span><span style="position:relative;height:26px;border-radius:6px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 calc(25% - 2px),transparent calc(25% - 2px) 25%)">${l ? `<i style="position:absolute;top:3px;bottom:3px;left:${f * 25}%;width:calc(${l * 25}% - 3px);border-radius:6px;background:${c};font:700 10px/20px var(--vd-display);color:#fff;padding-left:6px;font-style:normal">${lab}</i>` : ''}</span></div>`).join('')}</div>`;
  // a single booking bar positioned over board row r (0-based), days f..f+l
  const bar = (top, r, f, l, c, lab) => `<i style="position:absolute;left:${24 + 12 + 34 + 8 + f * 61}px;top:${top + 12 + 18 + 7 + r * 33 + 3}px;width:${l * 61 - 3}px;height:20px;border-radius:6px;background:${c};font:700 10px/20px var(--vd-display);color:#fff;padding-left:6px;font-style:normal;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,.4)">${lab}</i>`;
  const BROWS = [['101', 0, 2, '#C76A96', 'Сайт'], ['105', 1, 3, '#2F6FDB', 'Booking'], ['201', 0, 1, '#FF5A5F', 'Airbnb'], ['302', 0, 0, '', ''], ['303', 2, 2, '#FF5A5F', 'Airbnb']];
  const door = (left, top, open) => `<div style="position:absolute;left:${left}px;top:${top}px;width:110px;height:180px;border-radius:10px 10px 0 0;background:#2A1A30;border:5px solid #4F3657">
      <div style="position:absolute;inset:8px;border-radius:6px;background:${open ? 'linear-gradient(180deg,#FFE6AE,#F3C77A)' : '#3A2440'};${open ? 'transform:perspective(300px) rotateY(-38deg);transform-origin:left' : ''}"></div>
      <i style="position:absolute;right:-24px;top:74px;width:16px;height:28px;border-radius:5px;background:#140A17;border:2px solid #4F3657"><b style="display:block;margin:5px auto 0;width:7px;height:7px;border-radius:50%;background:${open ? '#5CC898' : '#E8566D'};box-shadow:0 0 8px ${open ? '#5CC898' : '#E8566D'}"></b></i></div>`;
  const chatPhone = (title, msgs) => `<div class="vdv-mphone" style="left:44px;top:112px;width:272px;height:440px"><div class="isl"></div>
      <div style="position:absolute;left:0;right:0;top:28px;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;gap:9px;align-items:center;color:#FFF5F7">
        <i style="width:30px;height:30px;border-radius:50%;background:#7FA8F0;display:grid;place-items:center;font:800 12px var(--vd-display);font-style:normal">${title[0]}</i>
        <span style="font:700 13px var(--vd-body)">${title}<small style="display:block;font:500 10px var(--vd-body);color:rgba(255,245,247,.5)">${msgs.sub || 'онлайн'}</small></span></div></div>`;
  const msg = (side, html, time, top, at, extra = '') => ({ type: 'html', at, anim: 'up', html: `<div style="position:absolute;${side === 'l' ? 'left:58px' : 'right:58px'};top:${top}px;max-width:206px;padding:8px 11px;border-radius:15px;${side === 'l' ? 'background:#2B1E33;border-bottom-left-radius:5px;color:#FFF5F7' : 'background:#FF92BD;color:#39233E;border-bottom-right-radius:5px'};font:500 12.5px/1.35 var(--vd-body);${extra}">${html}<small style="display:block;text-align:right;font:500 9.5px var(--vd-body);opacity:.6;margin-top:2px">${time}</small></div>` });

  // =====================================================================
  // 1 · Документи й туристичний збір вручну
  // =====================================================================
  reg('t-docs-pile', {
    title: 'Документи й збір: лавина паперів', group: 'top5', pain: 'Документи й туристичний збір досі рахуєте вручну', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'papers', at: .6, out: 7.0, anim: 'none', n: 24, gap: .17, away: 6.4, from: 290 },
        { type: 'big', html: 'Чеки. Акти. Звіти.', top: 58, size: 34, at: .1, anim: 'slam' },
        { type: 'big', html: 'Туристичний збір.', top: 100, size: 34, at: .7, anim: 'slam' },
        { type: 'big', html: '<em class="r">Досі вручну?</em>', top: 170, size: 46, at: 2.2, anim: 'slam' },
        { type: 'chip', html: 'калькулятор і Excel щомісяця', top: 244, at: 3.4, cls: 'bad', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'VDALO рахує <em>сам</em>', size: 40 },
        { type: 'card', icc: 'b', ic: 'B', t: 'Бронювання 203 · 3 ночі · 2 гості', s: 'оплачено карткою', cls: 'wrap', top: 160, at: 7.4 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Туристичний збір', s: 'пораховано автоматично', top: 224, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: I.receipt, t: 'Фіскальний чек ПРРО', s: 'створено після оплати', top: 282, at: 8.7, check: 9.2 },
        { type: 'card', icc: 'p', ic: I.check, t: 'Звіт за місяць', s: 'зібрано з усіх бронювань', top: 340, at: 9.3, check: 9.8 },
        { type: 'big', html: 'Без паперів <em>і калькулятора.</em>', top: 430, size: 30, at: 10.1 }
      ] }
    ]
  });

  reg('t-docs-race', {
    title: 'Документи й збір: ви проти VDALO', group: 'top5', pain: 'Документи й туристичний збір досі рахуєте вручну', theme: 'dark',
    segs: [
      { a: 0, b: 11.7, els: [
        { type: 'cap', html: 'Звіт за місяць: <em>ви проти VDALO</em>', size: 32 },
        { type: 'race', top: 156, m: [1.2, 10.4], v: [1.2, 1.9], mins: 360, at: .8, anim: 'up' },
        { type: 'chip', html: 'звірити оплати', top: 336, at: 2.4, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'порахувати збір', top: 336, at: 3.0, cls: 'bad', pos: 'left:160px' },
        { type: 'chip', html: 'пробити чеки', top: 384, at: 3.6, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'скласти звіт', top: 384, at: 4.2, cls: 'bad', pos: 'left:146px' },
        { type: 'chip', html: 'перевірити ще раз', top: 432, at: 4.8, cls: 'bad', pos: 'left:24px' },
        { type: 'big', html: 'Поки ви рахуєте: <em>VDALO вже порахував.</em>', top: 490, size: 26, at: 6.4 },
        foot('Час умовний.', 1.5)
      ] }
    ]
  });

  // =====================================================================
  // 2 · Бронювання з Booking вручну
  // =====================================================================
  reg('t-booking-copy', {
    title: 'Booking вручну: копіюй-вставляй', group: 'top5', pain: 'Бронювання з Booking переносите в календар вручну', theme: 'dark',
    quake: [[3.7, 4.2, 5]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Бронь з Booking', top: 56, size: 34, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">переносите вручну?</em>', top: 96, size: 34, at: .6, anim: 'slam' },
        { type: 'html', at: .9, anim: 'up', html: `<div style="position:absolute;left:24px;right:24px;top:160px;padding:12px 14px;border-radius:14px;background:#fff;color:#1E2A44;display:grid;gap:4px;font:500 12px/1.35 Arial,sans-serif">
            <b style="color:#2F6FDB;font-size:12px">Booking.com · Нове бронювання</b><span>Олена К. · номер 302</span><span>Заїзд: <b>12 жовт.</b> · Виїзд: <b>14 жовт.</b></span></div>` },
        { type: 'html', at: 1.3, anim: 'up', html: `<div style="position:absolute;left:24px;right:24px;top:290px;padding:12px;border-radius:14px;background:#F6F0E2;color:#2B2340;display:grid;gap:6px;font:italic 500 14px/1 Georgia,serif">
            <b style="font:700 11px var(--vd-body);font-style:normal;color:#7a6a7e">Календар на стіні · жовтень</b>
            <span style="border-bottom:1px solid #D9E2F0;padding:5px 0">105: Іван, 11–13</span><span style="border-bottom:1px solid #D9E2F0;padding:5px 0">201: Booking, 12–15</span><span style="padding:5px 0;opacity:0">.</span></div>` },
        { type: 'html', at: 3.5, anim: 'fade', html: '<div style="position:absolute;left:38px;top:384px;font:italic 600 15px Georgia,serif;color:#D63A55">302: Олена, 21–23</div>' },
        { type: 'cursor', at: 1.0, anim: 'fade', out: 6.6, keys: [[1.0, 280, 600, 0], [1.8, 150, 208, 1], [2.3, 150, 208, 1], [3.2, 120, 390, 1], [3.6, 120, 390, 0], [4.6, 240, 520, 0]] },
        { type: 'flash', at: 3.7 },
        { type: 'stamp', html: '12 ≠ 21', top: 440, at: 4.0, pos: 'left:110px', rot: -7 },
        { type: 'big', html: 'Одна цифра: <em class="r">і дата зайнята двічі.</em>', top: 520, size: 24, at: 4.8 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO бронь <em>з\'являється сама</em>', size: 31 },
        { type: 'html', at: 7.3, anim: 'up', html: board(160, BROWS) },
        { type: 'html', at: 8.2, anim: 'up', d: .5, html: bar(160, 3, 0, 2, '#2F6FDB', 'Booking · Олена') },
        { type: 'chip', html: 'Booking → VDALO · 0 кліків', top: 384, at: 9.0, cls: 'pk', pos: 'left:24px' },
        { type: 'chip', html: 'дати не переплутаєш', top: 432, at: 9.5, cls: 'pk', pos: 'left:24px' }
      ] }
    ]
  });

  reg('t-booking-clicks', {
    title: 'Booking вручну: лічильник кліків', group: 'top5', pain: 'Бронювання з Booking переносите в календар вручну', theme: 'red',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Одна бронь з Booking :', top: 60, size: 26, at: .1, anim: 'slam' },
        { type: 'num', from: 0, to: 14, n1: .6, n2: 2.0, top: 116, at: .5, cls: 'c xl', label: 'кліків: відкрити лист, скопіювати, вставити, перевірити', fmt: n => `${Math.round(n)}` },
        { type: 'big', html: '× 60 бронювань на місяць', top: 270, size: 26, at: 2.6, cls: 'c' },
        { type: 'num', from: 0, to: 840, n1: 3.2, n2: 4.6, top: 320, at: 3.1, cls: 'c r xl', label: 'кліків щомісяця', fmt: n => `${Math.round(n)}` },
        { type: 'big', html: '<em class="r">І кожен: шанс помилитися.</em>', top: 490, size: 26, at: 5.0, cls: 'c' },
        foot('Цифри умовні.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А з VDALO: <em>0 кліків</em>', size: 32 },
        { type: 'num', from: 840, to: 0, n1: 7.3, n2: 8.2, top: 140, at: 7.2, cls: 'c g xl', label: 'кліків на перенесення бронювань', fmt: n => `${Math.round(n)}` },
        { type: 'card', icc: 'b', ic: 'B', t: 'Бронювання з Booking', s: 'одразу в шахматці VDALO', top: 300, at: 8.6, check: 9.0 },
        { type: 'card', icc: 'p', ic: I.check, t: 'Дати закрито в інших каналах', s: 'автоматично', top: 358, at: 9.2, check: 9.6 }
      ] }
    ]
  });

  // =====================================================================
  // 3 · Гість чекає, адміністратора немає
  // =====================================================================
  reg('t-guest-lobby', {
    title: 'Гість чекає в лобі', group: 'top5', pain: 'Гість чекає на заселення, бо адміністратора немає', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'num', from: 14 * 60, to: 14 * 60 + 47, n1: .4, n2: 5.6, top: 52, at: .1, cls: 'c', fmt: m => `${pad(m / 60)}:${pad(m % 60)}`, label: 'гість на рецепції' },
        { type: 'html', at: .5, anim: 'up', html: '<div style="position:absolute;left:24px;right:24px;top:300px;height:70px;border-radius:12px 12px 0 0;background:#5E4265"><span style="position:absolute;left:14px;top:12px;font:700 12px var(--vd-body);color:#FFE1EC">Рецепція</span><i style="position:absolute;right:30px;top:-14px;width:32px;height:16px;border-radius:16px 16px 0 0;background:#E8C27A"></i></div>' },
        { type: 'person', color: '#7FA8F0', bag: true, w: 46, at: .8, anim: 'left', pos: 'left:60px;top:390px' },
        { type: 'bub', html: 'Є хтось?', top: 200, at: 1.4, pos: 'left:40px' },
        { type: 'bub', html: 'Алло?..', top: 200, at: 2.6, pos: 'left:150px' },
        { type: 'bub', html: 'Я тут уже 40 хвилин', top: 250, at: 3.8, pos: 'left:70px' },
        { type: 'face', mood: 'sad', size: 74, at: 4.6, anim: 'pop', pos: 'left:220px;top:380px' },
        { type: 'big', html: 'Гість чекає. <em class="r">Адміністратора немає.</em>', top: 540, size: 24, at: 4.2 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А з VDALO гість <em>заходить сам</em>', size: 32 },
        { type: 'bub', side: 'r', html: '<small>VDALO → гостю · 12:00</small>Ваш номер 203. Код дверей: 4827. Заїзд з 14:00.', top: 150, at: 7.3 },
        { type: 'html', at: 8.2, anim: 'up', html: door(150, 270, true) },
        { type: 'person', color: '#7FA8F0', bag: true, w: 40, at: 8.4, anim: 'left', pos: 'left:70px;top:350px' },
        { type: 'chip', html: 'заселився о 14:02 · без очікування', top: 492, at: 9.4, cls: 'ok', pos: 'left:24px' },
        foot('PIN-заселення: з розумним замком.', 7.4)
      ] }
    ]
  });

  reg('t-guest-chat', {
    title: 'Гість чекає: переписка', group: 'top5', pain: 'Гість чекає на заселення, бо адміністратора немає', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'cap', html: 'Знайома <em class="r">переписка?</em>', size: 34, top: 44 },
        { type: 'html', at: .2, anim: 'up', html: chatPhone('Гість · номер 203', { sub: 'був(ла) щойно' }) },
        msg('l', 'Добрий день, ми біля входу', '14:02', 186, .8),
        msg('l', 'Тут зачинено', '14:10', 238, 1.6),
        msg('l', 'Ви можете відповісти?', '14:25', 290, 2.4),
        msg('l', 'Ми чекаємо з дитиною…', '14:41', 342, 3.2),
        msg('l', 'Скасовую. Поставлю 1★', '14:58', 394, 4.2, 'background:#5A2131;border:1px solid rgba(232,86,109,.6)'),
        { type: 'html', at: 4.8, anim: 'fade', html: '<div style="position:absolute;left:60px;top:470px;font:italic 500 11px var(--vd-body);color:rgba(255,245,247,.45)">повідомлення не прочитано</div>' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'VDALO пише гостю <em>заздалегідь</em>', size: 32, top: 44 },
        { type: 'html', at: 7.0, anim: 'fade', html: chatPhone('Гість · номер 203', { sub: 'онлайн' }) },
        msg('r', '<b>VDALO</b><br>Вітаємо! Ваш номер 203, код дверей 4827. Заїзд з 14:00.', '12:00', 186, 7.5),
        msg('l', 'Дякуємо, вже в номері!', '14:03', 290, 8.6),
        { type: 'chip', html: 'адміністратор не потрібен', top: 470, at: 9.6, cls: 'ok', pos: 'left:58px' },
        foot('PIN-заселення: з розумним замком.', 7.4)
      ] }
    ]
  });

  // =====================================================================
  // 4 · Овербукінг через несинхронізовані бронювання
  // =====================================================================
  reg('t-ob-collide', {
    title: 'Овербукінг: зіткнення в календарі', group: 'top5', pain: 'Овербукінг через несинхронізовані бронювання', theme: 'ink',
    quake: [[3.1, 3.8, 8]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Номер 302.', top: 56, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Дві брони на одні дати.</em>', top: 98, size: 30, at: .6, anim: 'slam' },
        { type: 'html', at: .8, anim: 'up', html: board(170, BROWS) },
        { type: 'html', at: 1.3, anim: 'none', move: [1.3, 3.1, 210, 0], html: `<div style="position:absolute;left:-210px;top:0">${bar(170, 3, 0, 2, '#2F6FDB', 'Booking · Іван')}</div>` },
        { type: 'html', at: 1.3, anim: 'none', move: [1.3, 3.1, -210, 14], html: `<div style="position:absolute;left:210px;top:-14px">${bar(170, 3, 0, 2, '#FF5A5F', 'Airbnb · Марко')}</div>` },
        { type: 'crack', cx: 150, cy: 312, at: 3.1, anim: 'none' },
        { type: 'flash', at: 3.1 },
        { type: 'stamp', html: 'Овербукінг', top: 400, at: 3.4, pos: 'left:84px', rot: -6 },
        { type: 'big', html: 'Бо Booking і Airbnb <em class="r">не знають одне про одного.</em>', top: 490, size: 24, at: 4.6 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO канали <em>синхронізовані</em>', size: 32 },
        { type: 'html', at: 7.3, anim: 'up', html: board(160, BROWS) },
        { type: 'html', at: 8.0, anim: 'up', html: bar(160, 3, 0, 2, '#2F6FDB', 'Booking · Іван') },
        { type: 'chip', html: '302 закрито в Airbnb · автоматично', top: 384, at: 8.9, cls: 'pk', pos: 'left:24px' },
        { type: 'chip', html: '302 закрито на сайті · автоматично', top: 432, at: 9.4, cls: 'pk', pos: 'left:24px' }
      ] }
    ]
  });

  reg('t-ob-countdown', {
    title: 'Овербукінг: гість уже в дорозі', group: 'top5', pain: 'Овербукінг через несинхронізовані бронювання', theme: 'red',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Гість уже в дорозі.', top: 58, size: 34, at: .1, anim: 'slam' },
        { type: 'num', from: 120 * 60, to: 18 * 60, n1: .6, n2: 6.4, top: 128, at: .4, cls: 'c', label: 'до заїзду', fmt: s => `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}`, pos: 'font-variant-numeric:tabular-nums' },
        { type: 'big', html: '<em class="r">А його номер щойно продали ще раз.</em>', top: 276, size: 28, at: 2.2, anim: 'slam' },
        { type: 'flash', at: 2.2 }, { type: 'flash', at: 3.4 }, { type: 'flash', at: 4.6 },
        { type: 'chip', html: 'дзвонити гостю?', top: 400, at: 3.6, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'шукати інший готель?', top: 400, at: 4.0, cls: 'bad', pos: 'left:160px' },
        { type: 'chip', html: 'платити компенсацію?', top: 448, at: 4.4, cls: 'bad', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А з VDALO <em>такого дзвінка не буде</em>', size: 30 },
        { type: 'card', icc: 'b', ic: 'B', t: 'Бронювання з Booking · 302', s: 'потрапило у VDALO', top: 170, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: I.check, t: '302 закрито в Airbnb', s: 'автоматично', top: 228, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: I.check, t: '302 закрито на сайті', s: 'автоматично', top: 286, at: 8.8, check: 9.3 },
        { type: 'big', html: 'Гість приїжджає: <em>номер його.</em>', top: 380, size: 30, at: 9.8 }
      ] }
    ]
  });

  // =====================================================================
  // 5 · Адміністратор щоночі відповідає на ті самі питання
  // =====================================================================
  const QS = ['Пароль від Wi‑Fi?', 'Де паркінг?', 'Пароль від Wi‑Fi?', 'О котрій сніданок?', 'Пароль від Wi‑Fi?', 'Можна пізній виїзд?', 'Де паркінг?', 'Пароль від Wi‑Fi?', 'Є рушники?', 'Пароль від Wi‑Fi?', 'Де паркінг?', 'Пароль від Wi‑Fi?'];
  reg('t-night-repeat', {
    title: 'Нічні питання: одне й те саме', group: 'top5', pain: 'Адміністратор щоночі відповідає на ті самі питання', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Те саме питання.', top: 56, size: 36, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Щоночі.</em>', top: 98, size: 44, at: .6, anim: 'slam' },
        ...QS.map((q, i) => ({ type: 'chip', html: q, top: 172 + Math.floor(i / 2) * 46, at: .9 + i * .3, anim: 'pop', cls: q.startsWith('Пароль') ? 'bad' : '', pos: `left:${i % 2 ? 186 : 24}px` })),
        { type: 'big', html: 'Адміністратор: <em class="r">не довідкове бюро.</em>', top: 470, size: 26, at: 5.0 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'ШІ-помічник <em>відповідає сам</em>', size: 36 },
        { type: 'bub', html: 'Пароль від Wi‑Fi?', top: 170, at: 7.4 },
        { type: 'bub', side: 'r', html: '<small>ШІ-помічник VDALO · 02:14</small>Мережа HOTEL_GUEST, пароль: у вашому листі підтвердження.', top: 216, at: 8.0 },
        { type: 'bub', html: 'Де паркінг?', top: 310, at: 8.8 },
        { type: 'bub', side: 'r', html: '<small>ШІ-помічник VDALO · 02:31</small>У дворі, в\'їзд з вулиці. Безкоштовно.', top: 356, at: 9.3 },
        { type: 'chip', html: 'адміністратор спить', top: 446, at: 10.0, cls: 'ok', pos: 'left:24px' }
      ] }
    ]
  });

  reg('t-night-sleep', {
    title: 'Нічні питання: графік сну', group: 'top5', pain: 'Адміністратор щоночі відповідає на ті самі питання', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'cap', html: 'Сон адміністратора <em class="r">цієї ночі</em>', size: 32 },
        { type: 'chart', top: 156, at: .6, end: 5.0, color: '#E8566D', pts: [[0, 40], [20, 120], [40, 140], [52, 20], [62, 130], [90, 140], [102, 18], [112, 135], [140, 142], [152, 22], [162, 138], [185, 140], [197, 16], [207, 132], [232, 140], [244, 20], [254, 128], [275, 136], [287, 24], [300, 60]],
          labels: [[52, 20, 'Wi‑Fi?'], [102, 18, 'паркінг?'], [152, 22, 'Wi‑Fi?'], [197, 16, 'сніданок?'], [244, 20, 'Wi‑Fi?'], [287, 24, 'таксі?']] },
        { type: 'num', from: 0, to: 6, n1: .8, n2: 5.0, top: 410, at: .8, cls: 'r', label: 'пробуджень за ніч', fmt: n => Math.round(n) },
        foot('Умовний приклад.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А з ШІ-помічником <em>VDALO</em>', size: 32 },
        { type: 'chart', top: 156, at: 7.2, end: 9.6, color: '#5CC898', pts: [[0, 40], [30, 120], [60, 138], [100, 142], [150, 140], [200, 142], [250, 138], [280, 120], [300, 50]] },
        { type: 'num', from: 0, to: 0, top: 410, at: 7.4, cls: 'g', label: 'пробуджень: на питання гостей відповів ШІ', fmt: n => Math.round(n) }
      ] }
    ]
  });
})();
