# 005 — Pantalla de cuenta del jugador: sesión, seguridad (2FA) y nombre de usuario

**Estado:** `[ ]` Pendiente
**Prioridad:** Alta
**Esfuerzo estimado:** L (pantalla nueva + sesión en memoria + integración con un contrato de 2FA que hoy todavía no está implementado en `xindeler-auth`)
**Depende de:** `xindeler-auth` G-03 / Fase L (`POST /2fa/enroll`, `POST /2fa/confirm`, `POST /2fa/disable`, cambio de contrato en `/login`) — diseñado y documentado, estado `todo`, **no implementado todavía**. También depende de [007-sesion-web-autenticada.md](007-sesion-web-autenticada.md) — el mecanismo de sesión persistente que reemplaza la propuesta provisoria de la sección 2 de este documento.

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

### 2. El auth server no tiene concepto de sesión web reusable — esta pantalla tiene que decidir cómo retiene identidad

Revisando `common/src/lib.rs` en `xindeler-auth`:

- `AuthToken`: 128 bits, **un solo uso**, TTL **15 segundos**. Está diseñado para el handshake
  cliente-de-juego → game server → `/verify`, no para mantener a alguien logueado en un browser.
- `ChangeUsernamePayload { old_username, password, new_username }`,
  `ChangePasswordPayload { username, current_password, new_password }`,
  `DeleteAccountPayload { username, password }` — los tres exigen usuario **y contraseña en cada
  llamada**. No hay bearer/session token reusable para ninguno de ellos.
- La única excepción parecida a un bearer token es `completion_token`, pero está scoped
  exclusivamente al flujo de completar email de cuentas legacy (`/account-email`,
  `/resend-verification`) y también vive poco.

Consecuencia directa: para que esta pantalla no le pida la contraseña al jugador en cada botón que
toca, necesita retener la identidad de alguna forma **sin inventar un mecanismo de sesión
persistente en el backend** — eso está fuera de alcance de este repo, y el diseño de Fase L en
`xindeler-auth` tampoco lo contempla (se mantiene fiel al patrón "revalidar credenciales por
request" que ya usa cada endpoint mutable, y el propio `AuthToken`/`completion_token` reafirman la
política general de tokens efímeros de un solo uso).

**Propuesta (a confirmar, ver "Decisiones" abajo):** un React Context tipo `AccountSessionContext`
que guarda `{ username, passwordPrehash, uuid }` — nunca el password en texto plano, reusando
`netPrehash()` como ya hace `AuthModal` — **únicamente en memoria de JS, nunca en
`localStorage`/`sessionStorage`/cookies**. Se pierde al cerrar o refrescar la pestaña: el jugador
tiene que volver a loguearse. Todas las acciones de la pantalla reusan ese prehash en memoria para
autenticar cada request a `xindeler-auth`. Es deliberadamente menos cómodo que una sesión
persistente, pero no requiere ningún endpoint nuevo ni cambio de contrato del lado del servidor, y
es consistente con la política de tokens efímeros que ya rige todo el servicio.

### 3. Contrato de 2FA (Fase L de `xindeler-auth`) — diseñado, no implementado todavía

Resumen del contrato tal como está documentado en `.backlog/README.md` de `xindeler-auth`
(sección "Fase L"):

| Endpoint | Contrato |
|---|---|
| `POST /2fa/enroll` | Requiere sesión/credenciales válidas. Devuelve `secret` + URL `otpauth://` para render como QR. Queda en estado `pending` hasta confirmar. |
| `POST /2fa/confirm` | Primer código de 6 dígitos que muestra la app autenticadora. Activa el 2FA. |
| `POST /2fa/disable` | Exige contraseña **y** un código TOTP válido — no alcanza con la contraseña sola. |
| Cambio en `/login` (`/generate_token`) | Si la cuenta tiene TOTP confirmado, en vez de devolver el `AuthToken` directo devuelve un estado intermedio (`202` + `challenge_id` de vida corta), canjeable en `POST /login/2fa` con el código. |

Esta pantalla debe, contra ese contrato:
- Mostrar el estado real (`desactivado` / `pendiente de confirmar` / `activado`).
- Al activar: llamar `/2fa/enroll`, renderizar el `otpauth://` como QR, pedir el primer código y
  llamar `/2fa/confirm`. Manejar código inválido/expirado.
- Al desactivar: pedir contraseña **y** código TOTP, llamar `/2fa/disable`.

**G-03 sigue en estado `todo` en `xindeler-auth`** — nada de esto se puede probar contra un
servidor real hasta que se implemente ahí. Ver "Decisiones a confirmar" sobre secuenciamiento.

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

## Estructura de pantalla propuesta

```
src/
├── context/
│   └── AccountSessionContext.jsx   → { username, passwordPrehash, uuid, login(), logout() }
│                                      solo en memoria, nunca persistido
├── pages/
│   └── AccountPage.jsx             → ruta /account, requiere sesión activa
├── components/
│   ├── AuthModal.jsx               → al loguear con éxito, alimenta AccountSessionContext
│   │                                  (hoy no hace nada con el resultado del login)
│   ├── account/
│   │   ├── SecurityTab.jsx         → card de 2FA (estado, toggle, enroll→QR→confirm, disable)
│   │   ├── UsernameTab.jsx         → cambiar username, reusa check de disponibilidad
│   │   └── QRDisplay.jsx           → renderiza el otpauth:// como QR (nueva dependencia, ver
│   │                                  Decisiones)
```

- `/account` solo es accesible con `AccountSessionContext` activo. Sin sesión, redirige a `/` y
  abre `AuthModal` en modo `login` (o muestra un mensaje "iniciá sesión para ver tu cuenta").
- `AccountPage` con tabs (mismo patrón visual que ya usa `AuthModal` para Registro/Login):
  **Seguridad** | **Nombre de usuario**.
- Tab **Seguridad**: card de 2FA con los tres estados (`off` / `pending` / `on`), tooltip de
  promoción no intrusivo, subflujo de activación (QR + código) y de desactivación
  (password + código).
- Tab **Nombre de usuario**: username actual, input para el nuevo, mismo check en vivo de
  disponibilidad, manejo explícito del cooldown de 30 días.

---

## Fuera de alcance de esta tarea

- El tooltip/QR/código de 2FA dentro del modal de login/registro (`AuthModal`) — Fase L de
  `xindeler-auth` también lo asigna a este repo, pero es una superficie de UI distinta (durante el
  login, no en la cuenta ya logueada) y amerita su propia tarea de backlog cuando se aborde. No
  bloquea a esta.
- Los endpoints `/2fa/*` en sí — viven en `xindeler-auth`, hoy `todo`.
- El visor de personajes — ver [006-cuenta-jugador-personajes.md](006-cuenta-jugador-personajes.md).

---

## Acceptance criteria

- [ ] Ruta `/account` accesible solo con sesión en memoria activa; sin sesión, redirige o exige login
- [ ] Tab Seguridad muestra el estado real de 2FA (`off`/`pending`/`on`) contra el contrato de Fase L
- [ ] Flujo activar 2FA: `enroll` → QR → `confirm`, con manejo de código inválido/expirado
- [ ] Flujo desactivar 2FA: exige contraseña **y** código TOTP, nunca contraseña sola
- [ ] Copy explícito de que activar 2FA acá también protege el login in-game (requisito 4 de Matías)
- [ ] Tab Nombre de usuario reusa el check de disponibilidad ya existente y muestra el cooldown de
      30 días con un mensaje claro cuando aplica
- [ ] Visual consistente con `AuthModal` (`x-navy`/`x-gold`/`font-cinzel`)
- [ ] Bilingüe ES/EN vía i18next, mismas locales existentes (`src/locales/es`, `src/locales/en`)
- [ ] Ninguna credencial (password ni prehash) se persiste en `localStorage`/`sessionStorage`/cookies

---

## Decisiones a confirmar antes de implementar

1. **¿El mecanismo de "sesión en memoria" (se pierde al refrescar la pestaña) es aceptable como
   primera versión?** O preferís invertir primero en un mecanismo de sesión persistente (¿nuevo
   endpoint en `xindeler-auth`, tipo cookie de sesión o refresh token?) antes de construir esto —
   eso cambiaría el orden de trabajo entre los dos repos y agregaría alcance nuevo a `xindeler-auth`
   que hoy no está ni pedido ni diseñado.
2. **¿Esta pantalla espera a que `/2fa/enroll|confirm|disable` estén implementados y deployados en
   `xindeler-auth`** (G-03 sigue `todo`), o se construye en paralelo contra un mock del contrato ya
   documentado en Fase L?
3. **¿Agregamos también "cambiar contraseña estando logueado" en la tab Seguridad**, o se mantiene
   exclusivamente vía el flujo actual de `/forgot-password` + `/reset-password`? No estaba en el
   pedido original pero encaja naturalmente ahí.
4. **¿Incluimos "eliminar cuenta" en esta pantalla?** El endpoint (`/delete_account`) ya existe pero
   hoy no tiene ninguna UI en ningún lado. No estaba en el pedido de Matías para esta pantalla —
   confirmar si se agrega acá o queda para otra tarea.
5. **Librería de QR:** hoy no hay ninguna en `package.json`. ¿Alguna preferencia, o delego la
   elección (ej. `qrcode.react`, sin dependencias nativas de canvas)?
6. **Nombre de ruta:** `/account` (consistente con `/verify-email`, `/forgot-password`,
   `/reset-password`, que ya están en inglés) — ¿confirmado, o preferís `/cuenta`?
7. **¿El tooltip de promoción de 2FA en el modal de login/registro** (asignado a este repo por
   Fase L) se arma junto con esta tarea o es un ticket aparte? Recomiendo aparte — no bloquea a 005.
