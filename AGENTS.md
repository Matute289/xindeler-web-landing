# Xindeler Web Landing — AGENTS.md

## Proyecto
Landing page de **Xindeler**, un MMORPG de fantasía basado en el motor de Veloren.
URL de producción: `https://xindeler.com`
Repo GitHub: `Matute289/xindeler-web-landing`
Diseño/assets privados: `Matute289/xindeler-design` (repo privado)

## Stack
- **React + Vite** — build tool
- **Tailwind CSS v3** — estilos (con clases custom: `x-navy`, `x-dark`, `x-gold`, `x-purple`, `font-cinzel`, `font-cinzel-dec`)
- **Framer Motion** — animaciones
- **i18next** — internacionalización ES/EN (`src/locales/es/` y `src/locales/en/`)
- **Lucide React** — iconos

## Workflow de ramas y PRs
- **Nunca pushear directo a `main`** — rama protegida por GitHub Ruleset
- Siempre crear rama feature (`feat/...`), abrir PR, avisar al usuario cuando está listo para mergear
- CI: `pr-check.yml` corre lint + build en cada PR (job name: `validate`)
- CD: `deploy.yml` hace rsync al VPS en cada push a main

## GitHub Secrets (CI/CD)
| Secret | Contenido |
|---|---|
| `SSH_PRIVATE_KEY` | Clave privada SSH para deploy |
| `VPS_HOST` | IP del VPS |
| `VPS_USER` | Usuario SSH |
| `VPS_DEPLOY_PATH` | Ruta destino del rsync |

## VPS — greenmountain.dev
- SSH: `ssh -i ~/.ssh/id_ed25519 mgrinberg@216.238.126.97`
- Deploy path: `/srv/xindeler/www/public/`
- **Backend API** — FastAPI en `/srv/xindeler/waitlist-api/main.py`, puerto 8010
  - Servicio systemd: `xindeler-waitlist.service`
  - `GET /api/waitlist/count` → cantidad de entradas en el CSV
  - `POST /api/waitlist` → guarda en CSV con rate limit; envía auto-reply HTML al usuario; notificación inmediata al owner si es contribuidor
  - `POST /api/contribute` → guarda en contributors.csv; envía acuse de recibo al contribuidor + notificación inmediata al owner
  - `GET /api/status` → chequea si el servidor de juego (puerto 14004) está online, cacheado 30s
  - Deduplicación silenciosa: si el mismo email ya está en el CSV, se retorna 200 sin guardar ni enviar mail
  - Credenciales SMTP en `/srv/xindeler/.env` (chmod 600)
- **Digest mensual** — `/srv/xindeler/scripts/monthly-digest.py`, systemd timer `xindeler-digest.timer`
  - Se ejecuta el 1° de cada mes a las 09:00 UTC
  - Envía tabla HTML al owner con entradas nuevas desde el último envío
  - Estado en `/srv/xindeler/data/digest-last-sent.txt`
- **nginx** — proxy + rate limiting en `/etc/nginx/sites-enabled/xindeler.com`
  - Rate limit zone: `/etc/nginx/conf.d/waitlist-ratelimit.conf` (1r/m)
- **Waitlist CSV**: `/srv/xindeler/data/waitlist.csv` (chmod 600, fuera del web root)
- **Contributors CSV**: `/srv/xindeler/data/contributors.csv` (chmod 600)
- **Snapshot privado**: `/srv/xindeler/data/xindeler-design-snapshot.json` (no en git)

## Componentes — `src/components/`
| Componente | Descripción |
|---|---|
| `Analytics.jsx` | GA4 `G-V7S6WV251S` — aislado, fácil de quitar |
| `AmbientSound.jsx` | Música ambiental con 5 escenas, fade entre tracks, vibración RAF |
| `AIWorldSection.jsx` | Sección del mundo con IA, partículas y typewriter |
| `CommunitySection.jsx` | Links de comunidad (Discord, etc.) |
| `DownloadSection.jsx` | Botones de descarga por plataforma |
| `EasterEgg.jsx` | Animación arcana al hacer click en el logo |
| `FeaturesSection.jsx` | Features del juego en cards |
| `Footer.jsx` | Pie de página |
| `GitHubStats.jsx` | Stats del repo (stars, forks, contributors) via API pública |
| `GitHubIcon.jsx` | SVG del ícono de GitHub |
| `HeroSection.jsx` | Hero principal con CTA |
| `LanguageSwitcher.jsx` | Toggle ES/EN |
| `LoadingScreen.jsx` | Pantalla de carga con logo antes de mostrar la landing |
| `MMORPGVision.jsx` | Visión del MMORPG |
| `Navbar.jsx` | Navegación fija |
| `Roadmap.jsx` | Hoja de ruta en 3 fases |
| `ScrollProgress.jsx` | Barra de progreso de scroll |
| `UpdatesSection.jsx` | Feed scrollable de novedades desde `public/updates.json` |
| `WaitlistSection.jsx` | Formulario de lista de espera — POST a `/api/waitlist` |
| `WorldShowcase.jsx` | Showcase del mundo del juego |

## Archivos clave
- `public/updates.json` — novedades públicas (en git, inicialmente `[]`)
- `public/xindeler-design-snapshot.json` — SHAs del repo de diseño (**gitignored**, vive en VPS)
- `src/App.jsx` — orden de secciones de la landing
- `src/locales/es/translation.json` y `src/locales/en/translation.json` — textos

## Skill: /xindeler-novedades
Compara `Matute289/xindeler-design` con el snapshot guardado en el VPS y genera entradas para `public/updates.json`. El snapshot se lee/escribe via SCP desde `/srv/xindeler/data/xindeler-design-snapshot.json`.

## Servidor de juego
- Puerto esperado: **14004** (TCP) en localhost
- El servidor aún no está deployado — `/api/status` devuelve `{ online: false }` hasta que esté activo

## Convenciones de código
- Sin comentarios salvo que el WHY sea no obvio
- Sin features extra más allá de lo pedido
- Clases Tailwind — no estilos inline salvo cuando Tailwind no alcanza (ej. `maxHeight`, `radial-gradient`)
- Animaciones: siempre con `whileInView` + `viewport={{ once: true }}` para performance
