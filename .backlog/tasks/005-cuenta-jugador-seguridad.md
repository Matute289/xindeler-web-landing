# 005 — Pantalla de cuenta del jugador: sesión, seguridad (2FA) y nombre de usuario

**Estado:** `[ ]` En curso (actualizado 2026-08-15 — ambos bloqueos originales ya se resolvieron)
**Prioridad:** Alta
**Esfuerzo estimado:** L (pantalla nueva con dos tabs, más cambiar contraseña y eliminar cuenta
sumados el 2026-08-15)
**Ya no depende de nada externo.** `xindeler-auth` G-03 / Fase L (2FA/TOTP) está **`done`, mergeada
y desplegada en producción** (PR #29, 2026-08-15) — el kill switch `AUTH_2FA_ENABLED` sigue apagado
por default en producción hasta que game/landing/overlord consuman el contrato, pero se puede
desarrollar y probar esta pantalla activándolo en local/staging. [007-sesion-web-autenticada.md](007-sesion-web-autenticada.md)
también está `done` y deployada — la sesión real (cookie `HttpOnly` vía `xindeler-web-api`)
reemplaza por completo la propuesta provisoria de "sesión en memoria" de la sección 2 original de
este documento (ver abajo).

---

## Objetivo

A pedido directo de Matías: una pantalla para el jugador logueado con dos secciones construibles
hoy sin bloqueos cross-repo reales:

1. **Seguridad** — toggle para activar/desactivar 2FA (TOTP).
2. **Nombre de usuario** — cambiar el username de la cuenta.

(La tercera parte del pedido original — ver personajes del jugador — se separó a la tarea
[006-cuenta-jugador-personajes.md](006-cuenta-jugador-personajes.md) porque tiene un blocker
arquitectónico real en otro repo; no tiene sentido que bloquee esta parte, que sí se puede diseñar
e implementar de punta a punta contra `xindeler-auth`.)

Requisito explícito de Matías: activar 2FA desde esta pantalla debe proteger **tanto el login de
la landing como el login in-game**, porque ambos consumen el mismo estado de cuenta en el backend
de auth. Ver hallazgo 4 abajo — esto no requiere ningún mecanismo de sincronización, solo llamar
correctamente al contrato compartido.

---

## Hallazgos clave de la investigación

### 1. Hoy no existe ninguna pantalla de cuenta ni sesión persistente

`src/components/AuthModal.jsx` es el único punto de contacto con `auth.xindeler.com` que existe en
este repo. Tras un login exitoso (`POST /generate_token`) el componente hace esto y nada más:

```js
if (res.ok) { setSuccess(t('auth.loginSuccess')); setPassword(''); }
```

No guarda el `AuthToken` devuelto, no llama a `/verify`, no persiste nada en memoria, `localStorage`,
`sessionStorage` ni cookies. Es un formulario que valida credenciales y muestra un mensaje de éxito —
no un login real de la web. No hay Context, ni ruta, ni componente de cuenta en ningún lugar del
código (`src/pages/` solo tiene `VerifyEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`).

Tampoco existe hoy ninguna UI para `POST /change_username`, `POST /change_password` ni
`POST /delete_account` — los tres endpoints ya están shippeados en `xindeler-auth` pero ningún
componente de este repo los llama todavía.

### 2. Resuelto por 007: sesión real persistente, no una propuesta en memoria

Esta sección describía originalmente un problema sin resolver — desde entonces
[007-sesion-web-autenticada.md](007-sesion-web-autenticada.md) se implementó y deployó por
completo, y cambia la respuesta.

`xindeler-web-api` (proxy same-origin, `xindeler.com/api/*`) ya mantiene una tabla `sessions`
propia y setea una cookie `HttpOnly`+`Secure`+`SameSite=Lax` (TTL 7 días absoluto) al loguearse vía
`POST /api/session/login`. `GET /api/session/me` devuelve `{ username }` (o `401`) leyendo esa
cookie — es la base que esta pantalla necesita para saber "hay alguien logueado" sin volver a pedir
credenciales en cada visita.

Lo que sigue siendo cierto y sin cambios: `xindeler-auth` en sí sigue sin sesión reusable propia —
`ChangeUsernamePayload`, `ChangePasswordPayload`, `DeleteAccountPayload` y los cuatro endpoints de
TOTP (`enroll`/`confirm`/`disable`/`backup-codes/regenerate`) siguen exigiendo `username` **y**
`password` en cada llamada. Eso es exactamente lo que ya resuelve el patrón de C-02/C-03 de
`xindeler-web-api`: el frontend nunca llama a `xindeler-auth` directo para nada mutable, pasa por
`xindeler-web-api`, que usa el `username` de **la sesión** (nunca uno que mande el cliente) pero
igual necesita que el frontend mande el `password_prehash` fresco en el body de cada acción
sensible (reautenticación por acción, mismo criterio que ya aplican `change-username`/
`change-password`/`delete`). Esta pantalla no necesita retener el password en ningún lado — se lo
pide al jugador en el momento de cada acción sensible, igual que ya hace `AuthModal` al loguearse.

### 3. Contrato de 2FA (Fase L / G-03 de `xindeler-auth`) — implementado y deployado

G-03 pasó a `done` el 2026-08-15 (PR #29 de `xindeler-auth`, mergeado y desplegado en producción,
kill switch `AUTH_2FA_ENABLED` apagado por default). Contrato real, confirmado leyendo
`server/src/web.rs`/`common/src/lib.rs` de `xindeler-auth` — no asumido de la doc:

| Endpoint | Payload | Respuesta |
|---|---|---|
| `POST /2fa/enroll` | `{ username, password }` | `{ secret_base32, otpauth_url, qr_png_base64 }` — **el server ya arma el QR como PNG en base64**, no hace falta ninguna librería de QR en el frontend, solo un `<img src="data:image/png;base64,...">` |
| `POST /2fa/confirm` | `{ username, password, code }` | `{ backup_codes: string[] }` — primer código de 6 dígitos, confirma el enrollment y devuelve los códigos de respaldo (mostrar una sola vez, dejar claro que no se van a volver a ver) |
| `POST /2fa/disable` | `{ username, password, code }` | `Ok` — exige contraseña **y** código TOTP, nunca contraseña sola |
| `POST /2fa/backup-codes/regenerate` | `{ username, password, code }` | `{ backup_codes: string[] }` |
| Cambio en `/generate_token` | igual que hoy | si la cuenta tiene TOTP confirmado, en vez de `200 { token }` devuelve `202 { challenge_id, expires_in }` |
| `POST /login/2fa` | `{ challenge_id, code }` | `{ token }` — mismo shape que `/generate_token`, canjea el challenge por el `AuthToken` real |

Errores específicos de TOTP que el frontend necesita distinguir (status + `code` del body,
`server/src/auth.rs::AuthError::status_code()`/`error.rs::public_fields()`):
`TOTP_ALREADY_ENROLLED` (409), `TOTP_NOT_ENROLLED` (400), `TOTP_ALREADY_CONFIRMED` (409),
`TOTP_INVALID_CODE` (400), `TOTP_CHALLENGE_INVALID` (400, challenge vencido o ya usado),
`ACCOUNT_2FA_LOCKED` (423, tras repetidos códigos incorrectos — mensaje explícito de "contactar
soporte", no hay autogestión de desbloqueo todavía, ver M-10 del backlog de `xindeler-auth`).

Esta pantalla debe, contra ese contrato:
- Mostrar el estado real (`desactivado` / `pendiente de confirmar` / `activado`).
- Al activar: llamar `/2fa/enroll` (vía el proxy de `xindeler-web-api`, ver "Backend" abajo),
  renderizar el PNG del QR, pedir el primer código y llamar `/2fa/confirm`. Mostrar los
  `backup_codes` devueltos una sola vez. Manejar `TOTP_INVALID_CODE`.
- Al desactivar: pedir contraseña **y** código TOTP, llamar `/2fa/disable`.
- El login (`AuthModal.jsx`) necesita manejar el nuevo `202 { challenge_id }` de
  `POST /api/session/login`: si la cuenta tiene 2FA, pedir el código y completar contra
  `POST /api/session/login/2fa` (nuevo endpoint de `xindeler-web-api`) antes de que se establezca
  la sesión — la sesión **no** se crea hasta que el segundo factor se confirma (mismo criterio que
  ya preveía el backlog 007, hallazgo 2).

**Cambio de contrato adicional confirmado en el mismo PR #29 de `xindeler-auth`:** `change_username`
y `delete_account` ahora aceptan un campo `code` opcional (`ChangeUsernamePayload`/
`DeleteAccountPayload`). Es un no-op transparente si la cuenta no tiene TOTP confirmado (o si
`AUTH_2FA_ENABLED` está apagado, como en producción hoy) — confirmado leyendo
`totp::require_step_up_if_confirmed`, no asumido. Cuando la cuenta sí tiene 2FA activo, estas dos
acciones también van a pedir el código — el tab de Nombre de Usuario y el flujo de eliminar cuenta
de esta pantalla necesitan un campo opcional de código TOTP que solo se muestra si la sesión (vía
`GET /api/session/me`, a extender con el estado de 2FA — ver "Backend" abajo) indica que la cuenta
lo tiene activo.

Requisito de producto #2 de Matías (tal como está en Fase L): "promoción, no fricción" — mostrar
un tooltip sugiriendo activarlo, sin forzarlo nunca. Fase L asigna el mismo tooltip también al modal
de login/registro (`AuthModal`) — **eso es una tarea aparte** (ver "Fuera de alcance" abajo), esta
pantalla de cuenta es un segundo lugar natural para el mismo mensaje, no lo reemplaza.

### 4. Por qué "2FA en la landing también protege el juego" no necesita sync — es una sola fuente de verdad

`auth.xindeler.com` es el único backend de autenticación tanto para el login web
(`POST /generate_token` llamado desde `AuthModal`) como para el login in-game (el mismo
`POST /generate_token`, llamado por el cliente de `xindeler-new-horizon` vía `xindeler-authc`).
Ambos flujos leen y escriben **la misma fila** de `users` (y, una vez exista, `user_totp`) para el
mismo `uuid`. Confirmar el enrollment de TOTP vía `/2fa/confirm` desde la landing hace que **todo**
login subsiguiente contra ese `uuid` —sea desde el browser o desde el cliente del
juego— dispare el mismo chequeo de `/login` descrito en Fase L. No hay estado duplicado que
sincronizar entre repos: es una sola fuente de verdad en `xindeler-auth`.

Implicancia de producto, no técnica: el copy de esta pantalla debería dejarlo explícito (ej. "esto
también te va a pedir el código al entrar al juego") para que el jugador entienda el alcance real
del toggle, aunque técnicamente no haga falta ningún trabajo extra para lograrlo.

### 5. `change_username` ya shippeado, con cooldown de 30 días enforced server-side

Confirmado en el `CLAUDE.md` de `xindeler-auth` (tabla de endpoints): cooldown de 30 días entre
cambios de username, aplicado del lado del servidor. La UI necesita:
- Reusar el mismo patrón de chequeo de disponibilidad en vivo que ya tiene `AuthModal`
  (`GET /check-username`, debounce de 450ms, cancelación con `AbortController`).
- Manejar el caso "todavía no pasaron 30 días desde el último cambio" — el shape exacto del error
  (código, si el server expone la fecha en que se vuelve a habilitar) no está confirmado desde este
  repo; hay que revisar `auth::change_username`/`AuthError` en `xindeler-auth` antes de implementar.

### 6. Lenguaje visual a reusar

`AuthModal.jsx` ya define el sistema a seguir: fondo `bg-x-navy`, borde `border-white/10`,
labels/botones en `font-cinzel` mayúscula con `tracking-widest`, acentos y foco en `x-gold`, patrón
`InputField` con toggle mostrar/ocultar contraseña, tabs con `border-b-2 border-x-gold` en el activo.
No hay razón para inventar un sistema visual nuevo para esta pantalla.

---

## Backend — trabajo nuevo en `xindeler-web-api` antes del frontend

Mismo principio que C-02/C-03: **nada mutable se llama directo desde el frontend a
`auth.xindeler.com`**, todo pasa por `xindeler-web-api` autenticado por la cookie de sesión.

- `authclient.rs` suma `totp_enroll`/`totp_confirm`/`totp_disable`/`totp_regenerate_backup_codes`/
  `totp_login` — mismo patrón que las llamadas ya existentes, sin `xindeler-authc`.
- `account.rs` suma `POST /api/account/2fa/{enroll,confirm,disable,backup-codes/regenerate}`
  (requieren sesión; usan el `username` de la sesión, el `password`/`code` los manda el cliente en
  el body) y `POST /api/account/change-password`/`delete` ganan un campo `code` opcional que se
  reenvía tal cual a `xindeler-auth`.
- `session.rs`: `login()` maneja el nuevo `202 { challenge_id, expires_in }` de `/generate_token`
  sin crear sesión todavía; nuevo `POST /api/session/login/2fa` (sin sesión previa, recibe
  `{ challenge_id, code }`, llama `/login/2fa`, y recién ahí crea la sesión — mismo flujo que
  `login()` ya hace tras un `sign_in()` exitoso).
- **Estado de 2FA derivado, sin pedirle nada nuevo a `xindeler-auth`:** no existe ningún endpoint
  de "estado de TOTP" en `xindeler-auth` (los seis endpoints de arriba son todo lo que Fase L
  expone). `xindeler-web-api` puede derivarlo solo de lo que ya observa: si un login pasa por el
  challenge (`202`→`/login/2fa`) sabemos que la cuenta tiene TOTP confirmado; si el login fue
  directo (`200`), sabemos que no. Guardar ese booleano por `uuid` (tabla nueva o columna en
  `sessions`), actualizado también cada vez que `2fa/confirm`/`2fa/disable` tienen éxito a través
  del proxy, y exponerlo en `GET /api/session/me`. Evita inventar un contrato nuevo en
  `xindeler-auth` para algo que ya se puede inferir de su comportamiento actual.
- Los errores específicos de TOTP (`TOTP_INVALID_CODE`, `ACCOUNT_2FA_LOCKED`, etc.) se reenvían con
  el mismo `code`/`message` que ya devuelve `xindeler-auth` — mismo criterio que ya se usó para
  `EMAIL_VERIFICATION_REQUIRED` en C-01 (D-02), en vez de colapsarlos a un error genérico.

## Frontend — estructura de pantalla propuesta

```
src/
├── pages/
│   └── AccountPage.jsx             → ruta /account, requiere sesión activa (GET /api/session/me)
├── components/
│   ├── AuthModal.jsx               → maneja el 202 { challenge_id } del login: pide el código,
│   │                                  completa contra POST /api/session/login/2fa
│   ├── account/
│   │   ├── SecurityTab.jsx         → 2FA (estado, enroll→QR→confirm, disable), cambiar contraseña,
│   │   │                             eliminar cuenta (confirmación explícita, doble paso)
│   │   └── UsernameTab.jsx         → cambiar username, reusa check de disponibilidad
```

Sin `QRDisplay.jsx` ni librería de QR nueva — el QR ya llega como PNG en base64 desde el server
(`qr_png_base64`), solo hace falta un `<img>`.

- `/account` solo es accesible con sesión activa (`GET /api/session/me` responde `200`). Sin
  sesión, redirige a `/` y abre `AuthModal` en modo `login`.
- `AccountPage` con tabs (mismo patrón visual que ya usa `AuthModal` para Registro/Login):
  **Seguridad** | **Nombre de usuario**.
- Tab **Seguridad**: card de 2FA con los tres estados (`off` / `pending` / `on`), tooltip de
  promoción no intrusivo, subflujo de activación (QR + código, mostrar los `backup_codes` una sola
  vez) y de desactivación (password + código). Debajo: cambiar contraseña (pide contraseña actual +
  nueva, y código TOTP si la cuenta lo tiene activo) y eliminar cuenta (acción destructiva —
  confirmación de dos pasos, pide contraseña + código TOTP si aplica, copy explícito de que es
  irreversible).
- Tab **Nombre de usuario**: username actual, input para el nuevo, mismo check en vivo de
  disponibilidad, manejo explícito del cooldown de 30 días, código TOTP si la cuenta lo tiene
  activo.

---

## Fuera de alcance de esta tarea

- El tooltip/QR/código de 2FA dentro del modal de login/registro (`AuthModal`) durante el
  *registro* — Fase L de `xindeler-auth` también lo asigna a este repo, pero es una superficie de
  UI distinta (durante el registro, no en la cuenta ya logueada ni en el login con 2FA activo, que
  sí es parte de esta tarea porque el login sin eso simplemente no funcionaría para esas cuentas) y
  amerita su propia tarea de backlog cuando se aborde. No bloquea a esta.
- El visor de personajes — ver [006-cuenta-jugador-personajes.md](006-cuenta-jugador-personajes.md).
- Autogestión de desbloqueo de cuenta tras `ACCOUNT_2FA_LOCKED` — depende de `/2fa/admin/unlock`
  (requiere service token, hoy solo pensado para soporte manual) y de M-10 del backlog de
  `xindeler-auth`, que sigue `todo`. Esta pantalla solo muestra el mensaje de "contactar soporte".

---

## Acceptance criteria

- [ ] Ruta `/account` accesible solo con sesión activa (cookie real, vía `GET /api/session/me`);
      sin sesión, redirige o exige login
- [ ] Login (`AuthModal`) maneja el `202 { challenge_id }` cuando la cuenta tiene 2FA: pide el
      código, completa contra `POST /api/session/login/2fa`, la sesión no se crea hasta ese punto
- [ ] Tab Seguridad muestra el estado real de 2FA (`off`/`pending`/`on`)
- [ ] Flujo activar 2FA: `enroll` → QR (PNG del server) → `confirm`, muestra los `backup_codes` una
      sola vez, maneja `TOTP_INVALID_CODE`
- [ ] Flujo desactivar 2FA: exige contraseña **y** código TOTP, nunca contraseña sola
- [ ] Cambiar contraseña estando logueado, pidiendo código TOTP si la cuenta lo tiene activo
- [ ] Eliminar cuenta con confirmación de dos pasos, pidiendo contraseña y código TOTP si aplica,
      copy explícito de que es irreversible
- [ ] Copy explícito de que activar 2FA acá también protege el login in-game (requisito 4 de Matías)
- [ ] Tab Nombre de usuario reusa el check de disponibilidad ya existente, muestra el cooldown de
      30 días con un mensaje claro cuando aplica, y pide código TOTP si la cuenta lo tiene activo
- [ ] `ACCOUNT_2FA_LOCKED` muestra un mensaje claro de "contactar soporte" en cualquier flujo donde
      pueda aparecer (login, disable, cambiar username/contraseña, eliminar cuenta)
- [ ] Visual consistente con `AuthModal` (`x-navy`/`x-gold`/`font-cinzel`)
- [ ] Bilingüe ES/EN vía i18next, mismas locales existentes (`src/locales/es`, `src/locales/en`)
- [ ] Ninguna credencial (password ni prehash) se persiste en `localStorage`/`sessionStorage`/cookies
      — la sesión es la cookie `HttpOnly` de `xindeler-web-api`, nada más

---

## Decisiones ya resueltas (histórico)

1. ~~¿Sesión en memoria o persistente?~~ — resuelto por 007: sesión real persistente vía cookie.
2. ~~¿Esperar a que G-03 esté implementado, o mockear?~~ — resuelto: G-03 está `done` y deployado,
   se desarrolla contra el contrato real (`AUTH_2FA_ENABLED=1` en local/staging).
3. ~~¿Cambiar contraseña estando logueado?~~ — confirmado por Matías (2026-08-15): sí, se agrega a
   la tab Seguridad.
4. ~~¿Eliminar cuenta en esta pantalla?~~ — confirmado por Matías (2026-08-15): sí, se incluye en
   esta pasada, con confirmación de dos pasos por ser destructiva e irreversible.
5. ~~Librería de QR~~ — no hace falta ninguna: el server ya devuelve el QR como PNG en base64
   (`qr_png_base64`).
6. **Nombre de ruta:** `/account`, consistente con `/verify-email`/`/forgot-password`/
   `/reset-password` (ya en inglés) — se usa por default salvo objeción.
7. **Tooltip de promoción de 2FA en `AuthModal` durante el *registro*** (no el manejo del `202` en
   el *login*, que sí es parte de esta tarea) — queda como ticket aparte, no bloquea a 005.
