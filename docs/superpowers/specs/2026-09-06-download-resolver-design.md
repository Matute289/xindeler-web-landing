# Download resolver — design

## Goal

Replace the 6 hardcoded `https://downloads.xindeler.com` placeholder buttons in `DownloadSection.jsx` with a real, working download flow: a primary "Descargar para tu sistema" button that auto-detects the visitor's OS/architecture server-side and sends them straight to the right file, with a manual 6-option list as a fallback for when detection is wrong or the platform is genuinely unsupported.

This is the consuming side of a release pipeline being built independently in `xindeler-new-horizon` (their task NH-58): on every `v*` tag, it builds 6 targets (Windows/Linux/macOS × x86_64/ARM64), uploads them to `/srv/xindeler/downloads/releases/<version>/` on the VPS (nginx-served static, `downloads.xindeler.com`), and maintains a `latest.json` pointer at the root with the current release's manifest. That pipeline is out of scope here — this spec covers only `xindeler-web-api` (the new resolver endpoint) and `xindeler-web-landing` (the button UI).

## Manifest contract (external, confirmed with `xindeler-new-horizon`)

`GET https://downloads.xindeler.com/latest.json`:

```json
{
  "version": "v0.25.0",
  "released_at": "...",
  "platforms": [
    {"os": "windows", "arch": "x86_64", "file": "xindeler-voxygen-windows-x86_64.zip", "size": 123456, "sha256": "..."},
    {"os": "windows", "arch": "arm64",  "file": "xindeler-voxygen-windows-arm64.zip",  "size": 123456, "sha256": "..."},
    {"os": "linux",   "arch": "x86_64", "file": "xindeler-voxygen-linux-x86_64.tar.gz", "size": 123456, "sha256": "..."},
    {"os": "linux",   "arch": "arm64",  "file": "xindeler-voxygen-linux-arm64.tar.gz",  "size": 123456, "sha256": "..."},
    {"os": "macos",   "arch": "x86_64", "file": "xindeler-voxygen-macos-x86_64.dmg",    "size": 123456, "sha256": "..."},
    {"os": "macos",   "arch": "arm64",  "file": "xindeler-voxygen-macos-arm64.dmg",     "size": 123456, "sha256": "..."}
  ]
}
```

A resolved download URL is `https://downloads.xindeler.com/releases/<version>/<file>`.

## `xindeler-web-api`: `GET /api/download`

Query params `os` and `arch` are both optional:
- Neither given: auto-detect both from the request's `User-Agent` header.
- Either given: use it as-is (case-insensitive, values `windows|linux|macos` for `os`, `x86_64|arm64` for `arch`), skipping detection for that one — this is what the 6 manual buttons use, always passing both explicitly.

**Response is always JSON, never a raw redirect** — the frontend needs to see a failure to show its own message and reveal the manual list, which a `302` alone can't support.

- Match found: `200 { "ok": true, "download_url": "https://downloads.xindeler.com/releases/<version>/<file>", "version": "<version>" }`
- No match (OS not recognized from the User-Agent, or the requested/detected `os`+`arch` pair isn't in the manifest, or the manifest itself couldn't be fetched/parsed): `200 { "ok": false }`. This is a normal, expected outcome the frontend handles — not a server error, so it stays `200` rather than `404`/`502`.

**OS/arch detection from `User-Agent`** — hand-rolled substring matching (this repo's convention: no new dependency for something this size, matching the existing hand-rolled router/HTTP seam):
- OS: `"Windows"` → `windows`; `"Mac OS X"` or `"Macintosh"` → `macos`; `"Linux"` present and `"Android"` absent → `linux`; anything else → undetected.
- Arch: `"ARM64"` or `"aarch64"` present → `arm64`; else → `x86_64` (the more common default — this is a best-effort guess, not authoritative; see the note below on why it can be wrong for Apple Silicon).
- OS undetected → no match at all (`ok: false`), regardless of arch. Arch is never left undetected — it always falls back to `x86_64` when ambiguous, since some answer is needed to look up the manifest and a wrong arch guess is recoverable via the manual list, while an undetected OS is not (there's no sane default across three completely different platforms).

**Known limitation, not a bug to fix:** architecture detection from `User-Agent` alone is unreliable on macOS — Apple Silicon Macs frequently report as Intel for compatibility reasons (Rosetta-related), so an ARM64 Mac visitor may be auto-resolved to the x86_64 build. This is exactly why the manual 6-option list exists as a visible, always-available fallback, not just an error-recovery path.

**Manifest caching:** in-memory, ~5 minute TTL, refetched from `https://downloads.xindeler.com/latest.json` on expiry (never on every request) — a single small HTTP client call, same pattern as this service's existing outbound calls (e.g. `GameServerClient`).

## `xindeler-web-landing`: `DownloadSection.jsx`

- The primary button becomes a `<button onClick>` (not a plain `<a>`), since it needs to inspect the JSON response before deciding where to go. On click: `fetch('/api/download')`, brief loading state, then either `window.location.href = data.download_url` (same-tab — the browser handles the file download naturally without leaving the page) on `ok: true`, or reveal an inline message ("No pudimos detectar tu sistema automáticamente — elegí manualmente:") and scroll/highlight the manual list on `ok: false`.
- Each of the 6 manual buttons becomes the same `onClick`-driven pattern, calling `fetch('/api/download?os=<os>&arch=<arch>')` with its own explicit values. On `ok: false` for one of these (only possible if the manifest fetch itself failed, since every one of the 6 combinations should always exist once a release is published), show a small inline retry message near that specific button rather than the "detect failed" copy.
- New i18n keys needed (`download.*` namespace, both `es`/`en`): the auto-detect failure message, a manual-fallback section label, and a per-button retry message.

## Out of scope for this spec

- The build/publish pipeline itself (`xindeler-new-horizon` NH-58) — only its manifest contract is a dependency here.
- Download analytics/tracking (not requested).
- Anything beyond the current 3 OS × 2 arch matrix (e.g. Linux distro-specific packages) — the manifest structure already generalizes if that's ever added, but no work here anticipates it.
