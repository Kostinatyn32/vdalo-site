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

На сервері (deploy заходить, редагує pull-ом з гілки `infra/hetzner` або вручну за потреби):

```caddyfile
www.vdalo.tech, vdalo.tech {
	import common_headers
	encode zstd gzip
	@apex host vdalo.tech
	redir @apex https://www.vdalo.tech{uri} 308
	reverse_proxy 127.0.0.1:8080 {
		header_up Host {host}
		header_up X-Real-IP {remote_host}
	}
	log {
		output file /var/log/caddy/www.vdalo.tech.log { roll_size 10mb roll_keep 10 }
	}
}
```

`sudo caddy fmt --overwrite /etc/caddy/Caddyfile && sudo systemctl reload caddy` — Caddy видасть сертифікати Let's Encrypt для `vdalo.tech` і `www.vdalo.tech`.

## Крок 4. Перевірити

```bash
curl -I https://www.vdalo.tech/
curl -I https://vdalo.tech/        # має віддати 308 на www
curl -s -X POST https://www.vdalo.tech/api/funnel/leads -H 'Content-Type: application/json' --data '{"name":"x","contact":"a@b.co","consent":true}'
```

Форма приймається (навіть 503 на відсутній вебхук — це нормально).

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
