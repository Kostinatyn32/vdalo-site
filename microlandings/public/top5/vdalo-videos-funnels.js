/* VDALO · 9 відео для трьох воронок (по 3 на воронку), фінал — нове позиціонування
   «Автономна система для готелю · Менше персоналу · Авто-реєстрація · Кожна гривня в P&L».
   s-* — криза персоналу (коди 44–46) · b-* — Booking і прямі продажі (47–49) · e-* — блекаути (50–52).
   Підключати ПІСЛЯ vdalo-videos.js, -more.js, -fx.js, -top5.js. */
(() => {
  'use strict';
  const V = window.VDALOVideo;
  if (!V || !V.kit || !V.kit.types || !V.kit.types.person) return;
  const { pr, eo, eio, put, h, ICON: I, types: T, reg, back, grn } = V.kit;
  const foot = (txt, at) => ({ type: 'html', at, anim: 'fade', html: `<div class="vdv-foot" style="bottom:22px">${txt}</div>` });
  const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const doc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c1-2 7-2 8 0"/></svg>';
  const card = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>';
  const phoneI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>';
  const stop = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>';

  // ---------- final frame with the positioning ----------
  function autoFrame(stage, at) {
    const f = h(`<div class="vdv-final solid" data-a>
      <div class="vdv-mark"><i></i>VDALO</div>
      <p>Автономна система <em>для готелю</em></p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:300px">
        <span class="vdv-chip" style="position:static">Менше персоналу</span><span class="vdv-chip" style="position:static">Авто-реєстрація</span><span class="vdv-chip" style="position:static">Кожна гривня в P&amp;L</span></div>
      <span class="vdv-cta-pill">14 днів безкоштовно →</span></div>`);
    stage.append(f);
    const [mark, p, chips, pill] = f.children;
    return t => {
      put(f, eo(pr(t, at, at + .35)));
      put(mark, eo(pr(t, at + .1, at + .6)), 0, 0, .86 + .14 * eo(pr(t, at + .1, at + .7)));
      put(p, eo(pr(t, at + .35, at + .85)), 12 * (1 - eo(pr(t, at + .35, at + .85))));
      put(chips, eo(pr(t, at + .7, at + 1.2)), 8 * (1 - eo(pr(t, at + .7, at + 1.2))));
      const pulse = t > at + 1.6 ? 1 + .035 * Math.sin((t - at) * 5) : 1;
      put(pill, eo(pr(t, at + 1.1, at + 1.5)), 10 * (1 - eo(pr(t, at + 1.1, at + 1.5))), 0, (.7 + .3 * back(pr(t, at + 1.1, at + 1.55))) * pulse);
    };
  }
  const R = (id, def) => reg(id, Object.assign({ final: autoFrame }, def));

  // ---------- new effects ----------
  // gauge: fuel needle from F to E between a and e.end
  T.gauge = (e, a) => {
    const el = h(`<div style="position:absolute;${e.pos}"><svg viewBox="0 0 200 120" style="width:200px;height:120px;overflow:visible">
        <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="16" stroke-linecap="round"/>
        <path d="M20 110 A80 80 0 0 1 60 41" fill="none" stroke="#E8566D" stroke-width="16" stroke-linecap="round"/>
        <text x="16" y="138" fill="#FF8C9E" font-size="14" font-weight="800">E</text><text x="176" y="138" fill="rgba(255,245,247,.7)" font-size="14" font-weight="800">F</text>
        <g class="nd"><line x1="100" y1="110" x2="100" y2="44" stroke="#FFF5F7" stroke-width="5" stroke-linecap="round"/></g><circle cx="100" cy="110" r="9" fill="#FFF5F7"/></svg></div>`);
    const nd = el.querySelector('.nd');
    return { el, sub: t => { const k = eio(pr(t, a + .3, e.end)); nd.setAttribute('transform', `rotate(${(80 - 160 * k + Math.sin(t * 9) * 2 * (k < 1 ? 1 : 0)).toFixed(1)} 100 110)`); } };
  };
  // spot: a flashlight beam wandering over a dark screen
  T.spot = () => {
    const el = h('<div style="position:absolute;inset:0;pointer-events:none"></div>');
    return { el, sub: t => { const x = 180 + Math.sin(t * .9) * 110, y = 360 + Math.cos(t * 1.3) * 120; el.style.background = `radial-gradient(150px 150px at ${x.toFixed(0)}px ${y.toFixed(0)}px, rgba(255,240,200,.16), transparent 70%), rgba(5,2,8,.55)`; } };
  };

  const widget = (top, title, price) => `<div style="position:absolute;left:36px;right:36px;top:${top}px;padding:14px;border-radius:18px;background:#fff;color:#39233E;display:grid;gap:8px;box-shadow:0 18px 40px rgba(0,0,0,.35)">
      <b style="font:800 15px var(--vd-display)">${title}</b>
      <span style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font:500 11px var(--vd-body)"><i style="font-style:normal;border:1px solid #eadbe2;border-radius:9px;padding:8px">Заїзд: пт</i><i style="font-style:normal;border:1px solid #eadbe2;border-radius:9px;padding:8px">Виїзд: нд</i></span>
      <span style="background:#FF92BD;border-radius:999px;padding:10px;text-align:center;font:700 13px var(--vd-body)">${price}</span></div>`;

  // =====================================================================
  // ВОРОНКА 1 · КРИЗА ПЕРСОНАЛУ
  // =====================================================================
  R('s-vacancy', {
    title: 'Персонал: вакансія висить місяцями', group: 'funnel-staff', pain: 'Вакансію адміністратора не можуть закрити місяцями', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Вакансія відкрита', top: 58, size: 36, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">місяцями.</em>', top: 100, size: 44, at: .6, anim: 'slam' },
        { type: 'html', at: 1.0, anim: 'up', html: `<div style="position:absolute;left:30px;right:30px;top:176px;padding:16px;border-radius:16px;background:#fff;color:#22192A;display:grid;gap:6px;box-shadow:0 18px 40px rgba(0,0,0,.35)">
            <span style="font:600 11px var(--vd-body);color:#8a7d8e">Вакансія · готель · повна зайнятість</span>
            <b style="font:800 18px/1.2 var(--vd-display)">Потрібен адміністратор рецепції</b>
            <span style="font:500 12px var(--vd-body);color:#5b4f60">Графік 2/2, нічні зміни. Досвід бажаний.</span></div>` },
        { type: 'num', from: 7, to: 94, n1: 1.6, n2: 5.4, top: 316, at: 1.4, cls: 'c r', label: 'днів вакансія відкрита', fmt: n => Math.round(n) },
        { type: 'chip', html: 'переглядів багато · відгуків 0', top: 420, at: 3.0, cls: 'bad', pos: 'left:70px' },
        { type: 'big', html: 'А гості приїжджають <em class="r">щодня.</em>', top: 480, size: 26, at: 4.6 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'А з VDALO гості <em>реєструються самі</em>', size: 30 },
        { type: 'card', icc: 'p', ic: phoneI, t: 'Гостьова сторінка — гостю на телефон', s: 'ще до приїзду', cls: 'wrap', top: 160, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: doc, t: 'Фото документа — дані заповнились самі', s: 'без анкети на рецепції', cls: 'wrap', top: 226, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: card, t: 'Оплата онлайн', s: 'до заїзду', top: 292, at: 8.8, check: 9.3 },
        { type: 'card', icc: 'p', ic: I.key, t: 'Інструкції заїзду', s: 'гість знає, куди йти', top: 350, at: 9.4, check: 9.9 },
        { type: 'big', html: 'Рецепція — <em>на гостях, а не на анкетах.</em>', top: 430, size: 26, at: 10.2 }
      ] }
    ]
  });

  const TRY = [['Заселити 203', 'гість ще не заплатив'], ['Продати 302 на пт–нд', '302 уже продано'], ['Видалити оплату', 'каса не зійдеться']];
  R('s-newbie', {
    title: 'Персонал: новачок на рецепції', group: 'funnel-staff', pain: 'Новачок без досвіду робить дорогі помилки', theme: 'ink',
    quake: [[2.6, 3.0, 5], [3.6, 4.0, 5], [4.6, 5.0, 5]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Перший день <em class="r">новачка на рецепції.</em>', top: 58, size: 30, at: .1, anim: 'slam' },
        ...TRY.flatMap(([act, bad], i) => [
          { type: 'card', icc: 'n', ic: '→', t: act, s: '', top: 176 + i * 80, at: 1.0 + i * .2, anim: 'left' },
          { type: 'chip', html: `✕ ${bad}`, top: 222 + i * 80, at: 2.6 + i * 1.0, cls: 'bad', pos: 'left:40px', anim: 'pop' },
          { type: 'flash', at: 2.6 + i * 1.0 }
        ]),
        { type: 'big', html: '<em class="r">Кожна помилка — ваші гроші.</em>', top: 438, size: 28, at: 5.4 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'VDALO <em>не дасть помилитися</em>', size: 34 },
        { type: 'card', icc: 'x', ic: stop, t: 'Заселити 203', s: 'заблоковано: не оплачено', tag: 'захищено', tagc: 'ok', top: 166, at: 7.4, tagOn: 7.9 },
        { type: 'card', icc: 'x', ic: stop, t: 'Продати 302 на пт–нд', s: 'заблоковано: вже зайнято', tag: 'захищено', tagc: 'ok', top: 224, at: 8.1, tagOn: 8.6 },
        { type: 'card', icc: 'x', ic: stop, t: 'Видалити оплату', s: 'тільки сторно, з історією', tag: 'захищено', tagc: 'ok', top: 282, at: 8.8, tagOn: 9.3 },
        { type: 'big', html: 'Новачок працює <em>як досвідчений.</em>', top: 380, size: 30, at: 9.9 }
      ] }
    ]
  });

  R('s-three', {
    title: 'Персонал: одна людина за трьох', group: 'funnel-staff', pain: 'Ті, хто лишився, роблять роботу за тих, кого немає', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Одна людина —', top: 58, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">за трьох.</em>', top: 102, size: 44, at: .6, anim: 'slam' },
        { type: 'person', color: '#FF92BD', w: 56, at: .9, anim: 'pop', shake: [2.0, 6.4], shakeA: 2.4, pos: 'left:152px;top:280px' },
        { type: 'burst', cx: 180, cy: 330, at: 1.6, out: 6.8, anim: 'none', items: ['каса', 'прибирання', 'телефон', 'заселення', 'Booking', 'ключі', 'білизна', 'питання гостей', 'звіт', 'кран у 105'] },
        { type: 'chip', html: 'вигорання → звільнення → нова вакансія', top: 520, at: 4.6, cls: 'bad', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'VDALO розкладає роботу <em>по телефонах</em>', size: 29 },
        { type: 'card', icc: 'n', ic: I.broom, t: 'Покоївка: прибрати 203', s: 'задача в її телефоні', top: 160, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'n', ic: I.broom, t: 'Технік: кран у 105', s: 'статус видно вам', top: 218, at: 8.0, check: 8.5 },
        { type: 'card', icc: 'p', ic: I.chat, t: 'Питання гостей', s: 'відповідає ШІ-помічник', top: 276, at: 8.6, check: 9.1 },
        { type: 'card', icc: 'p', ic: doc, t: 'Реєстрація гостей', s: 'гості заповнюють самі', top: 334, at: 9.2, check: 9.7 },
        { type: 'big', html: 'Команда менша — <em>сервіс той самий.</em>', top: 420, size: 28, at: 10.1 }
      ] }
    ]
  });

  // =====================================================================
  // ВОРОНКА 2 · BOOKING І ПРЯМІ ПРОДАЖІ
  // =====================================================================
  R('b-share', {
    title: 'Booking: частка з кожної броні', group: 'funnel-booking', pain: 'Booking забирає 15–25% з кожного бронювання', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Кожна бронь з Booking —', top: 58, size: 26, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">мінус 15–25%.</em>', top: 120, size: 42, at: .6, anim: 'slam' },
        { type: 'html', at: 1.0, anim: 'pop', html: '<div style="position:absolute;right:30px;top:170px;width:90px;height:90px;border-radius:50%;background:#2F6FDB;display:grid;place-items:center;font:800 15px var(--vd-display);box-shadow:0 0 40px rgba(47,111,219,.6)">OTA</div>' },
        { type: 'card', icc: 'b', ic: 'B', t: 'Бронь · 3 ночі · 9 000 грн', s: 'комісія 15% = −1 350 грн', top: 290, at: 1.2, anim: 'left' },
        ...[0, 1, 2, 3, 4, 5].map(i => ({ type: 'chip', html: '−1 350', top: 300, at: 2.0 + i * .5, cls: 'bad', pos: `left:${60 + (i % 3) * 20}px`, move: [2.0 + i * .5, 2.9 + i * .5, 200 - (i % 3) * 20, -90, .6, 1], anim: 'pop' })),
        { type: 'num', from: 0, to: 162000, n1: 2.2, n2: 5.4, top: 380, at: 2.0, cls: 'c r md', label: 'за рік віддаєте Booking', fmt: n => `−${grn(n)} грн` },
        foot('Приклад: 10 бронювань на місяць по 9 000 грн, комісія 15%.', 2)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Прямі бронювання <em>з вашого сайту</em>', size: 32 },
        { type: 'html', at: 7.4, anim: 'pop', html: widget(160, 'Ваш готель · бронювання', 'Забронювати напряму') },
        { type: 'card', icc: 'p', ic: 'V', t: 'Бронь з сайту · 9 000 грн', s: 'комісія Booking — 0 грн', top: 330, at: 8.8, check: 9.3 },
        { type: 'big', html: 'Booking лишається. <em>Прямий канал — додається.</em>', top: 410, size: 26, at: 9.8 },
        foot('Приклад. Суми умовні.', 7.4)
      ] }
    ]
  });

  R('b-budget', {
    title: 'Booking: злитий рекламний бюджет', group: 'funnel-booking', pain: 'Рекламу злили, а гості все одно бронюють через Booking', theme: 'red',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Бюджет на рекламу —', top: 58, size: 28, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">злили.</em>', top: 96, size: 50, at: .7, anim: 'slam' },
        { type: 'num', from: 0, to: 15000, n1: .9, n2: 3.0, top: 176, at: .8, cls: 'c md', label: 'витрачено на рекламу за місяць', fmt: n => `${grn(n)} грн` },
        { type: 'burst', cx: 180, cy: 330, at: 1.6, out: 6.8, anim: 'none', items: ['♥ 324 лайки', 'охоплення 12 тис.', '+40 підписників', 'збережень 58', 'перегляди сторіз', 'коментарі'] },
        { type: 'card', icc: 'x', ic: '0', t: 'Бронювань з реклами: 0', s: 'гості все одно йдуть на Booking', top: 450, at: 4.0, anim: 'pop' },
        foot('Цифри умовні.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'Кожен лайк веде <em>на бронювання</em>', size: 32 },
        { type: 'card', icc: 'p', ic: phoneI, t: 'Посилання «Забронювати» в профілі', s: 'вибір дат і номера', cls: 'wrap', top: 160, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'p', ic: card, t: 'Оплата одразу', s: 'без переписок і дзвінків', top: 226, at: 8.1, check: 8.6 },
        { type: 'card', icc: 'p', ic: 'V', t: 'Бронь у шахматці VDALO', s: 'канали оновлено', top: 284, at: 8.8, check: 9.3 },
        { type: 'big', html: 'Реклама приводить гостя — <em>а не Booking.</em>', top: 380, size: 26, at: 9.9 }
      ] }
    ]
  });

  const bars = (top, rows) => `<div class="vdv-box" style="left:24px;right:24px;top:${top}px;padding:16px;display:grid;gap:14px">${rows.map(([l, a, c]) => `<div style="display:grid;gap:6px"><div style="display:flex;justify-content:space-between;font:600 12.5px var(--vd-body)"><span>${l}</span><b>${a}</b></div><div style="height:16px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${c}%;border-radius:inherit;background:linear-gradient(90deg,#9C6BC0,#FF92BD)"></i></div></div>`).join('')}</div>`;
  R('b-pnl', {
    title: 'Booking: скільки реально заробляє канал', group: 'funnel-booking', pain: 'Не видно, скільки насправді заробляє кожен канал продажів', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Скільки реально', top: 58, size: 34, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">заробляє кожен канал?</em>', top: 98, size: 32, at: .6, anim: 'slam' },
        { type: 'glitch', gl: [[3.4, 3.8]], at: 1.0, anim: 'up', html: `<div class="vdv-box" style="left:24px;right:24px;top:190px;padding:10px;display:grid;gap:4px;background:#F6F8F4;border-color:#cfd8cc;color:#1F3A2A;font:500 12px/1 'Courier New',monospace">
            ${[['Канал', 'Виторг'], ['Booking', '180 000'], ['Airbnb', '60 000'], ['Сайт', '40 000'], ['Разом', '280 000']].map((r, i) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${r.map(c => `<span style="padding:7px 6px;background:${i ? '#fff' : '#DDE7D8'};border:1px solid #d5ddd2">${c}</span>`).join('')}</div>`).join('')}</div>` },
        { type: 'big', html: 'В Excel видно <em class="r">тільки виторг.</em>', top: 400, size: 28, at: 3.0 },
        { type: 'chip', html: 'комісії?', top: 470, at: 4.0, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'еквайринг?', top: 470, at: 4.3, cls: 'bad', pos: 'left:120px' },
        { type: 'chip', html: 'повернення?', top: 470, at: 4.6, cls: 'bad', pos: 'left:230px' },
        foot('Цифри умовні.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO — <em>чистий дохід по каналах</em>', size: 30 },
        { type: 'html', at: 7.4, anim: 'up', html: bars(160, [['Booking · виторг', '180 000', 100], ['Booking · після комісії 15%', '153 000', 85], ['Сайт · виторг', '40 000', 22], ['Сайт · після комісії', '40 000', 22]]) },
        { type: 'chip', html: 'кожна гривня — у вашому P&L', top: 420, at: 9.4, cls: 'pk', pos: 'left:24px' },
        foot('Приклад. Суми умовні.', 7.4)
      ] }
    ]
  });

  // =====================================================================
  // ВОРОНКА 3 · БЛЕКАУТИ
  // =====================================================================
  const windows = `<div style="position:absolute;left:70px;right:70px;top:170px;height:200px;border-radius:10px;background:#4F3657;padding:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${Array.from({ length: 12 }, (_, i) => `<i style="border-radius:4px;background:${[1, 4, 6, 9].includes(i) ? '#2A1A30' : '#FFD27A'}"></i>`).join('')}</div>`;
  R('e-dark', {
    title: 'Блекаут: світло згасло', group: 'funnel-energy', pain: 'Вимикають світло — готель зупиняється', theme: 'ink',
    quake: [[1.6, 2.0, 4]],
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: '19:40. Повний готель.', top: 58, size: 30, at: .1 },
        { type: 'html', at: .2, anim: 'fade', html: windows },
        { type: 'html', at: 1.6, anim: 'fade', d: .15, html: '<div style="position:absolute;inset:0;background:#030104"></div>' },
        { type: 'big', html: 'Світло вимкнули.', top: 110, size: 38, at: 2.0, anim: 'slam' },
        { type: 'chip', html: 'комп\'ютер рецепції — вимкнений', top: 220, at: 2.8, cls: 'bad', pos: 'left:24px' },
        { type: 'chip', html: 'Excel із бронюваннями — недоступний', top: 268, at: 3.2, cls: 'bad', pos: 'left:24px' },
        { type: 'bub', html: 'Є вільні номери на вихідні?', top: 340, at: 3.8 },
        { type: 'big', html: '<em class="r">А бронювання не чекають.</em>', top: 450, size: 28, at: 4.8 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'html', at: 7.0, anim: 'none', html: '<div style="position:absolute;inset:0;background:#030104"></div>' },
        { type: 'cap', html: 'VDALO працює <em>з телефона</em>', size: 34 },
        { type: 'html', at: 7.3, anim: 'up', html: `<div class="vdv-mphone" style="left:80px;top:150px;width:200px;height:330px;box-shadow:0 0 70px rgba(255,146,189,.35)"><div class="isl"></div><div class="in">
            <b style="font:800 15px var(--vd-display)">VDALO</b>
            <div class="nt"><i style="background:#2F6FDB">B</i>Нова бронь · 302 · сб–нд</div>
            <div class="nt"><i style="background:#5CC898;color:#39233E">₴</i>Оплату отримано</div>
            <div class="nt"><i style="background:#FF92BD;color:#39233E">✓</i>Канали оновлено</div>
            <div class="nt"><i style="background:#7360F2">?</i>Гостю відповів ШІ-помічник</div></div></div>` },
        { type: 'chip', html: 'мобільний інтернет — і готель працює', top: 500, at: 9.4, cls: 'pk', pos: 'left:24px' },
        foot('Потрібен мобільний зв\'язок на телефоні.', 7.4)
      ] }
    ]
  });

  R('e-fuel', {
    title: 'Блекаут: скільки коштує ніч на генераторі', group: 'funnel-energy', pain: 'Великі витрати на пальне, які не видно в ціні ночі', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Генератор.', top: 58, size: 40, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Скільки коштує ніч?</em>', top: 104, size: 34, at: .6, anim: 'slam' },
        { type: 'gauge', end: 5.0, at: .9, anim: 'up', pos: 'left:80px;top:180px' },
        { type: 'num', from: 0, to: 28000, n1: 1.2, n2: 5.0, top: 340, at: 1.2, cls: 'c r', label: 'пальне за місяць', fmt: n => `${grn(n)} грн` },
        { type: 'big', html: 'І чи закладено це <em class="r">у ціну номера?</em>', top: 440, size: 26, at: 4.6 },
        foot('Цифри умовні.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO пальне — <em>окремою статтею</em>', size: 30 },
        { type: 'html', at: 7.4, anim: 'up', html: `<div class="vdv-box" style="left:24px;right:24px;top:160px;padding:14px;display:grid;gap:8px;font:600 13px var(--vd-body)">
            ${[['Дохід за місяць', '210 000', ''], ['Пальне / генератор', '−28 000', 'color:#FF8C9E'], ['Інші витрати', '−96 000', ''], ['Прибуток', '86 000', 'color:#5CC898;font-weight:800']].map(([l, v, s]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span>${l}</span><b style="${s}">${v}</b></div>`).join('')}</div>` },
        { type: 'num', from: 0, to: 62, n1: 9.0, n2: 9.8, top: 380, at: 8.8, cls: 'c p', label: 'пального в кожній проданій ночі', fmt: n => `${Math.round(n)} грн` },
        foot('Приклад: 20 номерів, завантаженість 75%. Цифри умовні.', 7.4)
      ] }
    ]
  });

  R('e-guests', {
    title: 'Блекаут: гості питають у темряві', group: 'funnel-energy', pain: 'Під час відключень гості засипають питаннями', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'spot', at: 0, out: 6.9, anim: 'fade' },
        { type: 'big', html: 'Світла немає.', top: 58, size: 38, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Питання — є.</em>', top: 102, size: 38, at: .7, anim: 'slam' },
        { type: 'bub', html: 'Чи є генератор?', top: 190, at: 1.4 },
        { type: 'bub', html: 'Де найближче укриття?', top: 240, at: 2.1, pos: 'left:90px' },
        { type: 'bub', html: 'Чи працює Wi‑Fi?', top: 290, at: 2.8 },
        { type: 'bub', html: 'Де зарядити телефон?', top: 340, at: 3.5, pos: 'left:110px' },
        { type: 'bub', html: 'Коли дадуть світло?', top: 390, at: 4.2 },
        { type: 'chip', html: '☎ адміністратор один — гостей 40', top: 470, at: 4.9, cls: 'bad', pos: 'left:24px' }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'ШІ-помічник <em>відповідає сам</em>', size: 36 },
        { type: 'bub', html: 'Чи є генератор?', top: 160, at: 7.4 },
        { type: 'bub', side: 'r', html: '<small>ШІ-помічник VDALO</small>Так, генератор працює. У лобі можна зарядити телефон.', top: 206, at: 8.0 },
        { type: 'bub', html: 'Де найближче укриття?', top: 300, at: 8.8 },
        { type: 'bub', side: 'r', html: '<small>ШІ-помічник VDALO</small>Паркінг −1, вхід з двору. Схема — у вашій гостьовій сторінці.', top: 346, at: 9.4 },
        { type: 'chip', html: 'відповіді налаштовуєте ви', top: 452, at: 10.2, cls: 'ok', pos: 'left:24px' }
      ] }
    ]
  });

  // =====================================================================
  // НОВІ РАКУРСИ З ДОСВІДУ ВЛАСНИКА (коди 53–55)
  // =====================================================================
  // simple QR-looking block (decorative, deterministic)
  const qr = (left, top, size) => {
    const n = 21, c = size / n; let cells = '';
    const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on;
      if (finder(x, y)) { const fx = x >= n - 7 ? x - (n - 7) : x, fy = y >= n - 7 ? y - (n - 7) : y; on = fx === 0 || fy === 0 || fx === 6 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
      else on = ((x * 7 + y * 13 + x * y * 3) % 5) < 2;
      if (on) cells += `<rect x="${x * c}" y="${y * c}" width="${c + .3}" height="${c + .3}"/>`;
    }
    return `<div style="position:absolute;left:${left}px;top:${top}px;padding:12px;border-radius:16px;background:#fff;box-shadow:0 0 50px rgba(255,146,189,.45);display:grid;gap:8px;justify-items:center">
      <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px" fill="#22192A">${cells}</svg>
      <b style="font:800 12px var(--vd-display);color:#39233E">Скануйте — заселення тут</b></div>`;
  };

  R('s-qr', {
    title: 'Персонал: QR-заселення на рецепції', group: 'funnel-staff', pain: 'Адміністратор зайнятий — гості стоять у черзі на заселення', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'chip', html: 'п\'ятниця · 18:00', top: 54, pos: 'left:24px', anim: 'fade' },
        { type: 'big', html: 'Адміністратор один.', top: 96, size: 32, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Гостей — шестеро.</em>', top: 140, size: 34, at: .7, anim: 'slam' },
        ...[0, 1, 2, 3, 4, 5].map(i => ({ type: 'person', color: i === 0 ? '#FF92BD' : '#C9B3D3', bag: i > 0, w: 34, at: 1.2 + i * .25, anim: 'pop', shake: i > 0 ? [3.2, 6.4] : null, shakeA: 1.2, pos: `left:${34 + i * 50}px;top:236px` })),
        { type: 'chip', html: 'анкета · паспорт · оплата · ключ', top: 330, at: 2.6, cls: 'bad', pos: 'left:24px' },
        { type: 'bub', html: 'Ми чекаємо вже 20 хвилин…', top: 380, at: 3.6, pos: 'left:60px' },
        { type: 'big', html: 'Гість злий <em class="r">ще до заселення.</em>', top: 466, size: 28, at: 4.8 }
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'QR на рецепції — <em>гість заселяється сам</em>', size: 28 },
        { type: 'html', at: 7.3, anim: 'pop', html: qr(110, 140, 116) },
        { type: 'card', icc: 'p', ic: doc, t: 'Дані й фото документа', s: 'з телефона гостя', top: 330, at: 7.9, check: 8.3 },
        { type: 'card', icc: 'p', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c3-1 4-4 7-4s2 3 5 3 4-2 4-2"/><path d="M15 4l4 4-8 8H7v-4z"/></svg>', t: 'Підпис — пальцем на екрані', s: 'без паперів', top: 386, at: 8.5, check: 8.9 },
        { type: 'card', icc: 'p', ic: I.key, t: 'Номер і інструкції — одразу', s: 'бронь підтверджена', top: 442, at: 9.1, check: 9.5 },
        { type: 'big', html: 'Адміністратор <em>лише видає ключ.</em>', top: 512, size: 26, at: 9.9 }
      ] }
    ]
  });

  const STEPS = [['Бронь', 'підтвердження з цінами'], ['За день', 'як доїхати й де паркінг'], ['За 3 години', 'як зайти в номер'], ['Під час', 'сніданок, сауна — з оплатою'], ['Виїзд', 'куди покласти ключ']];
  R('n-timeline', {
    title: 'Нічні питання: VDALO пише гостю першим', group: 'funnel-nights', pain: 'Адміністратор сотий раз відповідає про Wi-Fi, паркінг і ключі', theme: 'ink',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: 'Сотий раз за місяць:', top: 58, size: 30, at: .1, anim: 'slam' },
        { type: 'bub', html: 'Який пароль Wi‑Fi?', top: 120, at: .8 },
        { type: 'bub', html: 'Де паркінг?', top: 166, at: 1.3, pos: 'left:120px' },
        { type: 'bub', html: 'Як зайти в будинок?', top: 212, at: 1.8 },
        { type: 'bub', html: 'Куди покласти ключ?', top: 258, at: 2.3, pos: 'left:100px' },
        { type: 'bub', html: 'Світло вимикати при виїзді?', top: 304, at: 2.8 },
        { type: 'num', from: 1, to: 100, n1: 1.0, n2: 4.4, top: 372, at: 1.0, cls: 'c r md', label: 'однакових відповідей', fmt: n => `×${Math.round(n)}` },
        { type: 'big', html: 'Ви платите людині <em class="r">за ті самі відповіді.</em>', top: 474, size: 26, at: 4.8 },
        foot('Цифри умовні.', 1)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'VDALO пише гостю <em>раніше, ніж він спитає</em>', size: 28 },
        ...STEPS.map(([w, s], i) => ({ type: 'card', icc: 'p', ic: String(i + 1), t: w, s, top: 150 + i * 56, at: 7.4 + i * .4, check: 7.8 + i * .4 })),
        { type: 'big', html: 'А решту питань — <em>ШІ-помічник.</em>', top: 446, size: 28, at: 9.8 }
      ] }
    ]
  });

  R('o-7eur', {
    title: 'Овербукінг: 7 € за номер лише за синхронізацію', group: 'funnel-overbook', pain: 'Дорога синхронізація каналів або брони з Booking вручну', theme: 'dark',
    segs: [
      { a: 0, b: 6.8, els: [
        { type: 'big', html: '7 € за кожен номер.', top: 58, size: 34, at: .1, anim: 'slam' },
        { type: 'big', html: '<em class="r">Щомісяця.</em>', top: 102, size: 40, at: .6, anim: 'slam' },
        { type: 'big', html: 'Лише щоб Booking і Airbnb бачили одне одного.', top: 156, size: 20, at: 1.1 },
        { type: 'num', from: 0, to: 140, n1: 1.6, n2: 3.4, top: 222, at: 1.4, cls: 'c r md', label: '20 номерів × 7 € на місяць', fmt: n => `${Math.round(n)} €` },
        { type: 'card', icc: 'x', ic: '✕', t: 'Відмовились від підписки?', s: 'адмін переносить брони вручну', top: 340, at: 3.4, anim: 'left' },
        { type: 'chip', html: 'одна помилка в даті = овербукінг', top: 404, at: 4.4, cls: 'bad', pos: 'left:24px', anim: 'pop' },
        { type: 'flash', at: 4.4 },
        { type: 'big', html: '<em class="r">Дорого — або ризиковано.</em>', top: 470, size: 28, at: 5.2 },
        foot('Приклад: 20 номерів.', 1.4)
      ] },
      { a: 7.0, b: 11.7, els: [
        { type: 'cap', html: 'У VDALO канали — <em>частина системи</em>', size: 30 },
        { type: 'card', icc: 'b', ic: 'B', t: 'Booking → календар VDALO', s: 'бронь з\'являється сама', top: 160, at: 7.4, check: 7.9 },
        { type: 'card', icc: 'a', ic: 'A', t: 'Airbnb → календар VDALO', s: 'бронь з\'являється сама', top: 218, at: 8.0, check: 8.5 },
        { type: 'card', icc: 'p', ic: lock, t: 'Номер продано — закрито всюди', s: 'автоматично', top: 276, at: 8.6, check: 9.1 },
        { type: 'big', html: 'Без ручного переносу. <em>Без доплати за кожен номер.</em>', top: 370, size: 26, at: 9.8 }
      ] }
    ]
  });
})();
