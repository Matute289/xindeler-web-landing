# 010 — El botón de descarga pasa a bajar el launcher, no el juego crudo

**Estado:** `[ ]` Pendiente — endpoint de `xindeler-web-api` mergeado
([PR #39](https://github.com/Matute289/xindeler-web-api/pull/39), 2026-09-11), sin deployar
todavía; bloqueado además en que `xindeler-updater` publique su primer manifest real (ver abajo)
**Prioridad:** Alta
**Esfuerzo estimado:** S — probablemente solo texto/copy una vez que el backend tenga el nuevo
endpoint; no hay lógica de resolución de plataforma/URL en este repo, vive toda en
`xindeler-web-api`
**Depende de:**
1. `xindeler-web-api` agregando un nuevo endpoint (decisión de Matías: endpoint nuevo, no
   reapuntar el existente) — **listo, mergeado, `GET /api/download-launcher`**. Falta que se
   deploye (ese repo no tiene CD automático).
2. `xindeler-updater` publicando su manifest real (`updater-latest.json`) al VPS — **todavía no**:
   su primer tag real (`v0.1.0`) corrió, Linux/macOS OK, Windows falló (`makensis` no estaba en el
   PATH del runner, fix en su PR #4) y falta que Matías cargue los secrets de firma de Apple.

---

## Objetivo

A pedido de Matías (2026-09-11): el botón de descarga de la landing debe dejar de entregar el
instalador crudo del juego y en cambio entregar el instalador de **`xindeler-updater`** (el
launcher) — el visitante instala el launcher, y este baja el juego real vía el árbol
`updater/` que ya expone `downloads.xindeler.com` (`xindeler-new-horizon` NH-60).

Diseño completo, decisiones y contexto cross-repo (por qué esto vive en `xindeler-web-api`, no
acá; el mecanismo de publicación de instaladores del updater al VPS; la clave SSH acotada al path
`updater-releases/`, ya creada) están en `docs/design/specs/2026-09-11-nh145-...` del repo privado
`xindeler-design` — **NH-145**, no lo repito acá. Preguntar a quien tenga acceso a ese repo, o
retomar desde `xindeler-new-horizon`'s backlog (`backlog/new-horizon.md`, entrada NH-145) si hace
falta el detalle completo.

## Decisión de Matías, ya tomada (2026-09-11)

- Clave SSH del VPS: nueva, dedicada, acotada por `command="rrsync ..."` al path
  `updater-releases/` — ya generada, ya agregada como secret `VPS_SSH_KEY` en
  `xindeler-updater`, ya verificada (escritura dentro del path funciona, `../` bloqueado, shell
  interactivo bloqueado).
- Ruta del VPS: `downloads.xindeler.com/updater-releases/<version>/<file>` — confirmada, no
  bikeshedear el nombre.
- **`xindeler-web-api` agrega un endpoint nuevo** (no reapunta `GET /api/download` existente) —
  para no cambiar el significado del campo `version` de la API actual ni romper a quien ya la
  consuma. Ver la tarea correspondiente en el backlog de `xindeler-web-api`
  (`.backlog/PLAN.md`).

## Qué hace falta acá, concretamente

- [ ] Una vez que el endpoint (`GET /api/download-launcher`, ya mergeado) esté deployado y
  `updater-latest.json` responda con datos reales, cambiar el botón de descarga de la landing
  para llamarlo en vez de `/api/download`.
- [ ] Actualizar el copy del botón/sección de descargas si hace falta ("Descargá el launcher" en
  vez de "Descargá el juego", o similar — confirmar wording con Matías, no inventar tono).
- [ ] Confirmar que el resto del contrato (`{ok, download_url, version}` o lo que el endpoint
  nuevo devuelva) no rompe la detección de OS/arch que ya existe en este repo para el botón de
  descarga (el detector de plataforma es el mismo, solo cambia a qué URL apunta).

## No hacer todavía

- No tocar nada hasta que el endpoint de `xindeler-web-api` exista y esté confirmado — este
  archivo es el placeholder para no perder la tarea, no luz verde para implementar ya.
