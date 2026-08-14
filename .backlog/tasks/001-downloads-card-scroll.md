# 001 — Card "Descargas" scrollea a DownloadSection

**Estado:** `[x]` Completo  
**Prioridad:** Alta  
**Esfuerzo estimado:** XS (< 15 min)

## Problema

La card "Descargas" en el panel `CommunitySection` ("Únete a la Comunidad") apunta a
`https://downloads.xindeler.greenmountain.dev` y abre en pestaña nueva.

El usuario espera que al clickear scrollee suavemente a la sección `DownloadSection`
("Únete a la Aventura") que está más abajo en la misma página.

## Solución técnica

### Archivos a modificar
- `src/components/CommunitySection.jsx`

### Cambios

1. **`LINK_DEFS` — entrada `downloads`**: cambiar `href` de la URL externa a `'#download'`
   (el `id` que ya tiene `DownloadSection`).

2. **`<motion.a>` — prop `target`**: la lógica actual es `link.href !== '#' ? '_blank' : undefined`,
   lo que haría que `#download` abra en `_blank`. Cambiar a:
   ```js
   target={link.href.startsWith('#') ? undefined : '_blank'}
   ```
   Esto cubre tanto `'#'` como cualquier hash interno futuro.

3. **Scroll suave**: ya está cubierto por `html { scroll-behavior: smooth }` de Tailwind/global CSS.
   No requiere JS extra.

## Acceptance criteria

- [ ] Click en la card "Descargas" scrollea suavemente a la sección "Únete a la Aventura"
- [ ] No abre pestaña nueva
- [ ] Las demás cards siguen abriendo en `_blank`
- [ ] Funciona en mobile y desktop

## Notas

- `DownloadSection` tiene `id="download"` en línea 40 de `DownloadSection.jsx`.
- `CommunitySection` está antes que `DownloadSection` en `App.jsx` (líneas 42 vs 44),
  por lo que el scroll siempre es hacia abajo.
