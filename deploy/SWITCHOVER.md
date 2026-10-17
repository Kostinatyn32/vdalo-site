# План перемикання DNS: Vercel → Hetzner

**НЕ ВИКОНУЄТЬСЯ АВТОМАТИЧНО.** Це покрокова інструкція для власника; записи DNS міняєш через картку контролера за звичайним порядком.

## Передумови (мають бути ✓ до старту)

- [ ] `new.vdalo.tech` і `staging.vdalo.tech` вже вказують на `178.104.154.106`.
- [ ] `https://new.vdalo.tech/` відповідає 200, HTTPS від Let's Encrypt виданий.
- [ ] `deploy/vdalo-vercel-diff.sh` показує 0 розбіжностей (або всі перелічені в звіті).
- [ ] Форми з `https://new.vdalo.tech/*` приймаються (див. нижче — пункт про CORS/Origin).
- [ ] WayForPay-кабінет: `WFP_MERCHANT_DOMAIN=www.vdalo.tech` і сайт на Hetzner для оплат нічого не потребує змінювати в кабінеті (адреса платежів лишається та сама — продакшн).

## Крок 1. Знизити TTL за добу

У EuroDNS за записами `A @` і `CNAME www` виставити TTL 300 (5 хв). За 24 год кеші резолверів оновляться і можна перемикати швидко.

## Крок 2. Поміняти записи

Для Hetzner-сервера:

| Type | Host | Target |
|---|---|---|
| A | @ | 178.104.154.106 |
| A | www | 178.104.154.106 |

**Прибрати:** попередні записи A @ (Vercel) і CNAME www (Vercel). Інші записи зони не чіпати.

## Крок 3. Додати основні домени у Caddyfile

На сервері як deploy:

```bash
sudo bash -c 'cat /opt/vdalo/deploy/caddy-prod.snippet >>/etc/caddy/Caddyfile'
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Блок `www.vdalo.tech, vdalo.tech {…}` живе в `deploy/caddy-prod.snippet` і НЕ активований до цього моменту. HSTS там `max-age=63072000` без `includeSubDomains` і `preload` — так само, як зараз віддає Vercel, щоб перемикання не змінило поведінку браузерів для інших піддоменів `vdalo.tech`. Включити `includeSubDomains`/`preload` — окремим рішенням пізніше.

Caddy одразу спробує видати сертифікати Let's Encrypt для `www.vdalo.tech` і `vdalo.tech` — за умови, що DNS уже вказує на `178.104.154.106` (крок 2).

## Крок 4. Перевірити

**4.1. Smoke-GET:**

```bash
curl -I https://www.vdalo.tech/      # 200
curl -I https://vdalo.tech/           # 308 → https://www.vdalo.tech/
curl -s https://www.vdalo.tech/sitemap.xml | head -5
```

**4.2. Увімкнути зовнішній моніторинг через Caddy + сертифікат.** `health`-таймер бʼє в localhost і не бачить Caddy/DNS/TLS. Додатковий таймер хибить публічно щоп'ять хвилин:

```bash
sudo cp /opt/vdalo/deploy/vdalo-external-health.service /etc/systemd/system/
sudo cp /opt/vdalo/deploy/vdalo-external-health.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vdalo-external-health.timer
```

Він тисне `curl https://www.vdalo.tech/` + читає кінець сертифіката (попередження коли < 14 днів до експірації). Безкоштовний зовнішній монітор не підняв: Caddy сам поновлює LE за 30 днів до закінчення, а внутрішній timer покриває обрив процесу/мережі; зовнішню „вся коробка впала" точку (напр., UptimeRobot free) можна додати пізніше одним акаунтом.

**4.3. Форми ДОХОДЯТЬ до вебхука (не просто 200).** Відправка не рівняється прийняттю; треба підтвердження Костянтина, що заявка з Hetzner прийшла туди ж, куди з Vercel (CRM / Telegram / поштова скринька, що він використовує).

```bash
curl -s -X POST https://www.vdalo.tech/api/funnel/leads \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://www.vdalo.tech' \
  --data '{"name":"TEST Hetzner switchover","contact":"test@example.com","consent":true,"source":"switchover"}'
# очікується 200 + {ok:true,leadId:…}
```

Повторити для `/api/funnels/top5` і решти форм, що є на сайті.

**503 на цьому етапі = зупинити перемикання і зробити «відкат за 5 хв» (нижче).** Це означає, що в `/opt/vdalo/site.env` немає `VDALO_FUNNEL_WEBHOOK_URL` / `VDALO_LEAD_WEBHOOK_URL` або `VDALO_WEBHOOK_BEARER_TOKEN` — тобто заявки з Hetzner нікуди не йдуть, і кожна відвідувацька заявка пропадає.

## Відкат за 5 хв

Якщо перевірки з кроку 4 не пройшли або сайт поводиться дивно після перемикання, відкочуємо DNS, НЕ видаляючи деплой Vercel (він лишається живим без змін).

| # | Хто | Що |
|---|---|---|
| 1 | Контролер за карткою | У EuroDNS повернути попередні записи: `A @ → 216.198.79.1`, `CNAME www → 77dfde48192d38b2.vercel-dns-017.com.` |
| 2 | Власник | Переконатися, що проєкт Vercel у статусі Ready і домени `vdalo.tech`, `www.vdalo.tech` досі прив'язані до нього. |
| 3 | Я (ця сесія) | На Hetzner видалити з `/etc/caddy/Caddyfile` блок із `caddy-prod.snippet`, `systemctl reload caddy`, лишити сервер живим із `new.vdalo.tech`/`staging.vdalo.tech`. |
| 4 | Я | Повідомити у звіті, що саме не пройшло, і запропонувати фікс до наступної спроби. |

TTL уже 300 (крок 1), тож DNS-кеш оновиться за ~5 хв. 7 днів вікна з Vercel у резерві (крок 5) залишаються.

## Крок 5. Vercel — запасний на 7 днів

Vercel-проєкт лишити живим без змін ще 7 днів. Якщо з'являться скарги або CI-алерт по сайту — переключити DNS назад на старі значення (ось чому крок 1 важливий).

## Крок 6. Відключити Vercel

Через тиждень:

- У Vercel: видалити домен `vdalo.tech` і `www.vdalo.tech` з проєкту.
- У проєкті Vercel відключити auto-deployment з Git (щоб коміт не їхав туди).
- Проєкт лишити архівним.

## Крок 7. Перенести репозиторій

- Переносимо `Kostinatyn32/vdalo-site` в організацію GitHub `VDALO`, приватним.
- На Hetzner: оновити `remote` у `/opt/vdalo/repo` на нове місце; додати deploy-key тільки на читання.

```bash
sudo -u deploy git -C /opt/vdalo/repo remote set-url origin git@github.com:VDALO/vdalo-site.git
sudo -u deploy ssh-keygen -t ed25519 -N "" -f /home/deploy/.ssh/github_vdalo
# Публічний ключ /home/deploy/.ssh/github_vdalo.pub додати як Deploy Key (Read-only) у Settings репозиторію.
```

## Відомі питання

- **Форми з `new.vdalo.tech`.** Оригінальна перевірка `versions/v1/server.mjs:57` будує allowed-set з `configuredOrigin()` (з `VDALO_SITE_URL`) і `http://${host}`. Коли `VDALO_SITE_URL=https://www.vdalo.tech`, форми з www.vdalo.tech за проксі приймаються ✓. Для `new.vdalo.tech` POST-и будуть відхилятись (403). Під час тестування або (а) ставити тимчасово `VDALO_SITE_URL=https://new.vdalo.tech` у `site.env`, або (б) обмежитися GET/рендером; це не блокує перемикання, бо після перемикання домен стане `www.vdalo.tech`.
- **WayForPay.** `WFP_MERCHANT_DOMAIN` і адреси callback лишаються `www.vdalo.tech` і після перемикання продовжують працювати — у кабінеті WFP нічого міняти не треба (адреса сайту ж не змінюється).
