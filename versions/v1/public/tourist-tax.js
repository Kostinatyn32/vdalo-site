const configElement = document.getElementById('tourist-tax-config');
let config = {};
try { config = JSON.parse(configElement?.textContent || '{}'); } catch {}

const infographic = document.querySelector('.tt-infographic');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (infographic && !reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('tt-motion-ready');
  const infographicObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      infographic.classList.add('is-visible');
      infographicObserver.disconnect();
    }
  }, { threshold: 0.18 });
  infographicObserver.observe(infographic);
} else if (infographic) infographic.classList.add('is-visible');

const places = Array.isArray(config.publicPlaces) ? config.publicPlaces : [];
const searchInputs = document.querySelectorAll('[role="combobox"][aria-controls]');

for (const input of searchInputs) {
  const results = document.getElementById(input.getAttribute('aria-controls'));
  const statusId = input.id === 'tt-calc-place' ? 'tt-calc-place-status' : 'tt-search-status';
  const status = document.getElementById(statusId);
  const form = input.closest('form') || document.getElementById('tourist-tax-calculator');
  const setExpanded = expanded => input.setAttribute('aria-expanded', String(expanded));
  const close = () => { results?.replaceChildren(); if (results) results.style.display = 'none'; setExpanded(false); };

  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('uk-UA');
    results?.replaceChildren();
    if (!query) { close(); if (status) status.textContent = ''; return; }
    const matches = places.filter(place => `${place.name} ${place.region} ${place.district}`.toLocaleLowerCase('uk-UA').includes(query));
    if (!matches.length) {
      close();
      if (status) status.textContent = 'Не знайшли це місто в довіднику. Перевірте написання або виберіть місто зі списку.';
      return;
    }
    for (const place of matches.slice(0, 8)) {
      const option = document.createElement('button');
      option.type = 'button'; option.className = 'tt-place-choice'; option.setAttribute('role', 'option');
      option.textContent = `${place.name} · ${place.region}`;
      option.addEventListener('click', () => {
        input.value = place.name; input.readOnly = true;
        if (form) form.dataset.placeSlug = place.slug;
        close();
        if (status) {
          status.replaceChildren(document.createTextNode('Місце обрано. '));
          const change = document.createElement('button'); change.type = 'button'; change.className = 'tt-change-place'; change.textContent = 'Змінити';
          change.addEventListener('click', () => { input.readOnly = false; input.value = ''; if (form) delete form.dataset.placeSlug; status.textContent = ''; input.focus(); });
          status.append(change);
        }
      });
      results.append(option);
    }
    results.style.display = 'block'; setExpanded(true);
    if (status) status.textContent = '';
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    const options = [...(results?.querySelectorAll('[role="option"]') || [])];
    if (event.key === 'ArrowDown' && options.length) { event.preventDefault(); options[0].focus(); }
    if (event.key === 'Enter' && options.length) { event.preventDefault(); options[0].click(); }
  });
  results?.addEventListener('keydown', event => {
    const options = [...results.querySelectorAll('[role="option"]')];
    const index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && index < options.length - 1) { event.preventDefault(); options[index + 1].focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); index > 0 ? options[index - 1].focus() : input.focus(); }
    if (event.key === 'Escape') { close(); input.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.tt-search-wrap')) close(); });
}

const form = document.getElementById('tourist-tax-calculator');
if (form) {
  const output = document.getElementById('tt-result');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const start = form.elements.start.value;
    const days = Number(form.elements.days.value);
    const domesticGuests = Number(form.elements.domesticGuests.value);
    const inboundGuests = Number(form.elements.inboundGuests.value);
    const exemption = form.elements.exemption.value;
    const placeSlug = form.dataset.placeSlug || config.placeSlug;
    const guestGroups = [{ category: 'domestic', guests: domesticGuests }, { category: 'inbound', guests: inboundGuests }];
    if (!start || !Number.isInteger(days) || days < 1 || days > 366 || guestGroups.some(group => !Number.isInteger(group.guests) || group.guests < 0 || group.guests > 1000) || guestGroups.every(group => group.guests === 0)) {
      output.textContent = 'Перевірте дату, розрахункові доби та кількість гостей. Вкажіть щонайменше одного гостя.';
      return;
    }
    if (!placeSlug) { output.textContent = 'Спершу оберіть населений пункт зі списку.'; return; }
    output.textContent = 'Перевіряємо чинність ставки для цього періоду…';
    try {
      const response = await fetch('/api/tourist-tax/calculate', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placeSlug, start, days, guestGroups, exemption }) });
      const result = await response.json();
      const messages = {
        AMBIGUOUS_PLACE: 'Оберіть населений пункт зі списку, щоб використати його місцеві дані.',
        EXCLUDED_LOCATION: 'Для цього місця калькулятор не публікує розрахунок.',
        RATE_UNVERIFIED: 'Точну суму не показуємо, бо місцеву ставку ще не підтверджено.',
        RATE_OUT_OF_PERIOD: 'Для вказаного періоду немає повністю підтвердженого правила або річної бази.',
        EXEMPTION_NEEDS_EVIDENCE: 'Можливе звільнення. Перевірте підставу й документи з податковим агентом. Не надсилайте документи в калькулятор.',
        SOURCE_CONFLICT: 'У джерелах є розбіжність. Точну суму тимчасово не показуємо.',
        INVALID_INPUT: 'Перевірте дату, розрахункові доби та кількість гостей.'
      };
      if (!response.ok) throw new Error('Request failed');
      if (result.state === 'VERIFIED_RESULT') {
        output.replaceChildren();
        const amount = document.createElement('strong');
        amount.textContent = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(Number(result.totalCents) / 100);
        const groups = result.guestGroups.map(group => `${group.guests} ${group.category === 'domestic' ? 'внутрішнього' : 'в’їзного'} туризму · ${group.ratePercent}%`).join('; ');
        output.append(amount, document.createTextNode(` · ${groups} · ${result.days} розрахункових діб. Інформаційний розрахунок${result.exemptionReviewRequired ? ' до перевірки можливої пільги' : ''}.`));
        const source = document.createElement('a'); source.href = result.sourceUrl; source.rel = 'noopener'; source.textContent = 'Першоджерело місцевої ставки';
        output.append(document.createElement('br'), source, document.createTextNode(` · перевірено ${result.checkedAt}`));
      } else output.textContent = messages[result.state] || 'Не вдалося виконати перевірку. Спробуйте пізніше.';
    } catch { output.textContent = 'Не вдалося зв’язатися з калькулятором. Спробуйте ще раз пізніше.'; }
  });
}
