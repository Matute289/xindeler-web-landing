# Xindeler Web Landing — Backlog

## Leyenda de estados
- `[ ]` Pendiente
- `[~]` En progreso
- `[x]` Completo

## Prioridad Alta

| # | Tarea | Archivo spec | Estado |
|---|-------|--------------|--------|
| 001 | Card "Descargas" en CommunitySection scrollea a DownloadSection | [001-downloads-card-scroll.md](tasks/001-downloads-card-scroll.md) | `[x]` |
| 002 | Replanteo de la Hoja de Ruta (9 fases, estado real del proyecto) | [002-roadmap-replanteo.md](tasks/002-roadmap-replanteo.md) | `[x]` |
| 003 | Wiki del juego — VitePress, nuevo repo, contenido bilingüe | [003-wiki.md](tasks/003-wiki.md) | `[x]` |
| 004 | Portal de documentación técnica — Docusaurus, nuevo repo, ORACLE+AURORA | [004-docs.md](tasks/004-docs.md) | `[x]` — redirigido a `xindeler-documentation`, ver su backlog propio |
| 005 | Pantalla de cuenta del jugador — sesión, seguridad (2FA) y nombre de usuario | [005-cuenta-jugador-seguridad.md](tasks/005-cuenta-jugador-seguridad.md) | `[x]` — cerrada, verificada end-to-end en producción real 2026-08-21 (cuenta real de Matías + cuenta de prueba descartable). PRs #65/#66 corrigieron dos bugs reales de 2FA encontrados en el proceso |
| 006 | Visor de personajes en la pantalla de cuenta | [006-cuenta-jugador-personajes.md](tasks/006-cuenta-jugador-personajes.md) | `[x]` — cerrada, verificada end-to-end contra producción real 2026-08-21 (cuenta + personaje real, list/rename desde la UI real) |
| 007 | Sesión web autenticada — cómo la landing recuerda quién está logueado | [007-sesion-web-autenticada.md](tasks/007-sesion-web-autenticada.md) | `[x]` — deployada en producción real el 2026-08-15 (`xindeler-web-api`, ver su `.backlog/README.md`) |
| 008 | Navbar consciente de sesión — botón de usuario + menú desplegable a Cuenta | [008-navbar-sesion.md](tasks/008-navbar-sesion.md) | `[x]` — implementada y probada de punta a punta con una cuenta real (desktop + mobile) |

## Prioridad Media

| # | Tarea | Archivo spec | Estado |
|---|-------|--------------|--------|
| 009 | Botones "Continuar con Discord" / "Continuar con Google" en el modal de login/registro | — | `[~]` — implementada, pendiente de verificación manual con proveedores reales. G-05 (`xindeler-auth`) ya está en producción. Pedido explícito de Matías: cuenta nueva vía OAuth no se auto-crea al toque, primero se revisa/edita el username — ese paso (`OAuthPendingCache` + `POST /oauth/confirm-registration`) se agregó en `xindeler-auth#49` (sin mergear todavía). `xindeler-web-api#21` suma `POST /api/session/oauth` para canjear el token por cookie de sesión. Acá: botones en `AuthModal.jsx` (navegan directo a `/oauth/{provider}/start`) + página nueva `/oauth/callback` que maneja los cuatro casos del hash (`#token=`, `#challenge_id=`, `#pending_token=&suggested_username=` con pantalla de revisión, `#error=`) |

## Prioridad Baja

*(vacío)*
