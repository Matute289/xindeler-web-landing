# Downloads subdomain page — design

## Goal

`https://downloads.xindeler.com/` currently 404s. It should show a page equivalent to the landing's "Únete a la Aventura" download section, but headlined "Descarga"/"Download" instead, with a header that links back to `xindeler.com`. Reuse the real `DownloadSection.jsx` component (same auto-detect button + manual fallback list, same visual design) rather than a hand-written duplicate, so the two surfaces never drift apart.

## Confirmed VPS context

```
server {
    server_name downloads.xindeler.com;
    root /srv/xindeler/downloads/public;
    index index.html;
    location / {
        limit_req zone=zone_web burst=20 nodelay;
        limit_req_status 429;
        try_files $uri =404;
    }
    ...
}
```

- Purely static (`try_files $uri =404`, no SPA fallback, no `/api/` proxy).
- `/srv/xindeler/downloads/public/releases/<version>/...` and `/srv/xindeler/downloads/public/latest.json` are already populated by `xindeler-new-horizon`'s own release pipeline (NH-58) — **any deploy we add to this root must never delete what's already there.**

## Frontend: a second Vite entry point

`xindeler-web-landing` is a single-page app (`index.html` → `src/main.jsx` → `App.jsx`, client routing via `react-router-dom` for same-origin pages like `/account`). `downloads.xindeler.com` is a different origin entirely, so client routing doesn't apply there — this needs its own, separate, minimal HTML entry rather than a route inside `App.jsx`.

**New files:**
- `downloads.html` (repo root, sibling of `index.html`) — own `<title>`/meta (not the main site's SEO tags), `<div id="root">`, `<script type="module" src="/src/downloads-main.jsx">`.
- `src/downloads-main.jsx` — entry point: imports `./i18n`, `./index.css`, mounts `<DownloadsPage />` with `createRoot`. No `BrowserRouter` (nothing on this page navigates client-side).
- `src/pages/DownloadsPage.jsx` — `<div className="min-h-screen bg-x-dark"><DownloadsHeader /><DownloadSection apiBase="https://xindeler.com/api" heading={t('downloadsPage.title')} eyebrow={t('downloadsPage.eyebrow')} /></div>`. No Navbar, no Footer, no other landing sections — matches the request ("igual a la parte de Únete a la Aventura... con un header").
- `src/components/DownloadsHeader.jsx` — new, small, standalone (does **not** reuse `Navbar.jsx`, which is tightly coupled to in-page anchor scrolling, the auth modal, and `react-router-dom`'s `Link`, none of which apply here). Fixed top bar, same dark/gold styling: "XINDELER" wordmark as a plain `<a href="https://xindeler.com">` (cross-origin, so a plain anchor, not a router `Link`) + `<LanguageSwitcher />` (already self-contained, no router dependency — reused as-is).

**`vite.config.js`:** add `build.rollupOptions.input: { main: 'index.html', downloads: 'downloads.html' }` so both entries build in one `npm run build`.

**`DownloadSection.jsx` changes (minimal, additive):**
- New optional prop `apiBase` (default `'/api'`, used in place of the current hardcoded `const WEB_API = '/api'`) — the landing keeps calling same-origin `/api/download`; this page calls `https://xindeler.com/api/download` cross-origin.
- New optional props `heading`/`eyebrow` (plain strings) that override the `t('download.title')`/`t('download.eyebrow')` text when provided; the landing's own usage (`<DownloadSection />`, no props) is unaffected.

**New i18n keys** (`es`/`en`, both locale files): `downloadsPage.title` ("Descarga" / "Download"), `downloadsPage.eyebrow` — short, reuses the existing `download.eyebrow` tone ("Comienza tu Viaje" / "Begin Your Journey") rather than inventing new copy, since the eyebrow isn't part of what Matías asked to change.

## Backend: CORS

`xindeler-web-api`'s `cors_origin()` (`server/src/web.rs`) gets one more hardcoded match arm: `"https://downloads.xindeler.com" => Some("https://downloads.xindeler.com"),`. No other change — `/api/download` already exists and needs nothing download-page-specific.

Since `xindeler-web-api` has no automatic CD, this only takes effect once someone cuts a tag and runs `deploy/deploy.sh` on the VPS after merge — flag this explicitly when the PR is ready, don't let it look "live" just because it's merged.

## Deploy: new rsync step, additive only

`.github/workflows/deploy.yml` gets one more step after the existing build, in the same job (reusing the SSH key already staged by the existing step):

```yaml
- name: Deploy downloads page to VPS
  run: |
    rsync -avz \
      -e "ssh -i ~/.ssh/deploy_key" \
      dist/downloads.html "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${{ secrets.VPS_DOWNLOADS_DEPLOY_PATH }}/index.html"
    rsync -avz \
      -e "ssh -i ~/.ssh/deploy_key" \
      dist/assets/ "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${{ secrets.VPS_DOWNLOADS_DEPLOY_PATH }}/assets/"
```

New secret: `VPS_DOWNLOADS_DEPLOY_PATH` = `/srv/xindeler/downloads/public`. Deliberately **no `--delete` anywhere in this step** — the existing main-site deploy step keeps `--delete` (it owns that entire tree), this new step only adds/updates files and must never touch `releases/`/`latest.json`.

**Accepted trade-off:** since both `index.html` and `downloads.html` are built into the same `dist/` in one Vite run, `dist/assets/` contains chunks for *both* pages (shared vendor chunks like React/i18next, plus each page's own small entry chunk). This step uploads the whole `dist/assets/` directory to the downloads root, meaning a few hundred KB of assets specific to the main landing page end up there unused. Simpler pipeline, never referenced/fetched by anyone visiting `downloads.xindeler.com` (nothing links to those chunk URLs from `downloads.html`), so no functional or security downside — just a bit of wasted disk on the VPS. Not worth a fully isolated build for a low-traffic utility page.

## Out of scope

- Any change to `xindeler-new-horizon`'s own publish job or the `releases/`/`latest.json` structure it maintains.
- A SPA fallback / additional routes on `downloads.xindeler.com` — it's one static page.
- Analytics on this page (the main landing's `Analytics.jsx` is gated behind cookie consent UI that doesn't exist here; not requested).
