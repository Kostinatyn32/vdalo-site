# VDALO site

The root (`/`) serves the selected first design. `/v1/` remains available as an alias. Alternate designs are preserved locally in `design-archive/alternate-versions/` and are not served as public pages. Funnels remain available at `/funnel` and their individual offer routes.

Run locally: `npm start` (port 4185). No npm dependencies.

Vercel: Node.js 24, standard `server.mjs` entrypoint, no static build. Public assets are bundled and served by the allowlisted router.

Git deployments are enabled for the connected Vercel project.

Domain: attach `vdalo.tech` and `www.vdalo.tech` to this project after a successful deployment. Use only the DNS values shown by that exact Vercel project. In EuroDNS, change only matching web records; retain MX, SPF, DKIM and other unrelated records. Domain registration stays at EuroDNS.

`VDALO_SITE_URL=https://www.vdalo.tech` establishes the allowed production form origin. Lead webhooks and tokens go in Vercel environment variables, never in Git. Until a receiving webhook is configured, forms return an honest unavailable message. Complete privacy/operator information before launch. Rate limiting inherited from local server is per function instance, not a global durable limit.

Deployment reference: https://vercel.com/docs/functions/runtimes/node-js
