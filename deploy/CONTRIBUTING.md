# Як працювати з цим репозиторієм

Код сайту пише Костянтин. Інфраструктуру — Oleg (власник) разом із сесією «Сайт».

## Хто що править

**Костянтин — сайт.** Тексти, дизайн, сторінки, ціни, воронки, маршрути. Усе, крім `deploy/`. Переважно `server.mjs`, `versions/`, `microlandings/`, `payments/`, `docs/`, тести у `tests/`.

**Ми — інфра.** `deploy/*`, `/opt/vdalo/site.env`, `/opt/vdalo/site-staging.env`, `/etc/caddy/*`, systemd-таймери сервера, SSH-доступ.

Якщо правка перекриває обидва боки (нова змінна `.env`, новий ендпоінт, що потребує webhook) — інфра спочатку додає шаблон у `deploy/env.example`, потім Костянтин нею користується.

## Workflow Костянтина

1. Створити гілку від `main` (напр. `fix/pricing-copy`).
2. Внести зміни.
3. Відкрити PR до `staging`.
4. Після merge у `staging` таймер на сервері за ~1-2 хв побудує образ, підніме `vdalo-site-staging` і прожене smoke. За провал — відкат на останній зелений образ + тривога у Telegram.
5. Перевірити на `https://staging.vdalo.tech`. Пароль basic-auth — у Oleg (одноразове посилання в месенджері).
6. Коли staging зелений — відкрити PR `staging → main`.
7. Після merge у `main` той самий таймер підніме prod на `https://www.vdalo.tech`. За провал — відкат і тривога.

## Ручні команди на сервері

Заходиш як deploy: `ssh deploy@178.104.154.106` (Oleg керує ключами).

```bash
# Таймер оновлення
sudo systemctl status vdalo-site-update.timer
sudo journalctl -u vdalo-site-update.service --no-pager -n 50

# Форсований прогін оновлення (поза таймером)
sudo systemctl start vdalo-site-update.service

# Відкат вручну
sudo /opt/vdalo/deploy/rollback.sh <7-char-sha> main
sudo /opt/vdalo/deploy/rollback.sh <7-char-sha> staging

# Перезапуск контейнера без ребілда (напр. після правки /opt/vdalo/site.env):
sudo docker compose -f /opt/vdalo/deploy/compose.yml up -d --no-deps --wait site
sudo docker compose -f /opt/vdalo/deploy/compose.yml up -d --no-deps --wait site-staging

# Smoke-тест
bash /opt/vdalo/deploy/vdalo-smoke.sh http://127.0.0.1:8080   # prod
bash /opt/vdalo/deploy/vdalo-smoke.sh http://127.0.0.1:8081   # staging

# Логи
sudo tail -f /var/log/vdalo/update.log
sudo tail -f /var/log/vdalo/alerts.log
docker logs --tail 100 vdalo-site        # або vdalo-site-staging
```

## Інфра-правки (deploy/*) — окремим потоком

Якщо правка в `deploy/*` (Dockerfile, compose, Caddy, скрипти бутстрапу, автооновлювач, env-шаблон) — гілка `infra/*` → PR до `main`, зливає Oleg. Не через `staging`: staging — для правок сайту, щоб Костянтин їх дивився на `staging.vdalo.tech`.

## Куди НЕ пхатися

- Не комітити `.env`, `/opt/vdalo/site*.env`, ключі WFP/Resend/webhook — вони живуть ЛИШЕ в `/opt/vdalo/site.env` і `/opt/vdalo/site-staging.env` на сервері (600 deploy:deploy). У git — тільки `deploy/env.example` з назвами змінних, без значень.
- Не пушити у `main` напряму — тільки через PR (сайт — зі `staging`; інфра — з `infra/*`).
- Не вмикати Vercel-деплой у головну гілку після перемикання DNS (там нічого не живе, крім коду).
- `deploy/*` правлять тільки з інфра-боку. Костянтину туди — через окремий PR і погодження з Oleg.

## Коли щось зламалось

- Build/compose/smoke впали → попередній зелений образ лишається, у Telegram падає тривога, повідомлення в `/var/log/vdalo/update.log` показує, що саме.
- Внутрішній таймер щодвіхвилини перевіряє `127.0.0.1:8080` і `:8081`.
- Зовнішній (після перемикання DNS) — щоп'ять хвилин перевіряє `https://www.vdalo.tech/` крізь Caddy + дату кінця сертифіката (попередження за 14 днів).
- Сильне падіння (сервер висить) — поза моніторингом, Oleg відкриє Hetzner-веб-консоль.

## Контакти

Oleg (власник + інфра), Костянтин (сайт). Сесія «Сайт» у Cowork — пише Oleg, він пересилає рішення Костянтину.
