# 007 — Sesión web autenticada: cómo la landing recuerda quién está logueado

**Estado:** `[ ]` Pendiente
**Prioridad:** Alta — bloquea [005](005-cuenta-jugador-seguridad.md) y [006](006-cuenta-jugador-personajes.md)
**Esfuerzo estimado:** M/L (una pieza de backend nueva — sesión server-side en `waitlist-api` — más
los cambios de frontend para consumirla; no toca `xindeler-auth`)
**Depende de:** nada técnicamente bloqueante en otro repo. Sí depende de una decisión de producto
(ver "Decisiones a confirmar") sobre si `waitlist-api` pasa a vivir en un repo versionado antes de
crecer.

---

## Objetivo

005 marcó como "decisión #1 a confirmar" que la landing **no tiene ningún mecanismo de sesión web
persistente** y dejó una propuesta provisoria (Context de React en memoria, se pierde al refrescar)
señalando explícitamente que había que evaluar alternativas. Esta tarea es esa evaluación: define
**cómo la landing establece y mantiene una sesión autenticada** para que 005 (pantalla de
cuenta: seguridad/2FA, username) y 006 (visor de personajes, hoy bloqueada por otro motivo) tengan
una base real sobre la que construir, en vez de que cada pantalla nueva reinvente su propio
mecanismo de "quién está logueado".

Esta tarea es solo investigación y diseño — no implementa nada.

---

## Hallazgos clave de la investigación

### 1. `auth.xindeler.com` es stateless por diseño — el `AuthToken` no sirve como credencial de sesión web

Confirmado leyendo `CLAUDE.md` y `common/src/lib.rs` de `xindeler-auth`:

- El servidor **no tiene sesiones server-side, ni cookies, ni refresh tokens** en ningún endpoint.
  Cada endpoint mutable (`/change_username`, `/change_password`, `/delete_account`, y los
  `/2fa/*` diseñados en Fase L) exige usuario+contraseña frescos en cada request — es una decisión
  de diseño explícita del servicio, no un descuido.
- El `AuthToken` que devuelve `POST /generate_token` es:
  ```rust
  /// 128-bit session token. Serializes as a lowercase hex string over the wire.
  pub struct AuthToken { pub unique: [u8; 16] }
  ```
  **un solo uso** (`/verify` lo consume) y **TTL de 15 segundos** (`AUTH_TOKEN_TTL_SECS`, default
  `15`). Estructuralmente fue diseñado para el handshake cliente-de-juego → game server → `/verify`
  — no para persistir "estoy logueado" en un browser. Guardarlo en memoria, `localStorage` o una
  cookie no cambia que expira en 15s y se invalida al primer uso: es inútil como credencial de
  sesión más allá del instante del login, sin importar dónde se lo guarde.
- La única semántica parecida a un bearer token reusable que existe hoy, `completion_token`, está
  scoped exclusivamente al flujo de completar email de cuentas legacy y también vive poco (TTL 15
  min, un solo propósito).

**Conclusión:** cualquier diseño que reutilice el `AuthToken` (o inventar un "guardar el prehash de
la contraseña en memoria", como proponía provisoriamente 005) para simular una sesión persistente
está construyendo sobre una pieza que no fue hecha para eso. Hace falta una capa de sesión que viva
**fuera** de `xindeler-auth`, sin pedirle a ese repo que deje de ser stateless (ver hallazgo 4 sobre
por qué no conviene tocar ese contrato).

### 2. Fase L (2FA) ya define el patrón "no hay token hasta completar todos los pasos" — la sesión debe respetarlo

Del `.backlog/README.md` de `xindeler-auth`, Fase L (diseño, `todo`, sin implementar):

| Paso | Contrato |
|---|---|
| `POST /generate_token` (login) | Si la cuenta **no** tiene TOTP confirmado: responde igual que hoy, `AuthToken` directo. Si **sí** tiene TOTP: en vez del token, responde `202` + `challenge_id` de vida corta. |
| `POST /login/2fa` | Canjea `{ challenge_id, code }` por el `AuthToken` real. |

Punto explícito del diseño (requisito de producto #3 de Matías, ver Fase L): el código TOTP se pide
**después** de validar usuario y contraseña, nunca antes — para no revelar si una cuenta tiene 2FA
activo a quien todavía no probó una contraseña válida (mismo principio anti-enumeración que ya
aplica en el resto del servicio).

**Implicancia directa para esta tarea:** la sesión de la landing debe establecerse **solo después de
que el login completo termine** — incluido el segundo factor si la cuenta lo tiene activo. Un
diseño de sesión que la estableciera apenas se valida usuario+contraseña (antes de pedir el código)
rompería ese principio: filtraría, a través de la sola presencia de una cookie de sesión, que la
cuenta no tiene 2FA. La orquestación de login que se proponga acá tiene que dejar espacio para un
paso intermedio de "pendiente de segundo factor, todavía sin sesión" — aunque G-03 siga sin
implementar hoy.

### 3. El backend propio de la landing (`waitlist-api`) no vive en este repo — y hoy no tiene ninguna base de datos

Búsqueda completa en este repo (`find . -iname "*.py"`, `find . -iname main.py`): **cero
resultados.** El `CLAUDE.md` de este repo documenta su existencia (`/srv/xindeler/waitlist-api/main.py`,
FastAPI, puerto 8010, systemd `xindeler-waitlist.service`) pero **el código fuente no está
versionado en ningún repo Git accesible desde acá — vive únicamente en el VPS.** Endpoints actuales,
todos de solo escritura/consulta simple:

- `GET /api/waitlist/count`
- `POST /api/waitlist` (guarda en CSV, rate-limited, auto-reply + notificación)
- `POST /api/contribute` (guarda en CSV)
- `GET /api/status` (proxy cacheado de 30s al puerto 14004 del game server)

Toda su persistencia hoy son **archivos CSV** (`waitlist.csv`, `contributors.csv`, chmod 600, fuera
del web root) — **no hay ninguna base de datos**. Esto importa para el diseño de sesión: cualquier
mecanismo de sesión server-side (opción recomendada, ver abajo) es una pieza de estado nueva que
este servicio no tiene hoy, y el servicio en sí necesita empezar a vivir en un repo versionado antes
de que tenga sentido construir algo con más superficie que un par de endpoints de CSV (ver
"Decisiones a confirmar" #1 — esto no bloquea el diseño, pero sí el orden de trabajo).

### 4. `waitlist-api` y el frontend son **mismo origen** — `auth.xindeler.com` no

Confirmado revisando cómo llama cada pieza de este repo a cada backend (`rg` sobre
`src/components` y `src/pages`):

- `WaitlistSection.jsx`, `GitHubStats.jsx`, `ServerStatusSection.jsx` llaman a
  `https://xindeler.com/api/...` — **mismo origen que la landing misma** (`https://xindeler.com`),
  proxied por el mismo nginx que sirve el sitio estático (`/srv/xindeler/www/public/`,
  `/etc/nginx/sites-enabled/xindeler.com`). Desde el punto de vista del browser, frontend y
  `waitlist-api` son el mismo origin.
- `AuthModal.jsx`, `VerifyEmailPage.jsx`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` llaman
  a `https://auth.xindeler.com` — un **origin distinto** (subdominio propio, su propio nginx/TLS).

Revisando el CORS del lado de `xindeler-auth` (`server/src/web.rs`, función `cors_origin`):

```rust
fn cors_origin(request: &Request) -> Option<&'static str> {
    match request.header("Origin")? {
        "https://xindeler.com" => Some("https://xindeler.com"),
        "http://localhost:5173" => Some("http://localhost:5173"),
        "http://127.0.0.1:5173" => Some("http://127.0.0.1:5173"),
        _ => None,
    }
}
```

Allowlist de **origins exactos**, no de dominio+subdominios. Y en `finalize()`, los headers que
manda son `Access-Control-Allow-Methods` / `-Headers` / `-Origin` — **nunca**
`Access-Control-Allow-Credentials: true`. Sin ese header, un `fetch(..., { credentials: 'include' })`
desde el browser no puede ni mandar ni leer cookies de `auth.xindeler.com`, aunque el origin esté en
la allowlist. Es decir: **hoy es estructuralmente imposible** que `auth.xindeler.com` establezca una
cookie de sesión utilizable por el frontend de la landing, ni siquiera si se le agregara lógica de
sesión — habría que cambiar su contrato CORS, y eso va en contra del principio "stateless by
design" que ese repo sostiene explícitamente. **No se recomienda tocar `xindeler-auth` para esto.**

En cambio, `waitlist-api` bajo `xindeler.com/api/*` es **same-origin** con el frontend: una cookie
que ponga ese servicio no necesita ningún header CORS especial, ninguna configuración de
`credentials: 'include'` distinta a la que ya usa el browser automáticamente para same-origin, y el
riesgo de CSRF cross-origin se reduce al mínimo (ver hallazgo 6).

### 5. Todos los endpoints mutables de `xindeler-auth` van a seguir pidiendo contraseña, sesión o no

Aunque la landing tenga una sesión propia, **`xindeler-auth` no va a dejar de exigir
usuario+contraseña en cada `/change_username`, `/change_password`, `/delete_account` ni en
`/2fa/disable`** — no es algo que este repo pueda ni deba cambiar unilateralmente, y el propio
diseño de Fase L (`/2fa/disable` exige contraseña **y** TOTP, "no alcanza con la contraseña sola")
refuerza que ese patrón es intencional, no un gap.

Consecuencia de diseño: la sesión de la landing **no elimina el prompt de contraseña en acciones
sensibles** — resuelve un problema distinto: "¿quién es este browser, para poder mostrarle `/account`
sin loguearse de nuevo en cada visita, y para no pedirle el username otra vez en cada formulario?".
Cambiar contraseña, desactivar 2FA u otras acciones destructivas van a seguir re-pidiendo contraseña
(y código TOTP donde aplique) **a través** de la sesión, no en lugar de ella — mismo patrón de
"reautenticación para acciones sensibles" que usan la mayoría de las apps con sesión, y que además
ya es obligatorio server-side pase lo que pase acá.

### 6. CSRF: mismo origen ayuda, pero no alcanza solo con eso

Una cookie de sesión en `waitlist-api`, aunque same-origin con el frontend, sigue siendo enviada
automáticamente por el browser en cualquier request cross-site que apunte a `xindeler.com/api/*`
(ej. un `<form>` o `fetch` disparado desde otro sitio) salvo que se mitigue explícitamente. Mitigación
recomendada, estándar y barata:

- Cookie con `SameSite=Lax` (o `Strict` si no hace falta que sobreviva a navegación desde link
  externo — a confirmar, ver Decisiones) + `Secure` + `HttpOnly` — bloquea el envío en la gran
  mayoría de requests cross-site y todo acceso vía JS (mitiga XSS robando la cookie directamente).
- Para los métodos mutables (`POST /api/session/*`, y cualquier endpoint nuevo que la pantalla de
  cuenta necesite), exigir que el frontend mande un header custom (ej. `X-Requested-With` o un token
  CSRF de doble-submit) — `SameSite=Lax` ya bloquea la mayoría de los casos, pero un header
  requerido es defensa en profundidad barata porque el SPA ya controla el `fetch` en todos lados.

### 7. La landing hoy no toca `/forgot-password` / `/reset-password` a través de ningún backend propio

`ForgotPasswordPage.jsx` y `ResetPasswordPage.jsx` llaman **directo** a `auth.xindeler.com`, sin
pasar por `waitlist-api`. Esto importa para el diseño de invalidación de sesión (hallazgo 8): si un
jugador resetea su contraseña por ese flujo, `waitlist-api` **no se entera** — no hay ningún request
a su backend que lo dispare. Ver Decisión #4.

### 8. Invalidación de sesión ante cambios en la cuenta — dos casos con solución distinta

- **Cambio disparado *a través* de la sesión** (ej. el jugador cambia su contraseña o desactiva 2FA
  desde `/account`, logueado): `waitlist-api` es quien hace la llamada a `xindeler-auth` en nombre
  del jugador, así que puede revocar la sesión actual (o todas las del `uuid`) en el mismo request,
  en el momento exacto en que el cambio se confirma. Esto es directo de implementar con un store
  server-side (hallazgo 9) — imposible con una cookie stateless sin blocklist.
- **Cambio disparado *fuera* de la sesión** (ej. `/reset-password` llamado directo contra
  `auth.xindeler.com`, como ya pasa hoy — hallazgo 7; o un cambio hecho por otra vía, como soporte
  manual): `waitlist-api` no tiene forma de enterarse en tiempo real porque `xindeler-auth` es
  stateless y no tiene ningún mecanismo de notificación/webhook saliente. La única mitigación real
  es una sesión de **vida corta** (ver hallazgo 9) — el peor caso es que una sesión vieja siga viva
  hasta su propio vencimiento natural, nunca indefinidamente.

---

## Arquitectura propuesta

### Opción A — Sesión propia en `waitlist-api`, backed por un store server-side (RECOMENDADA)

```
Browser (xindeler.com)                  waitlist-api (xindeler.com/api/*)         auth.xindeler.com
      |                                          |                                       |
      |--- POST /api/session/login ------------->|                                       |
      |    { username, password_prehash }        |                                       |
      |                                          |--- POST /generate_token ------------->|
      |                                          |   (server-to-server, sin CORS)         |
      |                                          |<--- 200 { token } o 202 { challenge } -|
      |                                          |                                       |
      |   (caso sin 2FA)                          |--- POST /verify (uuid del token) ---->|
      |<-- 200 + Set-Cookie session=... ----------|<--- 200 { uuid, username } -----------|
      |    (httpOnly, Secure, SameSite=Lax)       |   guarda sesión: uuid, username,      |
      |                                          |   expires_at en su propio store        |
      |                                          |                                       |
      |   (caso con 2FA activo, Fase L)           |                                       |
      |<-- 202 { challenge_id } ------------------|  (todavía sin cookie de sesión)       |
      |                                          |                                       |
      |--- POST /api/session/login/2fa --------->|                                       |
      |    { challenge_id, code }                 |--- POST /login/2fa ------------------>|
      |                                          |<--- 200 { token } --------------------|
      |<-- 200 + Set-Cookie session=... ----------|  (recién ahora se crea la sesión)      |
      |                                          |                                       |
      |--- GET /api/account (cookie automática) ->|                                       |
      |<-- 200 { username, twofa_status? } -------|  (lee su propio store de sesión;      |
      |                                          |   no necesita volver a golpear auth)   |
      |                                          |                                       |
      |--- POST /api/account/change-password --->|                                       |
      |    { current_password, new_password }     |--- POST /change_password ------------>|
      |    (sesión identifica el username;         |<--- 200 -------------------------------|
      |     contraseña se sigue pidiendo fresca)   |   revoca sesiones activas del uuid     |
      |<-- 200, cookie limpiada ------------------|   (fuerza reloguearse)                 |
      |                                          |                                       |
      |--- POST /api/session/logout ------------->|                                       |
      |<-- 200, cookie limpiada -------------------|   borra la fila de sesión              |
```

**Piezas nuevas en `waitlist-api`** (repo a versionar primero, ver Decisión #1):
- Tabla `sessions` (SQLite — primera pieza de base de datos real de este servicio; hoy solo tiene
  CSVs): `session_id TEXT PK, uuid TEXT, username TEXT, created_at INT, expires_at INT, revoked_at INT NULL`.
  Mismo patrón general que ya usa `xindeler-auth` (SQLite, migraciones simples) — consistente con lo
  que ya existe en el resto del ecosistema Xindeler, sin agregar un componente de infraestructura
  distinto (no Redis, no un servicio nuevo — ver Decisión #2 y el peso real esperado: cientos de
  sesiones concurrentes como mucho, trivial para SQLite en el VPS actual de 2vCPU/4GB).
- `POST /api/session/login` — recibe `{ username, password_prehash }` (mismo `netPrehash()` que ya
  usa `AuthModal`, nunca la contraseña en claro), llama server-to-server a
  `auth.xindeler.com/generate_token`. Sin 2FA: token → `/verify` → arma la sesión, `Set-Cookie`.
  Con 2FA (Fase L): devuelve `202 { challenge_id }` sin cookie.
- `POST /api/session/login/2fa` — solo existe una vez que Fase L esté implementada; canjea
  `{ challenge_id, code }` contra `POST /login/2fa`, recién ahí arma la sesión.
- `GET /api/session/me` — devuelve `{ username }` (o 401) leyendo la cookie contra el store; base
  para que el frontend sepa "hay alguien logueado" al cargar cualquier página, sin pedir contraseña.
- `POST /api/session/logout` — borra la fila de sesión, limpia la cookie.
- Cualquier endpoint que la pantalla de cuenta necesite llamar contra `xindeler-auth`
  (`change_username`, `change_password`, `delete_account`, `2fa/*` el día que existan) se **proxea**
  a través de `waitlist-api`, no directo desde el frontend — así el backend puede revocar la sesión
  en el mismo request cuando corresponda (hallazgo 8) y el frontend nunca necesita saber que
  `auth.xindeler.com` existe como origin aparte para nada mutable.
- Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Domain` implícito (mismo origen, no hace falta
  `Domain=xindeler.com` explícito salvo que se quiera compartir con otro subdominio — no es el caso
  hoy).

**Por qué esta opción:**
- Es la única que permite revocación real (hallazgo 8) — requisito explícito de esta tarea.
- No toca el contrato ni el modelo "stateless" de `xindeler-auth` — cero riesgo para ese repo,
  cero coordinación de deploy cross-repo salvo lo que ya existe (llamadas HTTP normales).
- Aprovecha que `waitlist-api` y el frontend ya son same-origin (hallazgo 4) — nada de gimnasia CORS.
- Es consistente con el patrón "el que sabe hace de intermediario" que ya usa este backlog para 006
  (la landing consumiendo por proxy en vez de directo).

### Opción B — Cookie de sesión stateless (firmada/encriptada, sin store server-side)

Ej. `itsdangerous` (ya usable en FastAPI, sin dependencias pesadas) firmando
`{ uuid, username, issued_at, exp }`, sin ninguna tabla nueva.

**Rechazada como recomendación principal** porque no resuelve el requisito de invalidación
(hallazgo 8, caso "cambio disparado a través de la sesión"): sin un store, no hay forma de revocar
una cookie ya emitida antes de que expire por sí sola — ni siquiera cuando es la propia
`waitlist-api` la que acaba de procesar el cambio de contraseña o el disable de 2FA que debería
matar la sesión actual. Se podría mitigar con TTLs muy cortos (ej. 15–30 min) forzando relogin
frecuente, pero eso empeora la experiencia que esta tarea busca mejorar sin ganar nada a cambio de
la Opción A, que ya resuelve el problema completo con una tabla SQLite trivial.

Se deja documentada por si en algún momento el volumen de sesiones concurrentes hiciera que
mantener el store server-side fuera una carga real — no es el caso hoy ni en un futuro cercano
previsible para este proyecto.

### Opción C — Nada server-side, todo en el cliente (Context en memoria, como proponía 005 provisoriamente)

**Rechazada.** No es una sesión "persistente" en ningún sentido útil — se pierde en cada refresh de
pestaña, cada F5, cada vez que se abre un link en pestaña nueva. No resuelve el problema que esta
tarea existe para resolver (005 lo marcó explícitamente como "menos cómodo… a confirmar" y pidió
evaluar alternativas — esta es esa evaluación). Adicionalmente, si la variante de esa propuesta
guarda el **prehash de la contraseña** en memoria (no solo un identificador de sesión), cualquier
XSS en la pestaña abierta filtra una credencial reusable indefinidamente contra `xindeler-auth` —
peor perfil de riesgo que una cookie `HttpOnly` (que ni el propio JS de la página puede leer).

---

## Decisiones a confirmar antes de implementar

1. **`waitlist-api` no está versionado en ningún repo Git accesible.** Antes de agregarle una tabla
   SQLite y varios endpoints nuevos con lógica de sesión, ¿lo migramos a un repo propio (nuevo, ej.
   `xindeler-web-api`) o a una carpeta `backend/` dentro de este mismo repo? Seguir editando un
   servicio en producción sin historial de cambios ni CI es un riesgo creciente a medida que crece
   su superficie — y esta tarea le agrega la primera base de datos real que tendría. Recomiendo
   resolver esto **antes** de empezar la implementación de 007, no en paralelo.
2. **SQLite vs. alternativa para el store de sesiones.** Propuesto arriba por consistencia con el
   resto del ecosistema (mismo patrón que `xindeler-auth`) y porque el volumen esperado es trivial
   para el VPS actual — ¿confirmado, o preferís evaluarlo con más detalle (ej. invocando la skill
   `cloud-architect` de este entorno) antes de comprometerse?
3. **TTL de sesión y política de renovación.** Propuesta de partida: TTL absoluto de 7 días,
   sin renovación deslizante (evita que una sesión "viva" indefinidamente solo por seguir usando el
   sitio) — ¿aceptable, o preferís algo más corto/largo, o sliding window?
4. **`/forgot-password` y `/reset-password` (hallazgo 7): ¿se rutean a través de `waitlist-api`** una
   vez que exista, para poder revocar sesiones activas cuando alguien resetea su contraseña por ese
   camino? Requiere retocar `ForgotPasswordPage.jsx`/`ResetPasswordPage.jsx`, ya shippeados
   (E-05/E-06). Si no, ese caso queda cubierto solo por el TTL de la decisión #3, nunca por
   revocación inmediata.
5. **`SameSite=Lax` vs `Strict`** para la cookie de sesión — `Lax` permite que una sesión sobreviva
   si el jugador llega desde un link externo (ej. el email de verificación) y ya tenía sesión
   abierta en otra pestaña; `Strict` es más conservador pero puede sorprender en navegación cruzada.
   Recomiendo `Lax` + el header custom de defensa en profundidad (hallazgo 6).
6. **¿La landing backend necesita su propia credencial de servicio contra `xindeler-auth`** (como
   `AUTH_SERVICE_TOKEN`, hoy reservado para el game server) para poder llamar `/verify`,
   `/username_to_uuid` o `/uuid_to_username` en nombre de una sesión (ej. para resolver el `uuid` del
   jugador, útil de cara a 006)? Si sí, es una decisión y un cambio que le corresponde a
   `xindeler-auth` (emitir/gestionar una segunda credencial de servicio) — no algo que este repo
   pueda decidir unilateralmente. Marcarlo como pendiente de coordinar si 006 lo termina
   necesitando.
7. **Naming de rutas:** `/api/session/*` y `/api/account/*` bajo el mismo `waitlist-api` que ya sirve
   `/api/waitlist`, `/api/contribute`, `/api/status` — ¿confirmado, o el crecimiento de
   responsabilidades amerita separar esto en otro servicio/subdominio? (Relacionado con la Decisión
   #1 — si se migra a un repo nuevo, es buen momento para decidir esto también.)

---

## Acceptance criteria

- [ ] `waitlist-api` (una vez resuelta la Decisión #1 de dónde vive versionado) expone
      `POST /api/session/login`, `POST /api/session/logout`, `GET /api/session/me`, y
      (cuando Fase L esté implementada) `POST /api/session/login/2fa`
- [ ] La sesión se establece **solo** tras completar el login por entero — incluido el segundo
      factor cuando la cuenta lo tenga activo (hallazgo 2); nunca antes de validar usuario+contraseña
- [ ] Cookie de sesión `HttpOnly` + `Secure` + `SameSite=Lax`; ninguna credencial ni identificador de
      sesión persiste en `localStorage`/`sessionStorage`, ni es legible desde JS de la página
- [ ] Store de sesiones server-side (no cookie stateless) — permite revocar sesiones activas de un
      `uuid` en el mismo request que procesa un cambio de contraseña o un disable de 2FA hecho a
      través de la sesión
- [ ] Ninguna llamada mutable a `xindeler-auth` (`change_username`, `change_password`,
      `delete_account`, `2fa/*`) se hace directo desde el frontend — todas pasan por proxy en
      `waitlist-api`, autenticadas por la cookie de sesión
- [ ] `xindeler-auth` no requiere ningún cambio de contrato para esto — se lo sigue llamando
      server-to-server exactamente como ya expone sus endpoints hoy
- [ ] 005 y 006 quedan desbloqueadas: pueden construir sobre `GET /api/session/me` (o equivalente)
      para saber si hay alguien logueado al cargar `/account`, sin repetir la investigación de esta
      tarea

---

## Fuera de alcance

- Cualquier cambio de contrato en `xindeler-auth` (permanece 100% stateless, como está diseñado)
- Migrar `waitlist-api` a un repo versionado en sí mismo — es la Decisión #1, pero el trabajo de
  migración (mover código, armar CI, etc.) no es parte de esta tarea de diseño
- La UI de la pantalla de cuenta en sí — eso es [005](005-cuenta-jugador-seguridad.md)
- El endpoint de personajes del game server — eso es [006](006-cuenta-jugador-personajes.md)
