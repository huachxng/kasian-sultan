# Deploying Kasian Sultan

The site is fully static — HTML, CSS, JS, JSON and fonts. No build step, no server,
no database. Everything in `site/` is what gets served.

Run it locally:

```bash
python3 -m http.server 4173 --directory site
```

## Option A — GitHub Pages (free)

1. Create a repository on GitHub and push this project.
2. Repo → **Settings → Pages**.
3. Source: **Deploy from a branch**. Branch: `main`, folder: **`/site`**.
4. Save. The URL appears within a minute or two.

GitHub Pages' terms allow static, non-commercial sites like this one. There is no
server-side code and no user accounts, so nothing here needs more than static hosting.

## Option B — Cloudflare Pages (free)

1. Sign in at dash.cloudflare.com → **Workers & Pages → Create → Pages**.
2. Choose **Upload assets** and drop the `site/` folder in (or connect the repo).
3. Build command: leave empty. Output directory: `site`.

## Adding a domain later (~$11/year)

Buy the domain (Porkbun's .com renews at the same price it registers at, which is
not true everywhere), then point it at whichever host you picked:

- **GitHub Pages:** add a `CNAME` file containing your domain to `site/`, then set
  the DNS record your repo's Pages settings page tells you to.
- **Cloudflare Pages:** Custom domains → Set up a domain, and follow the prompt.

HTTPS is free and automatic on both.

## The one recurring job

`site/config/**` carries `verified_on` and `review_by` dates. When today's date
passes `review_by`, the site shows a banner telling visitors the figures need
rechecking. Each January, verify the numbers against the Revenue Department's
current filing-guide PDF, update the config, and push the dates forward.

Watch items for the next review are listed in
`docs/research/2026-08-01-research-brief.md` §9 — the Thai ESG enhanced cap ending
31 Dec 2026, the e-filing extension lapsing 31 Jan 2027, TISA, and the pending
foreign-remittance relaxation.

## Artifact preview

`node scripts/build-artifact.mjs` bundles everything into a single
`dist/kasian-sultan.html` with fonts inlined. That file is only for sharing a
preview link — the real site is `site/`.
