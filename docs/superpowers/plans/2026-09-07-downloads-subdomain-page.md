# Downloads Subdomain Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `https://downloads.xindeler.com/` serve a real page (it currently 404s) — a minimal header linking back to `xindeler.com` plus the real `DownloadSection` component, headlined "Descarga"/"Download" instead of "Únete a la Aventura".

**Architecture:** `xindeler-web-landing` gains a second Vite HTML entry (`downloads.html` → `src/downloads-main.jsx` → `src/pages/DownloadsPage.jsx`), built alongside the existing `index.html` in the same `npm run build`. `DownloadSection.jsx` gains three optional props (`apiBase`, `heading`, `eyebrow`) so the same component works unmodified on the main landing and, parametrized, on the downloads page (which is cross-origin from `xindeler-web-api`, so it can't use the landing's relative `/api`). `deploy.yml` gains one more rsync step (no `--delete`) that pushes the new page's build output to the downloads VPS root without touching the `releases/`/`latest.json` that `xindeler-new-horizon`'s own release pipeline already maintains there. Separately, `xindeler-web-api`'s CORS allowlist gains the new origin.

**Tech Stack:** React + Vite + Tailwind + i18next + react-i18next (`xindeler-web-landing`); Rust (`xindeler-web-api`, one-line CORS change).

Design: `docs/superpowers/specs/2026-09-07-downloads-subdomain-page-design.md`

## Global Constraints

- Never push to `main` directly in either repo — feature branch + PR, wait for Mati's go-ahead to merge.
- No comments except where the WHY is non-obvious.
- `xindeler-web-api`: `cargo test`, `cargo clippy --all-targets`, `cargo fmt --check` must all pass.
- `xindeler-web-landing`: `npm run lint` and `npm run build` must both pass (this repo has no component tests for anything under `src/components/` or `src/pages/` — see `src/lib/*.test.js` for the only existing test pattern, pure functions only. Verification for UI changes here is manual in-browser, per this repo's own established convention).
- `deploy.yml`'s new step must never pass `--delete` — the downloads VPS root (`/srv/xindeler/downloads/public`) already holds `releases/` and `latest.json` published independently by `xindeler-new-horizon`, and this deploy must never be able to remove them.
- `xindeler-web-api` has no automatic CD (unlike `xindeler-web-landing`) — merging its PR does not deploy anything. Flag this explicitly when reporting the PR as ready, don't imply it's live.

---

### Task 1: `xindeler-web-api` — allow the `downloads.xindeler.com` CORS origin

**Files:**
- Modify: `server/src/web.rs`

**Interfaces:**
- Produces: `cors_origin()` now also accepts `Origin: https://downloads.xindeler.com`. Nothing downstream in this repo depends on this — it only matters to the frontend task in this same plan (Task 3), which calls `xindeler-web-api` cross-origin from that host.

- [ ] **Step 1: Write the failing test**

In `server/src/web.rs`, inside `mod tests` (see `cors_origin_only_allows_known_origins`, around line 273), extend that existing test rather than adding a new one — it already asserts the allow-list shape:

```rust
    #[test]
    fn cors_origin_only_allows_known_origins() {
        let allowed = Request::fake("GET", "/ping").with_header("Origin", "https://xindeler.com");
        assert_eq!(cors_origin(&allowed), Some("https://xindeler.com"));

        let downloads =
            Request::fake("GET", "/ping").with_header("Origin", "https://downloads.xindeler.com");
        assert_eq!(cors_origin(&downloads), Some("https://downloads.xindeler.com"));

        let unknown =
            Request::fake("GET", "/ping").with_header("Origin", "https://evil.example.com");
        assert_eq!(cors_origin(&unknown), None);
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo test --lib web::tests::cors_origin_only_allows_known_origins` (adjust the path prefix if this crate's test harness needs `--bin xindeler-web-api-server`, matching this repo's own precedent for binary-only crates).
Expected: FAIL — `cors_origin(&downloads)` returns `None`, not `Some(...)`.

- [ ] **Step 3: Add the allow-list entry**

In `server/src/web.rs`, in `cors_origin()`:

```rust
fn cors_origin(request: &Request) -> Option<&'static str> {
    match request.header("Origin")? {
        "https://xindeler.com" => Some("https://xindeler.com"),
        "https://www.xindeler.com" => Some("https://www.xindeler.com"),
        "https://downloads.xindeler.com" => Some("https://downloads.xindeler.com"),
        "http://localhost:5173" => Some("http://localhost:5173"),
        "http://127.0.0.1:5173" => Some("http://127.0.0.1:5173"),
        _ => None,
    }
}
```

- [ ] **Step 4: Run the test again, then the full check**

Run: `cargo test --lib web::tests::cors_origin_only_allows_known_origins`
Expected: PASS.

Run: `cargo test && cargo clippy --all-targets && cargo fmt --check`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/downloads-subdomain-cors
git add server/src/web.rs
git commit -m "feat(web-api): allow CORS from downloads.xindeler.com"
```

- [ ] **Step 6: Open the PR**

```bash
git push -u origin feat/downloads-subdomain-cors
gh pr create --title "feat: allow CORS from downloads.xindeler.com" --body "$(cat <<'EOF'
## Summary
- `cors_origin()` now also accepts `https://downloads.xindeler.com`, needed by the new downloads landing page (companion PR in `xindeler-web-landing`) which calls `GET /api/download` cross-origin.

Design: `docs/superpowers/specs/2026-09-07-downloads-subdomain-page-design.md` (in `xindeler-web-landing`)

## Test plan
- [x] `cargo test`
- [x] `cargo clippy --all-targets`
- [x] `cargo fmt --check`

## Note
This repo has no automatic CD — merging this does not deploy it. A tag + `deploy/deploy.sh` run on the VPS is still needed afterwards.
EOF
)"
```

Do not merge — wait for Mati's go-ahead. Note in your final report that this repo's deploy is manual (tag + `deploy/deploy.sh`), so downloads.xindeler.com's API calls will keep failing CORS until that happens even after merge.

---

### Task 2: `xindeler-web-landing` — make `DownloadSection.jsx` reusable across origins

**Files:**
- Modify: `src/components/DownloadSection.jsx`

**Interfaces:**
- Produces: `DownloadSection` now accepts optional props `apiBase` (string, default `'/api'`), `heading` (string, overrides `t('download.title')` when given), `eyebrow` (string, overrides `t('download.eyebrow')` when given). Consumed by Task 3's `DownloadsPage.jsx`. The existing zero-prop usage in `src/App.jsx` (`<DownloadSection />`) is unaffected — all three props are optional with the current behavior as the default.

- [ ] **Step 1: Update the module-level constant and `resolveDownload`**

In `src/components/DownloadSection.jsx`, replace:

```js
const WEB_API = '/api';
```

with:

```js
const DEFAULT_API_BASE = '/api';
```

Replace the `resolveDownload` function:

```js
async function resolveDownload(params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  try {
    const res = await fetch(`${WEB_API}/download${query}`);
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}
```

with:

```js
async function resolveDownload(apiBase, params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  try {
    const res = await fetch(`${apiBase}/download${query}`);
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}
```

- [ ] **Step 2: Update the component signature and its two call sites**

Replace:

```js
export default function DownloadSection() {
  const { t } = useTranslation();
```

with:

```js
export default function DownloadSection({ apiBase = DEFAULT_API_BASE, heading, eyebrow } = {}) {
  const { t } = useTranslation();
```

Inside `handleAutoDownload`, replace `const result = await resolveDownload();` with `const result = await resolveDownload(apiBase);`.

Inside `handleManualDownload`, replace `const result = await resolveDownload({ os, arch });` with `const result = await resolveDownload(apiBase, { os, arch });`.

- [ ] **Step 3: Use the heading/eyebrow overrides in the JSX**

Replace:

```jsx
          <p className="section-eyebrow">{t('download.eyebrow')}</p>
```

with:

```jsx
          <p className="section-eyebrow">{eyebrow ?? t('download.eyebrow')}</p>
```

Replace:

```jsx
            {t('download.title')}
```

with:

```jsx
            {heading ?? t('download.title')}
```

- [ ] **Step 4: Manually verify the main landing page is unaffected**

Run `npm run dev`, open the landing, scroll to the download section. Confirm it still reads "Únete a la Aventura" / "Comienza tu Viaje" (or the English equivalents with the language switcher), the auto-detect button and manual grid still work exactly as before. This step exists only to catch a regression in Task 3's default-prop wiring — no behavior is intended to change here.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git checkout -b feat/downloads-subdomain-page
git add src/components/DownloadSection.jsx
git commit -m "feat: make DownloadSection's API base and heading overridable"
```

(Stay on this branch for Tasks 3 and 4 — this is one cohesive PR, not three.)

---

### Task 3: `xindeler-web-landing` — the downloads page itself (header, page, entry point, i18n)

**Files:**
- Create: `src/components/DownloadsHeader.jsx`
- Create: `src/pages/DownloadsPage.jsx`
- Create: `src/downloads-main.jsx`
- Create: `downloads.html` (repo root, sibling of `index.html`)
- Modify: `vite.config.js`
- Modify: `src/locales/es/translation.json`
- Modify: `src/locales/en/translation.json`

**Interfaces:**
- Consumes: `DownloadSection` from Task 2 (`apiBase`/`heading`/`eyebrow` props), `LanguageSwitcher` from `src/components/LanguageSwitcher.jsx` (existing, unmodified, no router dependency — reused as-is).
- Produces: a working `downloads.html` build output, consumed by Task 4 (deploy step).

- [ ] **Step 1: Add the new i18n keys**

In `src/locales/es/translation.json`, immediately after the `download` object's closing brace (the line reading `"free": "Gratis para Siempre"` is the last entry in that block, at line 364 — add the new block right after its closing `},`):

```json
  "downloadsPage": {
    "eyebrow": "Comienza tu Viaje",
    "title": "Descarga"
  },
```

In `src/locales/en/translation.json`, at the matching location (after `"free": "Free Forever"`):

```json
  "downloadsPage": {
    "eyebrow": "Begin Your Journey",
    "title": "Download"
  },
```

- [ ] **Step 2: Create `DownloadsHeader.jsx`**

```jsx
import LanguageSwitcher from './LanguageSwitcher';

export default function DownloadsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-x-dark/95 backdrop-blur-md border-b border-white/5">
      <nav className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16 md:h-20">
        <a
          href="https://xindeler.com"
          className="font-cinzel-dec text-xl md:text-2xl font-bold text-white hover:text-x-gold transition-colors duration-300"
          style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
        >
          XINDELER
        </a>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

This is deliberately not a reuse of `src/components/Navbar.jsx` — that component is tightly coupled to in-page anchor scrolling, the auth modal, and `react-router-dom`'s `Link`, none of which apply on this cross-origin, single-section page.

- [ ] **Step 3: Create `DownloadsPage.jsx`**

```jsx
import { useTranslation } from 'react-i18next';
import DownloadsHeader from '../components/DownloadsHeader';
import DownloadSection from '../components/DownloadSection';

const API_BASE = 'https://xindeler.com/api';

export default function DownloadsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-x-dark">
      <DownloadsHeader />
      <main className="pt-16 md:pt-20">
        <DownloadSection
          apiBase={API_BASE}
          heading={t('downloadsPage.title')}
          eyebrow={t('downloadsPage.eyebrow')}
        />
      </main>
    </div>
  );
}
```

The `pt-16 md:pt-20` on `<main>` matches the fixed header's own `h-16 md:h-20` (same values `Navbar.jsx` uses for its own height) so the download section doesn't render underneath it.

- [ ] **Step 4: Create `src/downloads-main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import DownloadsPage from './pages/DownloadsPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DownloadsPage />
  </StrictMode>
);
```

No `BrowserRouter` here (unlike `src/main.jsx`) — nothing on this page does client-side routing.

- [ ] **Step 5: Create `downloads.html`**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Descargar Xindeler</title>
    <meta name="description" content="Descargá el cliente de Xindeler para Windows, macOS o Linux." />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://downloads.xindeler.com/" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Cinzel+Decorative:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/downloads-main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Wire the second entry into `vite.config.js`**

In `vite.config.js`, replace:

```js
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
```

with:

```js
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          downloads: 'downloads.html',
        },
      },
    },
  }
})
```

- [ ] **Step 7: Build and manually verify both pages**

Run: `npm run build`
Expected: exits 0, and `dist/downloads.html` exists alongside `dist/index.html` (`ls dist/*.html` should show both).

Run: `npm run preview`, then open the preview server's URL with `/downloads.html` appended (Vite's preview serves multi-page builds by their built filename — there is no dev-server rewrite to `/downloads` as a clean path, since nginx in production serves this file as `index.html` at a different *domain*, not a path, on the real deploy). Confirm:
- The header shows "XINDELER" linking to `https://xinderal.com` (verify the `href`, don't actually navigate away) and the language switcher toggles the page between "Descarga" (es) and "Download" (en).
- The `DownloadSection` renders identically in style to the one on the main landing page, just with the new heading.
- The auto-detect button and manual grid attempt to call `https://xindeler.com/api/download` (check the Network tab) — it's expected to fail with a CORS or network error in this local preview (Task 1's backend change isn't deployed yet), but confirm it fails gracefully into the manual-list fallback UI exactly like the existing `DownloadSection` does on the main page when the API is unreachable, not with an unhandled exception in the console.

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add src/components/DownloadsHeader.jsx src/pages/DownloadsPage.jsx src/downloads-main.jsx downloads.html vite.config.js src/locales/es/translation.json src/locales/en/translation.json
git commit -m "feat: add downloads.xindeler.com landing page as a second Vite entry"
```

---

### Task 4: `xindeler-web-landing` — deploy the downloads page without touching the release files

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `CLAUDE.md` (document the new secret)

**Interfaces:**
- Consumes: `dist/downloads.html` and `dist/assets/` from Task 3's build output.
- Produces: nothing further downstream — this is the last task.

- [ ] **Step 1: Add the new secret to `CLAUDE.md`'s table**

In `CLAUDE.md`, in the `## GitHub Secrets (CI/CD)` table, add a row after the existing `VPS_DEPLOY_PATH` row:

```markdown
| `VPS_DOWNLOADS_DEPLOY_PATH` | Ruta destino del rsync para downloads.xindeler.com (`/srv/xindeler/downloads/public`) |
```

- [ ] **Step 2: Add the new deploy step**

In `.github/workflows/deploy.yml`, after the existing `Deploy to VPS` step (the one that rsyncs `dist/` with `--delete`), add:

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

No `--delete` on either line — this step only adds/updates files at the downloads VPS root, and must never be able to remove `releases/` or `latest.json`, which `xindeler-new-horizon`'s own release pipeline maintains there independently.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml CLAUDE.md
git commit -m "feat: deploy the downloads page to downloads.xindeler.com on push to main"
```

- [ ] **Step 4: Open the PR**

```bash
git push -u origin feat/downloads-subdomain-page
gh pr create --title "feat: downloads.xindeler.com landing page" --body "$(cat <<'EOF'
## Summary
- `https://downloads.xindeler.com/` currently 404s. Adds a real page there: a minimal header (logo → `xindeler.com`, language switcher) plus the real `DownloadSection` component, headlined "Descarga"/"Download".
- Second Vite entry (`downloads.html`), built alongside the main site in the same `npm run build` — no separate build pipeline.
- `DownloadSection.jsx` gains optional `apiBase`/`heading`/`eyebrow` props (all default to current behavior — the main landing's usage is unaffected) so it can call `xindeler-web-api` cross-origin from this new host.
- New deploy step rsyncs the built page to `/srv/xindeler/downloads/public` **without `--delete`**, so it never touches the `releases/`/`latest.json` that `xindeler-new-horizon`'s own release pipeline (NH-58) already maintains at that same root.

Design: `docs/superpowers/specs/2026-09-07-downloads-subdomain-page-design.md`

## Requires (before this actually works end-to-end in production)
- [ ] The companion `xindeler-web-api` PR (CORS for `downloads.xindeler.com`) merged **and manually deployed** (that repo has no auto-CD — tag + `deploy/deploy.sh` on the VPS).
- [ ] The new GitHub secret `VPS_DOWNLOADS_DEPLOY_PATH` = `/srv/xindeler/downloads/public` added to this repo's Actions secrets before merging — the new deploy step will fail without it. (Not something I can add myself: repo secrets are yours to manage — happy to give you the exact `gh secret set` command if you'd rather run it than use the GitHub UI.)

## Test plan
- [x] `npm run lint`
- [x] `npm run build` (confirmed `dist/downloads.html` + `dist/index.html` both produced)
- [x] Manually verified both pages in `npm run preview` (see task notes for what was and wasn't testable locally — the live cross-origin API call needs the companion backend PR deployed)
EOF
)"
```

Do not merge — wait for Mati's go-ahead. In your final report, restate the two "Requires" checklist items plainly — this PR being green and mergeable does not mean the page will actually resolve downloads in production without both of them.

## Follow-ups explicitly out of scope for this plan

- Any change to `xindeler-new-horizon`'s own publish job or the `releases/`/`latest.json` structure.
- A fully isolated build for `downloads.html` (splitting it out of the shared `dist/assets/` so no main-landing-only chunks get uploaded to the downloads root) — accepted trade-off, documented in the design spec.
- Analytics on the downloads page.
