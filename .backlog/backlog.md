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
| 005 | Pantalla de cuenta del jugador — sesión, seguridad (2FA) y nombre de usuario | [005-cuenta-jugador-seguridad.md](tasks/005-cuenta-jugador-seguridad.md) | `[~]` — implementada, pendiente de verificación manual con sesión real |
| 006 | Visor de personajes en la pantalla de cuenta — bloqueada, falta API en el game server | [006-cuenta-jugador-personajes.md](tasks/006-cuenta-jugador-personajes.md) | `[ ]` — placeholder ya en `/account`; blocker real es NH-79 en `xindeler-new-horizon` |
| 007 | Sesión web autenticada — cómo la landing recuerda quién está logueado | [007-sesion-web-autenticada.md](tasks/007-sesion-web-autenticada.md) | `[x]` — deployada en producción real el 2026-08-15 (`xindeler-web-api`, ver su `.backlog/README.md`) |
| 008 | Navbar consciente de sesión — botón de usuario + menú desplegable a Cuenta | [008-navbar-sesion.md](tasks/008-navbar-sesion.md) | `[x]` — implementada y probada de punta a punta con una cuenta real (desktop + mobile) |

## Prioridad Media

| # | Tarea | Archivo spec | Estado |
|---|-------|--------------|--------|
| 009 | Botones "Continuar con Discord" / "Continuar con Google" en el modal de login/registro | — | `[ ]` — bloqueada, esperando la implementación del backend en `xindeler-auth` (G-05). Spec + plan ya escritos ahí: `docs/superpowers/specs/2026-08-16-oauth-discord-google-design.md` y `docs/superpowers/plans/2026-08-16-oauth-discord-google.md`. Cuando esté deployado, el flujo del lado landing es: el botón navega directo a `https://auth.xindeler.com/oauth/{discord,google}/start` (nada de armar la URL de autorización acá, el backend lo hace todo); una página nueva en `/oauth/callback` lee `window.location.hash` (`#token=...` en éxito, `#error=<código>` en fallo) y sigue el mismo camino que ya usa el login con password una vez que tiene el token. No hay trabajo de backend propio de este repo, es 100% UI |

## Prioridad Baja

*(vacío)*
