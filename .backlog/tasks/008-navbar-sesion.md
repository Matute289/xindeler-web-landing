# 008 — Navbar consciente de sesión: botón de usuario + menú desplegable a Cuenta

**Estado:** `[x]` Implementada (2026-08-16) — probada de punta a punta en el navegador (login/logout
reales, desktop y mobile) contra una cuenta real. En el camino apareció y se corrigió un loop
infinito de re-render en `AuthModal` (el efecto de auto-close dependía de `onClose`/`onLoggedIn`,
que `App.jsx` pasa con nueva identidad en cada render — y `onLoggedIn` en sí dispara ese render al
refrescar la sesión); resuelto leyendo esos callbacks desde refs en vez de las dependencias del
efecto.
**Prioridad:** Alta
**Esfuerzo estimado:** M (hook de sesión compartida + Navbar dinámico en desktop/mobile + AuthModal
notifica tras loguearse; nada de esto depende de trabajo nuevo en ningún backend, los tres
endpoints que hacen falta ya están shippeados)
**No depende de nada externo.** `xindeler-web-api` ya expone `GET /api/session/me` (con
`{ username, totp_enabled }`) y `POST /api/session/logout` (confirmado leyendo
`server/src/session.rs` de ese repo, no asumido). `AuthModal` ya sabe loguear
([005](005-cuenta-jugador-seguridad.md)) y ya se cierra solo tras un login exitoso.

---

## Objetivo

A pedido directo de Matías (2026-08-16), tras loguearse desde el modal:

1. El modal debe cerrarse solo mostrando la confirmación — **ya resuelto** en un fix aparte
   (`fix/auth-modal-autoclose-on-login`, PR #51), no es parte de esta tarea.
2. El botón "Iniciar sesión" del `Navbar` debe **desaparecer y reemplazarse por uno con el nombre de
   usuario**, en desktop y en el menú mobile.
3. Ese botón, al clickearlo, **despliega un menú** con acceso a "Mi cuenta" (`/account`, que ya tiene
   las tabs de Seguridad/Username/Personajes) y "Cerrar sesión". Matías lo describe como el punto de
   entrada a "cambiar contraseña, cambiar nombre de usuario, characters... entre otras cosas que
   iremos haciendo a futuro" — es decir, el propósito de este menú es genérico ("ir a mi cuenta"),
   no un listado plano de cada acción individual: esas ya viven organizadas en tabs dentro de
   `/account`.

---

## Hallazgos clave de la investigación

### 1. Hoy no existe ningún estado de sesión compartido entre componentes

`AccountPage.jsx` es el único lugar del repo que sabe "hay alguien logueado" — tiene su propio
`fetch('/api/session/me')` en un `useCallback` local (`loadSession`, líneas 24-30), sin exponerlo a
nada más. `Navbar.jsx` no sabe nada de sesión: siempre muestra el mismo botón de
"Iniciar sesión"/"Crear cuenta" (`onOpenAuth('login' | 'register')`), sin importar si hay una cookie
de sesión válida o no. `AuthModal.jsx`, tras loguearse con éxito, no notifica a nadie — el único
efecto observable es la cookie `HttpOnly` que puso el server; ningún componente de React se entera.

### 2. `Navbar` y `AuthModal` ya viven en el mismo padre — no hace falta un Context global

Ambos se montan solo dentro de `LandingHome` (`src/App.jsx`), junto con el estado `authModal` que ya
existe ahí (`useState(null)`, pasado a `Navbar` como `onOpenAuth` y usado para renderizar
`AuthModal`). `/account` es una ruta completamente aparte con su propio `AccountPage` — el `Navbar`
nunca se monta ahí. Elevar el estado de sesión a un Context de toda la app sería resolver un problema
que no existe todavía: alcanza con que `LandingHome` cargue la sesión una vez y se la pase a `Navbar`
por props, exactamente el mismo patrón que ya usa con `authModal`.

### 3. El contrato de sesión ya cubre todo lo que hace falta

Confirmado en `xindeler-web-api` (`server/src/session.rs`, `server/src/web.rs`), no asumido:

| Endpoint | Requiere | Respuesta |
|---|---|---|
| `GET /api/session/me` | cookie de sesión | `200 { username, totp_enabled }` o `401` sin sesión |
| `POST /api/session/logout` | cookie de sesión (opcional) | `200 { ok: true }` siempre — limpia la cookie, no es un error si ya estaba deslogueado |

No hace falta ningún endpoint nuevo ni cambio de contrato en ningún backend.

### 4. Duplicar el fetch de sesión entre `AccountPage` y `LandingHome` es innecesario

`AccountPage.jsx` ya tiene la lógica exacta que `LandingHome` va a necesitar (`loadSession`,
`refreshSession`, manejo de `loading`). Vale la pena extraerla a un hook compartido
(`src/hooks/useSession.js`) que ambos consuman, en vez de tener la misma llamada a
`fetch('/api/session/me')` copiada en dos lugares. Esto es una extracción mecánica de lo que ya
existe, no un rediseño — `AccountPage` sigue con su propio `invalidatedReason`/`handleSessionInvalidated`
(específicos de esa pantalla), el hook solo centraliza `{ session, loading, refreshSession }`.

### 5. El link "Ir a mi cuenta" tras loguearse en `AuthModal` ya asume sesión — el Navbar debe reflejarlo al instante, sin recargar

Con el auto-close (PR #51) el modal se cierra solo tras un login exitoso. En ese mismo momento
`LandingHome` necesita refrescar su sesión para que el `Navbar` cambie de "Iniciar sesión" al botón
de usuario sin que quien esté mirando tenga que recargar la página. `AuthModal` ya expone `onClose`
como callback — el patrón más simple es sumar un segundo callback opcional, `onLoggedIn`, invocado en
el mismo punto donde hoy se dispara el auto-close (login directo y login tras resolver 2FA).

### 6. Mobile ya tiene un patrón establecido para "botón de auth dentro del menú"

El menú mobile de `Navbar.jsx` (líneas ~138-148) ya renderiza el mismo botón que el desktop, dentro
de la lista desplegable, con `setMobileOpen(false)` al clickear. El estado de sesión debe reflejarse
ahí también — no hay necesidad de un patrón visual nuevo, solo condicionar qué botón(es) se muestran.

---

## Diseño propuesto

### `src/hooks/useSession.js` (nuevo)

Extrae el patrón ya usado en `AccountPage.jsx`:

```js
export function useSession() {
    const [session, setSession] = useState(null); // { username, totp_enabled } | null
    const [loading, setLoading] = useState(true);

    const loadSession = useCallback(() => {
        return fetch('/api/session/me')
            .then(res => (res.ok ? res.json() : null))
            .then(setSession)
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadSession(); }, [loadSession]);

    const refreshSession = useCallback(() => {
        setLoading(true);
        return loadSession();
    }, [loadSession]);

    return { session, loading, refreshSession };
}
```

`AccountPage.jsx` pasa a consumir este hook en vez de su copia local — sin cambiar nada de su
comportamiento observable (mismo `loading`/`session`/`refreshSession` que ya tenía).

### `Navbar.jsx` — botón dinámico + dropdown

- `LandingHome` monta `useSession()` y pasa `session`/`refreshSession` a `Navbar` (mismo patrón que
  ya usa con `onOpenAuth`).
- **Sin sesión:** el botón actual, sin cambios (desktop: "Crear cuenta"/`UserPlus`; mobile: "Iniciar
  sesión"/`LogIn`, ya resuelto en el PR #49).
- **Con sesión:** un botón con el username (truncado con `max-width`+`overflow:hidden`+`text-overflow:
  ellipsis` si es muy largo — el charset válido permite hasta 32 caracteres) y un ícono de chevron.
  Al clickearlo despliega un menú (mismo lenguaje visual que el resto: `bg-x-navy`,
  `border-white/10`, `font-cinzel`) con dos ítems:
  - **Mi cuenta** → `<Link to="/account">` — sin verificar sesión de nuevo ahí, `AccountPage` ya lo
    hace por su cuenta.
  - **Cerrar sesión** → `POST /api/session/logout`, después `refreshSession()` (vuelve a mostrar el
    botón de login) y cierra el dropdown. Sin manejo de error especial: el endpoint ya devuelve `200`
    siempre (hallazgo 3) — si la llamada de red falla igual, `refreshSession()` corrige el estado
    real (si la cookie seguía viva, `session/me` la va a seguir devolviendo, sin dejar a la UI
    mintiendo sobre haber cerrado sesión).
  - Cierra al hacer click afuera (mismo patrón que ya usan `LanguageSwitcher`/otros dropdowns del
    repo, si existe alguno — si no, `useEffect` con listener de `mousedown` en `document`, limpiado
    al desmontar).
- **Mobile:** dentro de la lista ya desplegada del menú (no un segundo dropdown anidado) — con
  sesión, reemplaza el botón único de auth por dos botones en línea: "Mi cuenta" y "Cerrar sesión",
  cada uno con `setMobileOpen(false)` al clickear, igual que ya hacen los links de navegación de esa
  lista.

### `AuthModal.jsx` — notifica tras loguearse

Nuevo prop opcional `onLoggedIn`. Se invoca junto al `setTimeout(onClose, 1200)` ya existente (mismo
`useEffect` que dispara el auto-close), tanto para el login directo como para el que resuelve un
desafío de 2FA — en ambos casos `success` pasa a `true` con `tab === 'login'`, que es exactamente la
condición que ya gatilla ese efecto.

### `App.jsx`

`LandingHome` pasa `refreshSession` (via `onLoggedIn`) a `AuthModal`, y `session`/`refreshSession` a
`Navbar`.

---

## Fuera de alcance de esta tarea

- **La tab Characters con datos reales** — sigue bloqueada por NH-79
  ([006](006-cuenta-jugador-personajes.md)); el dropdown lleva a `/account` en general, no a una tab
  específica, así que no hace falta esperar a que esa tab tenga contenido real.
- **Notificaciones, avatar/foto de perfil, o cualquier otro ítem del menú más allá de "Mi cuenta" y
  "Cerrar sesión"** — Matías lo dejó explícito como algo para "ir haciendo a futuro", no parte de
  este alcance.
- **Mostrar el estado de sesión en `/account` mismo** (ej. un botón de logout ahí también, sin pasar
  por el Navbar) — esa página ya tiene su propio flujo de vuelta a `/` vía el link "Volver al
  inicio"; si Matías lo pide después, es un agregado menor a `AccountPage.jsx`, no bloquea esta
  tarea.

---

## Acceptance criteria

- [x] Con sesión activa, el `Navbar` muestra un botón con el username en vez de "Iniciar
      sesión"/"Crear cuenta" — en desktop y en el menú mobile (verificado en el navegador con login
      real, ambos viewports)
- [x] Ese botón despliega un menú con "Mi cuenta" (→ `/account`) y "Cerrar sesión"
- [x] "Cerrar sesión" llama a `POST /api/session/logout`, vuelve a mostrar el botón de login sin
      recargar la página, y cierra el dropdown
- [x] Tras loguearse desde el modal (login directo — el flujo de 2FA no se probó porque la cuenta de
      prueba no lo tiene activo, pero comparte exactamente el mismo punto del efecto), el `Navbar`
      refleja la sesión nueva sin recargar la página, en el mismo momento en que el modal se cierra
      solo
- [x] `AccountPage.jsx` sigue funcionando exactamente igual que hoy, ahora consumiendo el hook
      compartido `useSession` en vez de su copia local — verificado navegando ahí desde el dropdown
- [x] El dropdown cierra al hacer click afuera
- [x] Username largo (hasta 32 caracteres) no rompe el layout del Navbar — `max-w-[120px] truncate`;
      mecanismo verificado leyendo el CSS aplicado, no se probó visualmente con un username real de
      32 caracteres
- [x] Visual consistente con el resto del `Navbar`/`AuthModal` (`x-navy`/`x-gold`/`font-cinzel`)
- [x] Bilingüe ES/EN vía i18next (`nav.myAccount`/`nav.logout` en ambos locales)
- [x] `npm run lint && npm test && npm run build` en verde
