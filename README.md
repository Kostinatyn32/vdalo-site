# VDALO comparison site

One repository and Vercel project, with `/v1/` and `/v2/`. The root is a design comparison page. `/v3/` is reserved in the presentation until the third design is created. No public deployment or DNS change has been made by preparing these files.

Run locally: `npm start` (port 4185). No npm dependencies.

Vercel: Node.js 24, standard `server.mjs` entrypoint, no static build. Public assets are bundled and served by the allowlisted router. Comparison pages stay noindex until the final design is selected.

Automatic Git deployments are disabled with `git.deploymentEnabled=false` while the third design is being prepared. Enable this when publication is authorized. The cloud project and Git repository can be connected without publishing unfinished designs.

Domain: attach `vdalo.tech` and `www.vdalo.tech` to this project after a successful deployment. Use only the DNS values shown by that exact Vercel project. In EuroDNS, change only matching web records; retain MX, SPF, DKIM and other unrelated records. Domain registration stays at EuroDNS.

`VDALO_SITE_URL=https://vdalo.tech` establishes the allowed production form origin. Lead webhooks and tokens go in Vercel environment variables, never in Git. Until a receiving webhook is configured, forms return an honest unavailable message. Complete privacy/operator information before launch. Rate limiting inherited from local server is per function instance, not a global durable limit.

Deployment reference: https://vercel.com/docs/functions/runtimes/node-js
