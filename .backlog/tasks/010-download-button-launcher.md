# 010 — El botón de descarga pasa a bajar el launcher, no el juego crudo

**Estado:** `[x]` Completo (2026-09-11) — verificado end-to-end contra producción real
(`xindeler-web-api` deployado en `v2.3.1`, manifest real de `xindeler-updater` v0.1.0 en vivo).

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

## Qué se hizo

- [x] `DownloadSection.jsx`'s `resolveDownload()` pasó de pegarle a `${apiBase}/download` a
  `${apiBase}/download-launcher` — un único cambio de string, ya que la lógica de detección de
  OS/arch y la forma de la respuesta (`{ok, download_url, version}`) son idénticas. Afecta tanto
  al botón automático como a los 6 manuales, y a las dos superficies que usan este componente
  (la landing principal y `downloads.xindeler.com`), ya que es el mismo componente compartido.
- [x] `OS_DEFS` no necesitó ningún cambio — confirmado contra el manifest real de
  `xindeler-updater` (`updater-latest.json`) que expone exactamente la misma matriz de 5
  plataformas que el juego (sin Windows ARM64, misma razón).
- [x] Copy actualizado (wording confirmado con Matías): `download.description` ("Descargá el
  launcher..." en vez de "Descarga el cliente...") y `download.launcherNote` ("El launcher se
  actualiza solo..." en vez de "El soporte del launcher... llegará pronto", que ya estaba
  desactualizado).
- [x] Verificado en vivo contra producción real (`xindeler-web-api` en `v2.3.1`, manifest real de
  `xindeler-updater` v0.1.0): el botón automático resolvió correctamente macOS ARM64 y arrancó la
  descarga real del instalador del launcher (`xindeler-updater-macos-aarch64.zip`).
