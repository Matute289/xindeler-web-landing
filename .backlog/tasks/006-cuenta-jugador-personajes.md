# 006 — Visor de personajes en la pantalla de cuenta

**Estado:** `[~]` Frontend implementado (2026-08-20), **falta la verificación final contra
producción real**. El endpoint (NH-79) está implementado, mergeado en los tres repos, y validado
end-to-end en un ambiente local completo (los tres servicios corriendo a la vez: `xindeler-auth`,
`xindeler-web-api`, `xindeler-new-horizon`) — se creó un personaje real por el protocolo del juego,
se lo listó y renombró a través de `GET/POST /api/account/characters*` de `xindeler-web-api`, se
probaron los casos de rechazo (nombre vacío, caracteres inválidos, personaje inexistente), y se lo
eliminó, todo con la cadena de auth real (sin el stub de debug de la Fase 1 de NH-79). Detalle
completo en la sección "Resolución" más abajo.

La tab "Personajes" en `/account` ya no es un placeholder — `CharactersTab.jsx` consume
`GET/POST /api/account/characters*` de verdad: lista con nivel/clase/ubicación, borde y color por
clase (paleta propia de Xindeler, 15 clases reales de `ClassKind`), badge de nivel, y rename inline
con manejo de error mostrando el mensaje real del server (nombre vacío, duplicado, etc.). Probado
en el navegador (ES/EN) con la respuesta de la API simulada — **sin probar todavía contra el
endpoint real**, porque el game server en el VPS sigue con la versión vieja (BL-83 en
`xindeler-new-horizon`, sin correr todavía). Cuando ese deploy esté hecho, falta: (1) confirmar que
la tab funciona con datos reales de producción, (2) el estado de carga cuando el game server
todavía no tiene NH-79 (hoy cae en el estado de error genérico "no pudimos cargar", que es
razonable pero no se probó contra el 502 real de `xindeler-web-api`).
**Prioridad:** Alta (mismo pedido de Matías que 005)
**Esfuerzo estimado:** hecho — solo falta la verificación final una vez que el game server esté
actualizado en producción (ver riesgo de topología en "Resolución")
**Depende de:** [007-sesion-web-autenticada.md](007-sesion-web-autenticada.md) para la sesión
persistente (ya resuelto — ver 008, navbar consciente de sesión, ya mergeada). El blocker de
backend original (endpoint inexistente en `xindeler-new-horizon`) está resuelto — ver "Resolución".

---

## Objetivo

Tercera parte del pedido de Matías (ver [005](005-cuenta-jugador-seguridad.md) para las otras dos):
una tab "Personajes" en la pantalla de cuenta que liste los personajes del jugador con **nivel,
clase y ubicación actual** expresada como jerarquía **ciudad/aldea → reino → continente/plano**, y
permita renombrarlos.

Esta tarea documenta por qué no se puede implementar hoy, dónde está el gap exacto, y qué forma
debería tener la solución — sin implementar nada, porque la pieza que falta no vive en este repo
(mismo principio de separación de responsabilidades que ya usa el backlog de `xindeler-auth` para
2FA: "acá se investiga y se diseña el consumo, allá se construye el servicio").

---

## Hallazgos clave de la investigación

### El dato no existe en ningún lugar alcanzable desde esta landing hoy

Recorrido de los tres backends que esta landing sí conoce, ninguno tiene esto:

1. **La FastAPI propia de la landing** (`/srv/xindeler/waitlist-api/main.py`, puerto 8010, ver
   `CLAUDE.md` de este repo) solo expone `/api/waitlist`, `/api/contribute` y `/api/status`
   (online/offline del puerto 14004 del game server, cacheado 30s). No tiene acceso a ningún dato
   de personajes — nunca lo tuvo, no es su responsabilidad.
2. **`auth.xindeler.com`** (`xindeler-auth`) solo conoce identidad de cuenta: `username`, `uuid`,
   `email`, `pwhash`. Nivel/clase/ubicación son estado de **juego**, no de autenticación — no
   pertenecen ahí y el diseño de ese repo (ver su `CLAUDE.md`) no los contempla en ningún lado.
3. **El game server** (`xindeler-new-horizon`) es donde realmente vive este dato, pero habla
   exclusivamente el **protocolo binario propio de Veloren** (TCP/QUIC vía Quinn) — no expone REST
   ni WebSocket para nada de esto. Esto ya está confirmado en la tarea
   [004-docs.md](004-docs.md) de este mismo backlog: *"No hay REST API ni WebSocket para el
   juego... La única REST API es FastAPI (waitlist, contributors, status)"*.

**Conclusión: hoy no existe ningún camino, directo ni indirecto, para que esta landing (ni su
FastAPI) lea nivel, clase o ubicación de un personaje.** No es una integración pendiente entre
piezas que ya existen — es un endpoint que nadie construyó todavía, en ningún repo.

### Evidencia de cómo se guarda el estado por-personaje en el game server (para dimensionar el trabajo, no para implementarlo acá)

`xindeler-new-horizon` persiste estado por-jugador en tablas SQL propias, versionadas con
migraciones secuenciales — mismo patrón general que `xindeler-auth` usa con Refinery. Ejemplo
concreto encontrado en `docs/design/specs/2026-07-02-mount-system.md` de ese repo: la feature de
monturas agrega una tabla nueva `player_mounts` (migración `V74__player_mounts.sql`), FK'd al `pet`
existente, con su propio `MountPersistenceData` en `server/src/persistence/models.rs` — análogo al
`PetPersistenceData` que ya existía. Nivel, clase y ubicación de un personaje casi seguro viven en
tablas equivalentes (`character` y afines) dentro de esa misma base de persistencia — no se leyeron
en detalle porque no hace falta para este documento, pero el patrón ("una tabla por concepto,
migración secuencial, `server/src/persistence/models.rs`") se repite en todo ese repo.

Esto importa para esta tarea porque confirma que el dato existe y es estructurado (no hay que
inventar un modelo desde cero del lado del juego), pero también que **nadie lo expuso nunca fuera
del proceso del game server**.

### La jerarquía de ubicación pedida sí tiene equivalentes conceptuales en el diseño del mundo — aunque no en una API

`xindeler-new-horizon` ya modela conceptualmente algo parecido a "ciudad → reino → continente":

- La documentación de ORACLE (el world director) describe un `WorldGraph` con `Region`,
  `Settlement`, `FactionNode`, `ResourceNode` (ver `oracle/world-state.md` en la estructura de
  contenido de [004-docs.md](004-docs.md) de este mismo backlog).
- Varios specs de diseño de ese repo mencionan explícitamente reinos y continentes —
  `docs/design/specs/2026-06-24-xindeler-worldmap-design.md` y
  `docs/design/specs/2026-06-13-lore-cosmology-v2-design.md`, entre otros.

Lo más probable es que el endpoint que eventualmente exponga esto **resuelva la posición runtime
del personaje** (coordenadas o site actual) **contra esas estructuras ya existentes**, en vez de
inventar una jerarquía nueva desde cero. Punto a confirmar por quien diseñe ese endpoint del lado
de `xindeler-new-horizon` — no es algo que este repo pueda decidir ni construir.

### Camino de resolución más probable (a decidir en `xindeler-new-horizon`, no acá)

Un endpoint HTTP autenticado, de solo lectura, expuesto por el game server o por un pequeño
servicio que lea su store de persistencia — mismo principio de separación de responsabilidades que
ya rige el resto de este backlog (ver Fase L de `xindeler-auth`: "acá el servicio, allá quien lo
consume"). Esta landing sería consumidora, ya sea:

- **Directo desde el frontend**, si ese nuevo endpoint viene pensado con CORS y auth para eso, o
- **Indirecto vía la FastAPI de waitlist actuando de proxy/agregador** — más consistente con el
  patrón actual, donde la landing nunca habla directo con el game server salvo el chequeo de puerto
  de `/api/status`.

Cualquiera de las dos formas requiere además una manera de autenticar "este `uuid` me pertenece"
ante el game server — probablemente reusando el mismo `AuthToken`/`/verify` que `xindeler-auth` ya
provee (el game server ya sabe hablar con `auth.xindeler.com` para el login in-game), no un
mecanismo nuevo.

**Nada de esto se puede implementar en este repo hasta que ese endpoint exista.** La tab
"Personajes" debe quedar explícitamente marcada como bloqueada, o construirse contra un
placeholder ("Próximamente") si Matías quiere lanzar el resto de la pantalla de cuenta (005) sin
esperar a este blocker.

---

## Resolución (2026-08-20)

El endpoint se diseñó e implementó en los tres repos, en el orden que pidió Matías
(`xindeler-new-horizon` primero), respondiendo cada una de las "Decisiones a confirmar" de abajo:

1. **Quién lo diseña/implementa:** las tres piezas, coordinadas cross-repo:
   - `xindeler-new-horizon` (NH-79): endpoint in-process nuevo, `GET/POST /player_api/v1/characters*`
     (loopback-only, PR #197 Fase 1 + PR #198 Fase 2 + PR #199 fix de un bug no relacionado que
     bloqueaba el arranque local, `EventBus<DismissSummonEvent>` sin registrar).
   - `xindeler-auth` (N-01): `CharacterAccessToken` acotado (60s, un solo uso) —
     `POST /issue-character-access-token` / `POST /verify-character-access-token`, con dos
     credenciales de servicio separadas que nunca se cruzan (PR #39 + PR #40, el wrapper de
     cliente `authc`).
   - `xindeler-web-api` (Fase F): el proxy público — `GET/POST /api/account/characters*` (PR #14).
2. **Expuesto directo o vía proxy:** vía proxy — `xindeler-web-api`, nunca directo al game server
   (mismo criterio que el resto de este backlog: nada server-to-server se llama directo desde el
   frontend).
3. **Autenticación:** token acotado nuevo (`CharacterAccessToken`), no el `AuthToken` de login —
   ver Fase N de `xindeler-auth` para el porqué (dos modelos de confianza distintos, no se podían
   compartir).
4. **Jerarquía ciudad → reino → continente:** resuelto de forma más simple de lo esperado — la
   respuesta trae `location: { site, kingdom, continent }`, con `kingdom`/`continent` en `null`
   hasta que exista una jerarquía real de mundo consultable (no bloqueante para esta tarea, el
   frontend puede mostrar solo `site` por ahora).
5. **Rename, mismo endpoint o separado:** dos rutas separadas bajo el mismo namespace —
   `GET .../characters` (lectura) y `POST .../characters/{id}/rename` (escritura), no un único
   endpoint combinado.
6. **005 sola primero:** así se hizo — 005 y 008 (navbar) ya están deployadas, esta tarea quedó
   como la única pieza pendiente de la pantalla de cuenta.

**Validado end-to-end**, no solo revisado por código: se levantaron los tres servicios en local
(`xindeler-auth` + `xindeler-web-api` + `xindeler-new-horizon`), se creó una cuenta de prueba real,
se creó un personaje por el protocolo real del juego (no un insert a mano), y se lo listó,
renombró, y borró a través de `xindeler-web-api` — incluyendo los casos de rechazo (nombre vacío →
`422`, caracteres inválidos → `409` reenviado desde el game server, personaje inexistente → `409`).
La cadena de autenticación real (sin el stub de debug de la Fase 1 de NH-79) funcionó de punta a
punta.

**Riesgo que sigue abierto, no bloquea esta tarea:** el game server (`xindeler-new-horizon`)
todavía no está deployado en ningún lado — la prueba de arriba fue 100% local. `xindeler-web-api`
espera al game server en `WEB_API_GAME_SERVER_PLAYER_API_URL` (loopback-only por diseño de ese
repo, NH-75), así que ambos servicios van a tener que compartir host cuando se deploye — decisión
de infraestructura pendiente, no de este repo.

---

## Estructura propuesta (para cuando el endpoint exista del lado de `xindeler-new-horizon`)

```
src/components/account/
└── CharactersTab.jsx   → lista de cards, una por personaje
```

- Card por personaje: nombre (editable — no confirmado si el rename vive en el mismo endpoint de
  lectura o es otro, ver Decisiones), nivel, clase, ubicación como breadcrumb
  `Ciudad/Aldea → Reino → Continente/Plano`
  (ej. ilustrativo, no nombres reales del juego: "Puerto Cendal → Reino de Ashvale → Continente de
  Kaldreth").
- Estado vacío: "Todavía no creaste un personaje en el juego", con CTA opcional a la descarga
  (`DownloadSection`).
- **Mientras el endpoint no exista:** placeholder tipo "Próximamente — todavía no hay forma de leer
  tus personajes desde acá" en vez de datos mock permanentes en producción.
- Visual: mismas cards/tabs que define [005](005-cuenta-jugador-seguridad.md) para el resto de la
  pantalla de cuenta.

---

## Acceptance criteria (para cuando se implemente, una vez resuelto el blocker)

- [ ] Lista todos los personajes del `uuid` logueado, con nivel, clase y ubicación jerárquica
- [ ] Permite renombrar un personaje
- [ ] Maneja el estado "sin personajes todavía"
- [ ] Visual consistente con el resto de la pantalla de cuenta (005)
- [ ] Bilingüe ES/EN

---

## Decisiones a confirmar

**Las seis quedaron respondidas — ver "Resolución" arriba.** Se deja el registro original de las
preguntas como referencia histórica de por qué se tomó cada decisión.

1. **¿Quién diseña e implementa el endpoint de lectura de personajes en `xindeler-new-horizon`, y
   cuándo entra en su backlog?** Esto bloquea todo lo demás en esta tarea — no lo puede resolver
   este repo.
2. **¿El endpoint lo expone el game server directo, o un servicio intermedio que lea su
   persistencia?** Afecta si esta landing lo consume directo o vía su propia FastAPI.
3. **¿Autenticación del endpoint:** reusa `AuthToken`/`uuid` de `xindeler-auth`, o inventa su propio
   esquema?
4. **¿La jerarquía ciudad → reino → continente ya existe como dato consultable en el mundo**
   (`WorldGraph` de ORACLE), o hay que construir un mapeo nuevo posición → jerarquía?
5. **¿El rename de personaje es parte de este mismo endpoint** (uno solo, lectura + escritura) o
   dos endpoints separados?
6. **Mientras se resuelve el blocker: ¿lanzamos 005 (Seguridad + Username) solo, con la tab
   Personajes en "Próximamente"**, o esperamos a tener ambas piezas para lanzar la pantalla de
   cuenta completa de una sola vez? (Recomiendo lanzar 005 solo — no hay motivo para que este
   blocker retrase el resto.)
