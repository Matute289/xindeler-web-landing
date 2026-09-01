# Campfire character scene — design

## Goal

Replace the current horizontal list of characters in `Cuenta → Personajes` (`CharactersTab.jsx`) with an illustrated scene: the player's characters (max 5, per the existing character-creation cap) standing in a semicircle around a campfire. Hovering a character shows a "Seleccionar" tooltip; clicking opens a modal with the character's full details and the rename control.

This originated from a request to show a real per-character portrait. Investigation found no portrait/avatar pipeline exists anywhere today (client or server) — see [[project-auth-cross-repo-architecture]]-adjacent context in `xindeler-web-api`'s `CharacterSummary` (`character_id`, `name`, `level`, `class`, `location` only). That work was split out to `xindeler-new-horizon` (game engine repo) as its own initiative; this spec covers only the `xindeler-web-api` + `xindeler-web-landing` side, built to degrade gracefully with a placeholder until real portraits ship.

## Scene component

Replaces the current `CharactersTab.jsx` list rendering (`src/components/account/CharactersTab.jsx`) with a new scene component.

**Background**: a supplied photo asset (dark stone path + dense fog, perspective view), not CSS-simulated fog/floor — CSS approximations of both were tried and rejected in favor of the real photo. Source file: `~/Downloads/select_characters.jpeg` (587KB JPEG, 1406×788, ~16:9) — needs to be copied into the repo (`public/`), and should be re-encoded to WebP for size during implementation (not yet done; this is an implementation task, not a design decision).

**Campfire** (CSS-only, animated):
- 6 logs arranged as 3 diameters crossing at the center (a↔d, b↔e, c↔f, 60° apart) — a proper 6-point star/asterisk, not lopsided.
- Each log is a short, rounded bar (not a sharp `clip-path` taper — that read as spiky/weapon-like) with a gradient along its length: incandescent white-orange at the end touching the fire, fading to dark charcoal at the outer tip.
- Flame: 3 layered shapes (outer/mid/inner) with independent flicker animations, a pulsing radial glow, and small embers rising and fading.
- Kept deliberately short/tight around the flame so it doesn't visually reach into the character labels above it.

**Character placement** — polar coordinates from the fire's own anchor point (not a generic flex row), so the arrangement is a true semicircle centered on the fire:
- Each character's position is `left: 50% + dx`, `bottom: 20% + dy`, with `dx`/`dy` in px, `transform: translateX(-50%) scale(s)` (no `rotate` — an earlier attempt to lean each character toward center via `rotate()` around a bottom pivot caused the level badges, far from the pivot, to swing sideways into each other; dropped entirely). Fire anchor sits at `top: 81%` of the scene. Approved reference values for the 5-character case (mockup `campfire-scene-v20.html`): end characters `dx: ±230px, dy: 15px, scale: ~1.2, z: 3`; the pair behind them `dx: ±140px, dy: 70px, scale: 1.0, z: 2`; center character `dx: 0, dy: 140px, scale: 0.95, z: 1`. These are starting points tuned against one rendered width, not final responsive values.
- **Depth is inverted from a naive circle**: the characters at the ends of the semicircle are closest to the camera (lower on screen, bigger scale); characters closer to the middle sit further back, nearer the fire (higher, smaller). This matches the approved v15/v20 mockups.
- At the real max of 5 characters, they form two "duos" plus a center: the 2nd-from-each-end character (e.g. "Corvo", "Rovena" in the mockups) sits behind and slightly inward from its neighboring end character ("Thalrik", "Faelan") — smaller scale, higher up, explicit lower `z-index` so it reads as standing behind, not layered on top. The center character sits furthest back of all (highest `dy`), positioned clear of the flame's vertical extent so the fire never overlaps their name label.
- **z-index must be explicit per character** (a `--z` custom property), not left to default/DOM-order stacking — same z-index with "behind" characters later in markup caused them to render on top of the "in front" ones.
- No overflow/paging logic needed: character creation already caps at 5 per account, so the scene never needs to handle more.

**Interaction**:
- Hover: character gets a colored glow (class color) and a "Seleccionar" tooltip above the level badge.
- Click: opens the character modal (below). No rename control in the scene itself.

**Known follow-up not resolved in this pass**: the current sizing uses fixed px offsets tuned against the mockup's rendered width, not responsive units — mobile/narrow-viewport behavior needs its own pass (e.g. `clamp()`-based scaling, or a simpler fallback layout below a breakpoint) during implementation.

## Character modal

Opens on clicking a character in the scene.

- Portrait area at the top — shows a placeholder (explicitly labeled "Placeholder" in a small badge) until the real per-character portrait pipeline (`xindeler-new-horizon`) ships; swapping in the real image later should only touch this one area.
- Name + a pencil rename button (tooltip on hover, e.g. "Cambiar nombre") — **this is the only place the rename control appears** (moved out of the scene/list entirely, unlike the current `CharactersTab.jsx` which shows it inline per row).
- Below: Level, **Raza** (new field, see Data changes), Clase, Ubicación.

Rename behavior itself (the `POST /api/account/characters/{id}/rename` call, inline edit state, error handling) carries over unchanged from the current `CharacterCard` in `CharactersTab.jsx` — only where the trigger lives changes.

## Data changes

1. **Add `race` to `CharacterSummary`** (`xindeler-web-api/common/src/lib.rs`) — currently only `character_id`, `name`, `level`, `class`, `location`. The game server has this data (it's core to character creation); it just isn't exposed through `player_api/v1/characters` today. Needs a matching change in `xindeler-web-api/server/src/game_server_client.rs` and whatever the game server's response shape is (out of scope for this repo, coordinate with wherever `player_api/v1/characters` is implemented).

2. **Portrait proxy** — contract already provided by the `xindeler-new-horizon` session (their PR `xindeler-design#142`, gated on their own design review):
   ```
   GET {game_server}/player_api/v1/characters/{character_id}/portrait
   Authorization: Bearer <CharacterAccessToken>   (minted per-call, same pattern as list_characters)

   200 -> image bytes, Content-Type: image/webp, ETag: "<sha256>", Cache-Control: private, max-age=300
   304 -> on a matching If-None-Match
   404 -> no portrait yet (render the placeholder)
   503 -> + Retry-After (render queue full)
   500 -> render failure
   ```
   `xindeler-web-api` needs a new endpoint that byte-proxies this under the existing session auth (a browser `<img>` can't carry a bearer token) — forward `If-None-Match`/`ETag`; a short-TTL cache on the web-api side is optional. `CharacterSummary`'s JSON is untouched by this; the frontend calls the portrait endpoint per character and treats `404` as "show placeholder." This is blocked on the other repo's implementation landing — build the web-landing/web-api side against the placeholder first, wire in the real endpoint once it exists.

## Out of scope for this spec

- The actual portrait rendering pipeline (engine-side, `xindeler-new-horizon`'s own design/plan).
- Re-encoding/optimizing the background photo asset (implementation task).
- Mobile/narrow-viewport layout for the scene (flagged above as a follow-up).
