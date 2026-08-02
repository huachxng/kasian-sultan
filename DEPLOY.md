# Deploying Kasian Sultan

The site is fully static — HTML, CSS, JS, JSON and fonts. No build step, no server,
no database. Everything in `site/` is what gets served.

Run it locally:

```bash
python3 -m http.server 4173 --directory site
```

## Option A — GitHub Pages (LIVE)

**https://huachxng.github.io/kasian-sultan/**

Repo: https://github.com/huachxng/kasian-sultan

GitHub Pages only publishes from a repository's root or its `/docs` folder — it
cannot publish from `/site`. So `main` keeps the tidy layout and the **contents of
`site/` are pushed to a `gh-pages` branch**, whose root Pages serves.

### Publishing an update

Commit your change to `main` as usual, then:

```bash
git subtree push --prefix site origin gh-pages
```

That is the whole deploy. Pages rebuilds in a minute or so. If that command is ever
rejected because the branches diverged, force a clean replacement:

```bash
git push origin `git subtree split --prefix site main`:gh-pages --force
```

GitHub Pages' terms allow static, non-commercial sites like this one. There is no
server-side code and no user accounts, so nothing here needs more than static hosting.

## Option B — Cloudflare Pages (optional, better latency in Thailand)

Not required — GitHub Pages above already serves the site. The reason to add
Cloudflare is that its edge network is considerably closer to Bangkok than
GitHub's, so the site loads faster for a Thai audience.

Connecting the repo is the least work and keeps deploys automatic:

1. Sign in at dash.cloudflare.com → **Workers & Pages → Create → Pages →
   Connect to Git**.
2. Authorise GitHub, pick **`kasian-sultan`**.
3. Settings — this is the part that matters:
   - Production branch: **`main`**
   - Framework preset: **None**
   - Build command: **leave empty**
   - Build output directory: **`site`**
4. Save and Deploy.

Unlike GitHub Pages, Cloudflare *can* publish from a subfolder, so it builds
straight off `main` and the `gh-pages` branch is irrelevant to it.

If you would rather not connect Git, choose **Upload assets** instead and drop in
the contents of `site/` — but then every update is a manual re-upload.

## Adding a domain later (~$11/year)

Buy the domain (Porkbun's .com renews at the same price it registers at, which is
not true everywhere), then point it at whichever host you picked:

- **GitHub Pages:** add a `CNAME` file containing your domain to `site/`, then set
  the DNS record your repo's Pages settings page tells you to.
- **Cloudflare Pages:** Custom domains → Set up a domain, and follow the prompt.

HTTPS is free and automatic on both.

## Editing the Thai text without touching code

**https://kasian-sultan.pages.dev/edit.html**

Every Thai sentence on the site, shown next to its English original in a plain text
box. Search for the phrase you want, fix it, press **Download th.json**, then replace
`site/locales/th.json` in the repository with the downloaded file.

The page is read-only against the live site — editing there changes nothing until the
file is committed, so it is safe to experiment. It cannot produce broken JSON either:
the file is rebuilt from the real structure rather than typed by hand.

To replace the file without using a terminal: open
https://github.com/huachxng/kasian-sultan/blob/main/site/locales/th.json → the pencil
icon → select all → paste the new contents → **Commit changes**. Cloudflare redeploys
by itself; for GitHub Pages, run the `git subtree push` line above.

The page is `noindex`, so search engines will not list it.

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
