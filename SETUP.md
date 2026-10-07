# VDALO setup status — 7 October 2026

GitHub private repository: https://github.com/Kostinatyn32/vdalo-site

Vercel project: https://vercel.com/kostiantyn-tripailo-s-projects/vdalo-site

Project ID: prj_Tfe65naXMSxOKKxnIPIgIrLU9e7K

Git connection: Kostinatyn32/vdalo-site, main. Auto-deployment is disabled until the third version is ready. No Production Deployment exists.

The domains vdalo.tech and www.vdalo.tech have been added to the Vercel project. The user explicitly chose to switch DNS after version 3 is ready. EuroDNS draft changes were reset; existing parking records remain active.

## DNS required by this exact Vercel project

| Type | Host | Target |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| CNAME | www | 77dfde48192d38b2.vercel-dns-017.com. |

Recheck these values in the Vercel Domains page at launch. Save in EuroDNS only after the site is deployed and the user’s chosen publication condition is met.

Current EuroDNS values (unchanged): apex A=185.53.179.145, TTL 10m; wildcard CNAME=825610.parkingcrew.net., TTL 10m. No other zone records were observed. Do not change nameservers or unrelated records.

## Remaining work

1. Create version 3 and add `/v3/` to the comparison router.
2. Final review and receiving webhook/privacy setup.
3. Enable deployment, configure production origin, deploy, confirm Vercel routing/assets/forms.
4. Save the DNS records above and confirm domain/HTTPS validation.

No third-party paid plan, new account, domain transfer, DNSSEC change or new access grant was activated.
