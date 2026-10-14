/* VDALO · промо-відео (3 сценарії), vanilla JS без залежностей.
   Розмітка: <div class="vdv" data-scenario="list|phone|night"></div>
   Кожен кадр: чиста функція від часу t, тому:
   - на сторінці відео програється само, ставиться на паузу поза екраном;
   - для MP4 його можна прогнати покадрово: el.vdv.seek(t).
   Події на елементі .vdv: vdv:start, vdv:progress {detail:{p:25|50|75}}, vdv:end. */
(() => {
  'use strict';

  // ---------- helpers ----------
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const pr = (t, a, b) => cl((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  // visible between a and b: fades in after a, out after b
  const vis = (t, a, b, d = .4) => Math.min(eo(pr(t, a, a + d)), 1 - pr(t, b, b + d * .8));
  const put = (el, o, y = 0, x = 0, s = 1, r = 0) => {
    el.style.opacity = o.toFixed(3);
    el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(3)})${r ? ` rotate(${r.toFixed(2)}deg)` : ''}`;
    el.style.visibility = o < .002 ? 'hidden' : 'visible';
  };
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const ICON = {
    call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
    broom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M5 6l2 2M19 6l-2 2M12 21v-3M5 18l2-2M19 18l-2-2M3 12h3M18 12h3"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/></svg>'
  };

  // deterministic stars
  function stars(stage, n, maxY) {
    const box = h('<div class="vdv-stars" aria-hidden="true"></div>');
    let s = 7;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      const st = document.createElement('i');
      st.style.left = `${(rnd() * 360).toFixed(1)}px`; st.style.top = `${(rnd() * maxY).toFixed(1)}px`;
      st.dataset.ph = (rnd() * 6.28).toFixed(2);
      box.append(st);
    }
    stage.append(box);
    return t => box.querySelectorAll('i').forEach(st => { st.style.opacity = (.18 + .22 * (1 + Math.sin(t * 1.3 + +st.dataset.ph)) / 2).toFixed(2); });
  }
  function captions(stage, list) {
    const els = list.map(([a, b, html, size]) => {
      const e = h(`<p class="vdv-cap" data-a>${html}</p>`);
      if (size) e.style.fontSize = `${size}px`;
      stage.append(e); return { a, b, e };
    });
    return t => els.forEach(({ a, b, e }) => {
      const o = vis(t, a, b, .45);
      put(e, o, 14 * (1 - eo(pr(t, a, a + .5))) - 10 * pr(t, b, b + .35));
    });
  }
  function finalFrame(stage, at, line = 'Керуйте готелем <em>вдало</em>') {
    const f = h(`<div class="vdv-final" data-a>
      <div class="vdv-mark"><i></i>VDALO</div>
      <p>${line}</p>
      <small>Система для готелів і апартаментів · vdalo.tech</small></div>`);
    stage.append(f);
    const mark = f.querySelector('.vdv-mark'), p = f.querySelector('p'), sm = f.querySelector('small');
    return t => {
      put(f, pr(t, at, at + .3));
      put(mark, eo(pr(t, at, at + .6)), 0, 0, .86 + .14 * eo(pr(t, at, at + .7)));
      put(p, eo(pr(t, at + .35, at + .9)), 12 * (1 - eo(pr(t, at + .35, at + .9))));
      put(sm, eo(pr(t, at + .7, at + 1.2)));
    };
  }

  // =====================================================================
  // 1 · «Список справ, що зникає»
  // =====================================================================
  const LIST = {
    dur: 21,
    title: 'Список справ, що зникає',
    build(stage) {
      const tw = stars(stage, 18, 120);
      stage.append(h('<div class="vdv-kicker" data-a>VDALO · система для готелів</div>'));
      const caps = captions(stage, [
        [0.1, 3.2, 'Ваш тиждень <em>у готелі</em>'],
        [3.4, 14.8, 'Процеси готелю <em>в одному місці</em>'],
        [15.1, 18.0, 'Більше процесів <em>під контролем.</em>', 27]
      ]);
      const meter = h(`<div class="vdv-meter" data-a>
          <div><b><span class="n">6</span><small>кроків</small></b></div>
          <span style="text-align:right">робочих<br>сценаріїв</span>
          <div class="bar"><i></i></div></div>`);
      stage.append(meter);
      const num = meter.querySelector('.n'), bar = meter.querySelector('.bar i');
      const ROWS = [
        ['b', 'B', 'Бронювання з Booking', 'у календарі після підключення'],
        ['a', 'A', 'Доступність в Airbnb', 'за умовами інтеграції'],
        ['v', ICON.chat, 'Надіслати гостю інструкції', 'посилання на сторінку гостя'],
        ['n', ICON.receipt, 'Перевірити розрахунок збору', 'за ставкою громади'],
        ['n', ICON.broom, 'Задача для покоївки · 202', 'деталі для команди'],
        ['x', ICON.key, 'Заселити гостя о 01:00', 'інструкція доступна гостю']
      ];
      const list = h('<div class="vdv-list"></div>'); stage.append(list);
      const rows = ROWS.map(([c, ic, t, s]) => {
        const r = h(`<div class="vdv-row" data-a><span class="vdv-ic ${c}">${ic}</span>
          <span class="tx"><span class="t">${t}</span><span class="s">VDALO: ${s}</span></span>
          <span class="ck">${ICON.check}</span></div>`);
        list.append(r);
        return { r, t: r.querySelector('.t'), s: r.querySelector('.s'), ck: r.querySelector('.ck') };
      });
      const win = h(`<div class="vdv-row win" data-a style="position:absolute;left:24px;right:24px;top:250px">
          <span class="vdv-ic g">${ICON.up}</span>
          <span class="tx"><span class="t">Розвивати готель</span><span class="s" style="color:#A8EBC9">а рутина: на VDALO</span></span></div>`);
      stage.append(win);
      const foot = h('<div class="vdv-foot" data-a>Демонстрація процесу. Не вимірювання економії часу.</div>');
      stage.append(foot);
      const fin = finalFrame(stage, 18.3);
      const S = i => 3.7 + i * 1.8;
      return t => {
        tw(t); caps(t);
        const away = pr(t, 18.0, 18.4);
        put(stage.querySelector('.vdv-kicker'), (1 - away) * eo(pr(t, 0, .5)));
        put(meter, eo(pr(t, .2, .7)) * (1 - away), 10 * (1 - eo(pr(t, .2, .7))));
        let done = 0;
        rows.forEach(({ r, t: tt, s, ck }, i) => {
          const a = S(i), k = eo(pr(t, a, a + .45));
          done += k;
          const appear = eo(pr(t, .45 + i * .2, .85 + i * .2));
          const leave = eio(pr(t, 15.0 + i * .06, 15.6 + i * .06));
          put(r, appear * (1 - .45 * pr(t, a + .4, a + .9)) * (1 - leave), 12 * (1 - appear) - 20 * leave);
          tt.style.setProperty('--strike', k.toFixed(3));
          tt.style.opacity = (1 - .4 * k).toFixed(3);
          s.style.opacity = eo(pr(t, a + .25, a + .65)).toFixed(3);
          put(ck, eo(pr(t, a + .2, a + .5)), 0, 0, .4 + .6 * eo(pr(t, a + .2, a + .55)));
          r.style.borderColor = k > .5 && t < a + 1.2 ? 'rgba(255,146,189,.6)' : '';
        });
        const itemsLeft = Math.max(0, 6 - Math.round(done));
        num.textContent = itemsLeft;
        bar.style.width = `${(done / 6 * 100).toFixed(1)}%`;
        const wv = eo(pr(t, 15.6, 16.2)) * (1 - away);
        put(win, wv, 16 * (1 - eo(pr(t, 15.6, 16.2))), 0, .96 + .04 * wv);
        put(foot, eo(pr(t, 3.5, 4)) * (1 - away));
        fin(t);
      };
    }
  };

  // =====================================================================
  // 2 · «Один телефон замість хаосу»
  // =====================================================================
  const PHONE = {
    dur: 21,
    title: 'Один телефон замість хаосу',
    build(stage) {
      const tw = stars(stage, 16, 140);
      stage.append(h('<div class="vdv-kicker" data-a>VDALO · система для готелів</div>'));
      const caps = captions(stage, [
        [0.1, 3.3, '<em>Знайомо?</em>', 40],
        [3.6, 7.0, 'Усе: <em>в одному місці</em>'],
        [7.2, 11.0, 'Бронювання з підключених каналів <em>в календарі</em>', 27],
        [11.2, 15.0, 'Бронювання й задачі: <em>в одному місці</em>', 26],
        [15.3, 18.0, 'Керуйте готелем <em>з телефона</em>']
      ]);
      const phone = h(`<div class="vdv-phone" data-a><div class="isl"></div><div class="scr">
        <div class="hd"><span class="clk">22:40</span><span>VDALO</span></div></div></div>`);
      stage.append(phone);
      const scr = phone.querySelector('.scr'), clk = phone.querySelector('.clk');
      const NOTES = [
        ['b', 'B', 'Booking · номер 302', 'нове бронювання · пт–нд'],
        ['a', 'A', 'Airbnb · номер 302', 'ті самі дати · пт–нд'],
        ['x', ICON.call, '3 пропущені дзвінки', 'гості, 22:41'],
        ['v', 'V', '«Де забрати ключ?»', 'Viber · гість 101'],
        ['n', '!', '202 ще не прибраний', 'заїзд о 14:00']
      ];
      const colors = { b: 'var(--b)', a: 'var(--a)', x: 'var(--bad)', v: 'var(--v)', n: 'rgba(255,245,247,.2)' };
      const notes = NOTES.map(([c, ic, t, s], i) => {
        const n = h(`<div class="vdv-note" data-a style="top:${64 + i * 56}px"><span class="ic2" style="background:${colors[c]}">${ic}</span>
          <span>${t}<small>${s}</small></span></div>`);
        if (i === 1) n.style.boxShadow = 'inset 0 0 0 1.5px rgba(232,86,109,.8)';
        n.querySelector('.ic2 svg') && (n.querySelector('.ic2 svg').style.cssText = 'width:13px;height:13px');
        scr.append(n); return n;
      });
      const board = h(`<div class="vdv-board" data-a>
        <div class="bh"><span>№</span><div class="days"><span>пт</span><span>сб</span><span>нд</span><span>пн</span></div></div></div>`);
      const ROWS = [['101', [['s', 'Сайт', 0, 2]]], ['102', [['a', 'Airbnb', 1, 3]]], ['201', [['b', 'Booking', 0, 3]]],
        ['202', [['s', 'Сайт', 2, 2]]], ['301', [['a', 'Airbnb', 0, 1]]], ['302', []]];
      const brows = ROWS.map(([no, bars]) => {
        const r = h(`<div class="br"><span>${no}</span><div class="days"></div></div>`);
        const d = r.querySelector('.days');
        bars.forEach(([c, l, from, len]) => {
          const i = document.createElement('i'); i.className = c; i.textContent = l;
          i.style.left = `${from * 25}%`; i.style.width = `calc(${len * 25}% - 2px)`; d.append(i);
        });
        board.append(r); return { r, d };
      });
      const nb = document.createElement('i'); nb.className = 'b'; nb.textContent = 'Booking';
      nb.style.left = '0'; nb.style.width = 'calc(50% - 2px)'; brows[5].d.append(nb);
      scr.append(board);
      const sync = h(`<div class="vdv-toast" data-a style="top:262px"><span class="vdv-ic p" style="width:24px;height:24px;font-size:11px">V</span>
        <span>Нове бронювання з Booking. Перевірте доступність підключених каналів.</span></div>`);
      scr.append(sync);
      const TOASTS = [
        ['p', ICON.key, 'Гість відкрив інструкцію до заїзду'],
        ['n', ICON.broom, 'Покоївка: задача «Прибрати 202»'],
        ['g', ICON.receipt, 'Статус передплати видно в бронюванні']
      ];
      const toasts = TOASTS.map(([c, ic, t], i) => {
        const e = h(`<div class="vdv-toast" data-a style="top:${246 + i * 52}px"><span class="vdv-ic ${c}" style="width:24px;height:24px">${ic}</span><span>${t}</span></div>`);
        e.querySelector('svg').style.cssText = 'width:13px;height:13px';
        scr.append(e); return e;
      });
      const calm = h(`<div class="vdv-calm" data-a><b>FAQ</b><span>відповіді на типові<br>запитання</span>
        <span style="margin-top:10px;color:#A8EBC9;font-size:12px">Інформацію можна надіслати завчасно.</span></div>`);
      phone.append(calm);
      const foot = h('<div class="vdv-foot" data-a>PIN-заселення: з розумним замком</div>');
      stage.append(foot);
      const fin = finalFrame(stage, 18.3);
      const clockAt = t => {
        const m = 22 * 60 + 40 + Math.round(pr(t, 0, 16) * 500);
        const hh = Math.floor(m / 60) % 24, mm = m % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      };
      return t => {
        tw(t); caps(t);
        const away = pr(t, 18.0, 18.4);
        put(stage.querySelector('.vdv-kicker'), (1 - away) * eo(pr(t, 0, .5)));
        const shake = t < 3.4 ? Math.sin(t * 42) * 1.4 * pr(t, 1.2, 1.4) * (1 - pr(t, 3.0, 3.4)) : 0;
        put(phone, eo(pr(t, 0, .5)) * (1 - away), 30 * (1 - eo(pr(t, 0, .6))), 0, 1 - .04 * away, shake);
        clk.textContent = clockAt(t);
        const gather = eio(pr(t, 3.3, 4.2));
        notes.forEach((n, i) => {
          const a = eo(pr(t, .25 + i * .5, .6 + i * .5));
          put(n, a * (1 - gather), -8 * (1 - a) - gather * (i * 30 + 10), 0, 1 - .25 * gather);
        });
        put(board, eo(pr(t, 3.9, 4.6)) * (1 - pr(t, 15.0, 15.5)), 10 * (1 - eo(pr(t, 3.9, 4.6))));
        brows.forEach(({ r }, i) => { r.style.opacity = eo(pr(t, 4.0 + i * .08, 4.5 + i * .08)).toFixed(3); });
        nb.style.transform = `scaleX(${eo(pr(t, 7.5, 8.2)).toFixed(3)})`;
        nb.style.opacity = pr(t, 7.45, 7.55).toFixed(2);
        brows[5].r.style.background = t > 7.5 && t < 11 ? `rgba(255,146,189,${(.22 * vis(t, 7.5, 10.4)).toFixed(3)})` : '';
        brows[5].r.style.borderRadius = '7px';
        put(sync, vis(t, 8.4, 10.9), 14 * (1 - eo(pr(t, 8.4, 8.9))));
        toasts.forEach((e, i) => put(e, vis(t, 11.5 + i * 1.1, 15.0), 14 * (1 - eo(pr(t, 11.5 + i * 1.1, 12 + i * 1.1)))));
        put(calm, eo(pr(t, 15.5, 16.2)) * (1 - away), 0, 0, .9 + .1 * eo(pr(t, 15.5, 16.3)));
        put(foot, vis(t, 11.6, 15.0));
        fin(t);
      };
    }
  };

  // =====================================================================
  // 3 · «Ніч власника»: до / після
  // =====================================================================
  const houseSvg = side => `<svg class="house" viewBox="0 0 150 150" aria-hidden="true">
      <circle cx="${side === 'l' ? 120 : 30}" cy="26" r="11" fill="#F6E6C9" opacity=".85"/>
      <path d="M30 70 L75 32 L120 70 Z" fill="#6B4E73"/>
      <rect x="38" y="68" width="74" height="62" rx="3" fill="#4F3657"/>
      <rect class="win" x="50" y="80" width="22" height="20" rx="3" fill="#1B1020"/>
      <rect x="82" y="92" width="18" height="38" rx="2" fill="#2A1A30"/>
      <rect x="20" y="130" width="110" height="5" rx="2.5" fill="#24142A"/>
    </svg>`;
  const NIGHT = {
    dur: 21,
    title: 'Ніч власника: до / після',
    build(stage) {
      const tw = stars(stage, 26, 170);
      stage.append(h('<div class="vdv-kicker" data-a>VDALO · система для готелів</div>'));
      const caps = captions(stage, [
        [0.1, 3.4, 'Одна ніч. <em>Два готелі.</em>'],
        [3.6, 7.4, 'Менший ризик <em>овербукінгу</em>'],
        [7.6, 11.4, 'Менше ручних кроків <em>до заїзду</em>'],
        [11.6, 14.8, 'Прибирання <em>вчасно</em>'],
        [15.0, 18.0, 'Готель працює, <em>поки ви спите</em>', 29]
      ]);
      const clock = h('<div class="vdv-clock" data-a>22:00</div>'); stage.append(clock);
      const cols = h(`<div class="vdv-cols" data-a>
        <div class="vdv-col l"><span class="tag">Без системи</span>${houseSvg('l')}<div></div></div>
        <div class="vdv-col r"><span class="tag">З VDALO</span>${houseSvg('r')}<div></div></div></div>`);
      stage.append(cols);
      const [L, R] = cols.querySelectorAll('.vdv-col');
      const winL = L.querySelector('.win'), winR = R.querySelector('.win');
      const ring = h('<span class="vdv-ring" data-a style="left:96px;top:56px">Дзинь!</span>'); L.append(ring);
      const zzz = h('<span class="vdv-zzz" data-a style="left:112px;top:52px">Zzz</span>'); R.append(zzz);
      const BEATS = [
        [0.4, 3.5, '22:41', '3 пропущені дзвінки: паркінг, Wi‑Fi', '22:41', 'Гість відкрив сторінку з інструкціями'],
        [3.8, 7.5, '23:45', '302 продано двічі. Гість у лобі', '23:45', 'Перевірте календар і підключені канали'],
        [7.8, 11.5, '01:50', 'Гість не знає, як зайти. Дзвонить вам', '01:50', 'Інструкція з доступом підготовлена заздалегідь'],
        [11.8, 14.9, '05:30', '202 не прибраний до заїзду', '05:33', 'Задачу для команди видно в системі']
      ];
      const evs = BEATS.map(([a, b, tl, l, tr, r]) => {
        const el = h(`<div class="vdv-ev" data-a style="top:198px"><time>${tl}</time>${l}</div>`);
        const er = h(`<div class="vdv-ev" data-a style="top:198px"><time>${tr}</time>${r}</div>`);
        L.append(el); R.append(er); return { a, b, el, er };
      });
      const tl = h('<div class="vdv-tally" data-a>Дзвінки у сцені<b>0</b></div>'); L.append(tl);
      const tr = h('<div class="vdv-tally" data-a>Інструкція<b>гостю</b></div>'); R.append(tr);
      const tlb = tl.querySelector('b'), trb = tr.querySelector('b');
      const foot = h('<div class="vdv-foot" data-a>Самостійний вхід можливий із налаштованим сумісним замком.</div>'); stage.append(foot);
      const fin = finalFrame(stage, 18.3);
      const KEYS = [[0, 22 * 60], [3.8, 23 * 60 + 45], [7.8, 25 * 60 + 50], [11.8, 29 * 60 + 30], [15, 31 * 60]];
      const minutes = t => {
        for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) {
          const [t0, m0] = KEYS[i - 1], [t1, m1] = KEYS[i];
          return m0 + (m1 - m0) * eio(pr(t, t0, t1));
        }
        return KEYS[KEYS.length - 1][1];
      };
      return t => {
        tw(t); caps(t);
        const away = pr(t, 18.0, 18.4);
        put(stage.querySelector('.vdv-kicker'), (1 - away) * eo(pr(t, 0, .5)));
        const m = Math.round(minutes(t)), hh = Math.floor(m / 60) % 24, mm = m % 60;
        clock.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        clock.style.color = t >= 15 ? 'var(--lit)' : '';
        put(clock, eo(pr(t, .1, .6)) * (1 - away));
        put(cols, eo(pr(t, .2, .8)) * (1 - away), 20 * (1 - eo(pr(t, .2, .8))));
        let woke = 0, ringing = 0;
        evs.forEach(({ a, b, el, er }) => {
          const end = b < 14.95 ? b : 14.9;
          put(el, vis(t, a, end), 12 * (1 - eo(pr(t, a, a + .4))));
          put(er, vis(t, a + .15, end), 12 * (1 - eo(pr(t, a + .15, a + .55))));
          if (t >= a + .3) woke++;
          ringing = Math.max(ringing, vis(t, a, a + 1.4, .2));
        });
        tlb.textContent = t >= 15 ? `${woke} рази` : woke;
        trb.textContent = t >= 15 ? 'відкрита' : 'гостю';
        const big = eo(pr(t, 15, 15.6));
        put(tl, 1, -40 * big, 0, 1 + .2 * big); put(tr, 1, -40 * big, 0, 1 + .2 * big);
        winL.setAttribute('fill', t >= 15 ? '#FFE6AE' : ringing > .1 ? '#FFD27A' : '#3A2440');
        winR.setAttribute('fill', t >= 15 ? '#FFE6AE' : '#1B1020');
        put(ring, t < 15 ? ringing : 0, -4 * ringing, 0, .9 + .1 * ringing, Math.sin(t * 30) * 6 * ringing);
        const zz = t < 15 ? .55 + .45 * Math.sin(t * 2.2) : 0;
        put(zzz, zz * eo(pr(t, .5, 1)), -4 * Math.sin(t * 2.2));
        put(foot, eo(pr(t, 1, 1.5)) * (1 - away));
        fin(t);
      };
    }
  };

  const SCENES = { list: LIST, phone: PHONE, night: NIGHT };

  // ---------- player ----------
  function mount(root) {
    if (root.vdv) return root.vdv;
    const sc = SCENES[root.dataset.scenario] || LIST;
    const stage = document.createElement('div'); stage.className = 'vdv-stage';
    root.replaceChildren(stage);
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', root.getAttribute('aria-label') || `Відео VDALO: ${sc.title}`);
    const update = sc.build(stage);
    const fit = () => root.style.setProperty('--vdv-s', Math.min(root.clientWidth / 360, (root.clientHeight || 1e9) / 640).toFixed(4));
    fit(); new ResizeObserver(fit).observe(root);
    const emit = (n, d) => root.dispatchEvent(new CustomEvent(`vdv:${n}`, { bubbles: true, detail: d }));
    const api = { t: 0, dur: sc.dur, playing: false, ended: false, title: sc.title };
    const marks = new Set();
    let last = 0, raf = 0, inView = false, started = false;
    const draw = () => update(api.t);
    const loop = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      api.t = Math.min(api.dur, api.t + dt);
      draw();
      [25, 50, 75].forEach(p => { if (!marks.has(p) && api.t >= api.dur * p / 100) { marks.add(p); emit('progress', { p }); } });
      if (api.t >= api.dur) { api.playing = false; api.ended = true; root.classList.add('is-ended'); emit('end'); return; }
      raf = requestAnimationFrame(loop);
    };
    api.play = () => {
      if (api.playing || api.ended) return;
      if (!started) { started = true; emit('start'); }
      api.playing = true; last = performance.now(); raf = requestAnimationFrame(loop);
    };
    api.pause = () => { api.playing = false; cancelAnimationFrame(raf); };
    api.seek = t => { api.t = cl(t, 0, api.dur); draw(); };
    api.replay = () => { api.pause(); api.ended = false; root.classList.remove('is-ended'); marks.clear(); api.t = 0; draw(); api.play(); };
    draw();
    if (!root.hasAttribute('data-manual')) {
      new IntersectionObserver(es => es.forEach(e => {
        inView = e.isIntersecting;
        if (inView && !document.hidden) api.play(); else api.pause();
      }), { threshold: .5 }).observe(root);
      document.addEventListener('visibilitychange', () => { if (document.hidden) api.pause(); else if (inView) api.play(); });
    }
    root.vdv = api;
    return api;
  }

  window.VDALOVideo = {
    mount,
    get scenes() { return Object.keys(SCENES); },
    register(name, scene) { SCENES[name] = scene; },
    meta(name) { const s = SCENES[name]; return s ? { title: s.title, dur: s.dur, group: s.group || 'base' } : null; },
    kit: { cl, pr, eo, eio, vis, put, h, ICON, stars, captions, finalFrame }
  };
  const auto = () => document.querySelectorAll('.vdv[data-scenario]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
