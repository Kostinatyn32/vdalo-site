# deploy/

Інфраструктурна тека для сайту VDALO на сервері Hetzner CX33 (178.104.154.106).

## Що тут

Скрипти бутстрапу (`00..04`), Dockerfile сайту, compose-стек з Caddy, автооновлення й моніторинг. Усе підлаштоване під `node server.mjs` з `.env` поряд (сервер читає його сам, коли нема `VERCEL`).

## Порядок разового бутстрапу (виконує deploy або root)

```bash
cd /opt/vdalo/deploy
sudo bash 00-bootstrap.sh
sudo bash 01-firewall.sh
sudo bash 02-docker-caddy.sh
sudo bash 03-limits.sh
sudo bash 04-monitoring.sh
```

Кожен скрипт ідемпотентний — безпечно перезапускати.

## Що потрібно від власника (значень у чаті/git немає)

Два файли секретів живуть на сервері, 600 deploy:deploy. Редагує їх deploy напряму (sudo не треба). `sudoedit` НЕ підходить для `/opt/vdalo/*.env`, бо тека `/opt/vdalo` писабельна для deploy — `sudoedit` відмовить із «cannot open a file in a path writable by the user».

- `/etc/vdalo/alerts.env` — `TG_BOT_TOKEN`, `TG_CHAT_ID` для тривог у Telegram. Створюється й заповнюється командою `sudo /usr/local/sbin/vdalo-alerts setup` (прихований ввід токена, chat_id з Telegram getUpdates). Нічого секретного на екран.
- `/opt/vdalo/site.env` і `/opt/vdalo/site-staging.env` — змінні сайту за `deploy/env.example`. Створюються з шаблону при бутстрапі:

  ```bash
  sudo install -m 600 -o deploy -g deploy /opt/vdalo/deploy/env.example /opt/vdalo/site.env
  sudo install -m 600 -o deploy -g deploy /opt/vdalo/deploy/env.example /opt/vdalo/site-staging.env
  sudo sed -i 's#^VDALO_SITE_URL=.*#VDALO_SITE_URL=https://staging.vdalo.tech#' /opt/vdalo/site-staging.env
  ```

  Далі власник заходить як deploy і правит напряму:

  ```bash
  ssh deploy@178.104.154.106
  nano /opt/vdalo/site.env              # вписати WFP_SECRET_KEY, webhook URL і решту
  nano /opt/vdalo/site-staging.env      # staging — без WFP_SECRET_KEY
  cd /opt/vdalo && sudo -u deploy docker compose -f deploy/compose.yml up -d --no-deps site site-staging
  ```

Пароль staging basic-auth задає окремо:

```bash
sudo /usr/local/sbin/vdalo-staging-auth    # прихований ввід; caddy hash-password → /etc/caddy/staging-auth.conf → reload
```

## Автооновлення

- `vdalo-site-update.service` + `.timer` щохвилини робить `git fetch` і за зміною `main`/`staging` будує в `builds.slice`, прогонить тести, піднімає новий контейнер, робить smoke.
- Відкат: `/opt/vdalo/deploy/rollback.sh <sha>`.

## Перемикання DNS — план (НЕ виконується автоматично)

Див. `SWITCHOVER.md`.
