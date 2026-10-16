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

Файли, у які власник сам впише значення через `sudoedit`:

- `/etc/vdalo/alerts.env` — `TG_BOT_TOKEN`, `TG_CHAT_ID` для тривог у Telegram.
- `/opt/vdalo/site.env` і `/opt/vdalo/site-staging.env` — змінні сайту за `deploy/env.example`.

Шаблон одного рядка на кожне:

```bash
sudo install -m 600 -o deploy -g deploy /dev/null /etc/vdalo/alerts.env && sudoedit /etc/vdalo/alerts.env
sudo install -m 600 -o deploy -g deploy /dev/null /opt/vdalo/site.env         && sudoedit /opt/vdalo/site.env
sudo install -m 600 -o deploy -g deploy /dev/null /opt/vdalo/site-staging.env && sudoedit /opt/vdalo/site-staging.env
```

## Автооновлення

- `vdalo-site-update.service` + `.timer` щохвилини робить `git fetch` і за зміною `main`/`staging` будує в `builds.slice`, прогонить тести, піднімає новий контейнер, робить smoke.
- Відкат: `/opt/vdalo/deploy/rollback.sh <sha>`.

## Перемикання DNS — план (НЕ виконується автоматично)

Див. `SWITCHOVER.md`.
