# 003 — Wiki de Xindeler

**Estado:** `[x]` Completo — mergeado en `feat/wiki-online`  
**Prioridad:** Alta  
**Esfuerzo estimado:** XL (nuevo repo + contenido + deploy)  
**Subdomain destino:** `wiki.xindeler.greenmountain.dev`

---

## Objetivo

Crear la enciclopedia viva de Xindeler: una wiki pública con contenido de mecánicas y lore,
calibrada para que **revele lo suficiente para generar interés** sin spoilear el canon profundo
que debe permanecer secreto hasta que haya una versión jugable.

---

## Stack recomendado: VitePress

**Razones:**
- Static output → mismo pipeline de deploy que la landing (rsync al VPS, no requiere DB)
- Markdown-first → el lore de `xindeler-design` ya está en `.md` con frontmatter
- CI/CD via GitHub Actions como el resto del proyecto
- Búsqueda integrada (Algolia DocSearch o local con minisearch)
- Mínimo consumo de recursos en el VPS (2vCPU / 4GB)
- Soporte de custom components Vue para páginas de "database" (items, criaturas)
- Tema alterable con CSS para que se vea como Xindeler (dark, dorado, medieval)

**Alternativas descartadas:**
- Wiki.js / MediaWiki → requieren DB (PostgreSQL/MySQL), más mantenimiento
- Docusaurus → React-based pero orientado a docs técnicas, menos flexible para wiki estilo juego
- Fandom/Notion → no self-hosted, no control editorial

**Repo nuevo:** `Matute289/xindeler-wiki`

---

## Estructura de contenido

### Principio editorial: "tease sin revelar"

| Zona | Política |
|------|----------|
| Gameplay (clases, mecánicas, combate) | **Detalle completo** — está en el código, es público |
| Lore de superficie (razas, regiones, nombres) | **Intro breve + gancho** — suficiente para interesar |
| Canon profundo (panteón, facciones, NPCs, bestiary) | **Stub con "más info próximamente"** — nombre + 1 línea enigmática |
| Historia / cosmología completa | **Solo las Eras mencionadas**, sin spoilers de eventos |
| Reliquias, ritos, tomos | **Listado de nombres**, sin efectos ni lore completo |

---

### Secciones de la wiki

```
wiki/
├── guias/
│   ├── empezando.md
│   ├── creacion-de-personaje.md
│   └── controles-basicos.md
│
├── gameplay/
│   ├── clases/
│   │   ├── index.md         (overview de las 4 clases activas)
│   │   ├── warrior.md
│   │   ├── mage.md
│   │   ├── cleric.md
│   │   └── rogue.md
│   ├── razas/
│   │   ├── index.md         (overview de las 6 razas jugables)
│   │   ├── human.md
│   │   ├── elf.md
│   │   ├── dwarf.md
│   │   ├── orc.md
│   │   ├── danari.md
│   │   └── draugr.md
│   ├── combate.md
│   ├── magia/
│   │   ├── index.md         (escuelas como teaser — nombres + 1 línea)
│   │   └── hemomancy.md     (si se quiere destacar algo)
│   ├── crafteo.md
│   ├── habilidades/
│   │   └── index.md         (overview de skill trees)
│   └── profesiones.md       (stub)
│
├── lore/
│   ├── historia.md          (las 5 eras — nombres y una línea cada una)
│   ├── cosmologia.md        (El Worldsong, las dos lunas, el Veil — teaser)
│   ├── razas-del-mundo.md   (razas no jugables, stub)
│   ├── panteon/
│   │   └── index.md         (16 Luminaries listados: nombre + dominio + 1 frase. Sin lore profundo)
│   ├── regiones/
│   │   └── index.md         (mapa textual de continentes + 2 líneas por región)
│   └── facciones/
│       └── index.md         (nombres + descripción de 1 párrafo teaser)
│
├── base-de-datos/
│   ├── criaturas/
│   │   └── index.md         (categorías de criaturas listadas, algunos ejemplos)
│   ├── items/
│   │   └── index.md         (tipos de items, armas, armaduras — sin stats completos aún)
│   ├── npcs/
│   │   └── index.md         (roster de nombres + rol, sin lore profundo)
│   └── recursos.md          (minerales, materiales de crafteo)
│
└── contribuidores/
    └── index.md             (cómo contribuir a la wiki)
```

---

## Contenido a incluir (basado en investigación de repos)

### Gameplay — detalle completo disponible

#### Clases (4 activas + 10 mencionadas)
**Activas con skill trees completos:**
- **Warrior** — combate cuerpo a cuerpo, maestro de espadas, hachas y martillos
- **Mage** — artes arcanas, spells de evocación y manipulación
- **Cleric** — magia divina, sanación y control
- **Rogue** — sigilo, daño de precisión, movilidad

**Mencionadas (próximamente):** Barbarian, Sorcerer, Warlock, Bard, Paladin, Druid, Ranger, Monk, Artificer, BloodSlayer

#### Razas jugables (detalle completo)
| Raza | Pasivo | Habilidad |
|------|--------|-----------|
| Human | +3% energy reward | Second Wind |
| Elf | +3% velocidad | Fleetness |
| Dwarf | +2% reducción de daño | Stoneblood (buff Fortitude 10s) |
| Orc | +3% daño de ataque | Bloodrage |
| Danari | +5% max energy | Shadowstep (blink corto) |
| Draugr | +10% CC resistance | Gravechill (burst de hielo) |

#### Escuelas de magia — teaser en la wiki
Mencionar que existen múltiples fuentes mágicas (Arcane, Divine, Primal, Psionic, Ki)
y escuelas (Evocación, Hemomancy, Axiomancy, Necromancy, Abjuration...) sin listar todos los spells.
La Hemomancy y Axiomancy son las más originales y pueden tener página propia con descripción
poética pero sin lista de spells completa.

#### Skill trees — descripción por árbol, sin lista exhaustiva de habilidades
Sword, Axe, Hammer, Bow, Staff (Fuego), Sceptre (Sanación), Minería, General

---

### Lore — política "tease"

#### Las 5 Eras de la historia (revelar solo títulos + 1 línea)
1. **El Worldsong** — El inicio. Los jóvenes dioses doman el caos primordial.
2. **La Era del Amanecer** — Los mortales pueblan el mundo por primera vez.
3. **La Ruptura** — Algo se rompe. El mundo nunca fue el mismo.
4. **La Era de las Maravillas** — El apogeo de la civilización. Ciudades que tocaban el cielo.
5. **La Gran Extinción / Segunda Alborada** — El presente. Los supervivientes reconstruyen.

#### Las dos lunas (se puede revelar — es worldbuilding sin spoiler)
- **Phocallis** — La luna blanca. Rige el calendario del mundo.
- **Erevos** — La luna roja. No es lo que parece.

#### Los 16 Luminaries (revelar: nombre + dominio + 1 frase. Sin lore interno)
Ejemplo de entrada: *"Yssira, la Archivista Velada — Diosa del conocimiento y los patrones mágicos. Se dice que su biblioteca contiene el nombre verdadero de cada hechizo que ha existido."*

Revelar: Aurelle, Yssira, Nereth, Solenne, Seraine, Lunere, Velora, Veshtur, Veradel, Toldram,
Hestrel, Maravel, Gildmar, Vorne, Pell, Verdessa.

#### Los Unfaithful — solo mención críptica
*"Existen ocho dioses que rompieron el pacto. Sus nombres son conocidos. Sus cultos, también."*
Sin revelar quiénes son ni sus lores.

#### Regiones — nombre + 2 líneas teaser
Revelar la existencia de: The Highlands, Merovingia, Cromatolis, Xandrian, The Freelands,
Aurora, Azahbbath, Arkhan, Isharat, Lefki Ellada, Isen-Kor.
No revelar: Ventanor, Abyssal Ocean, Nythraldeep, Carcosa, The Maze.

#### Facciones — nombre + descripción teaser (1 párrafo)
Revelar: Caminos Syndicate, Vesperan Dynasty, The Sisterhood, Janus Council.
Otras: listar nombres sin descripción.

#### Bestiary — nombres + 1 línea misteriosa
Revelar existencia de: False Hydra, Frost Worm, Mimic.
No revelar: Foundry Abomination, Terrorath, Todesstern-Lebensstern ni criaturas cósmicas.

#### NPCs — roster con nombre + rol (sin lore)
Mostrar lista de ~10 NPCs notables con nombre, rol y región. Sin backstory.

---

## Plan de implementación

### Fase A: Setup del repo y deploy (infraestructura)
1. Crear repo `Matute289/xindeler-wiki` con VitePress
2. Configurar tema: dark, colores `x-navy`/`x-gold`, fuente Cinzel (consistente con landing)
3. Configurar GitHub Actions: build + rsync a `/srv/xindeler/wiki/`
4. Configurar nginx: `wiki.xindeler.greenmountain.dev` → `/srv/xindeler/wiki/`
5. Configurar búsqueda (VitePress local search en una primera versión)

### Fase B: Contenido de Gameplay
6. Escribir páginas de clases (4 activas)
7. Escribir páginas de razas (6 jugables)
8. Escribir página de combate
9. Escribir página de crafteo
10. Escribir overview de magia y habilidades

### Fase C: Contenido de Lore (modo teaser)
11. Cosmología + eras de historia
12. Panteón (16 entradas cortas)
13. Regiones (mapa textual + 2 líneas)
14. Facciones (4 desarrolladas + listado del resto)
15. Bestiary (stub con 5–6 criaturas)
16. NPCs roster

### Fase D: Guías básicas
17. Guía de inicio
18. Creación de personaje
19. Guía de clases para nuevos jugadores

---

## Archivos a crear / modificar

| Repo | Acción |
|------|--------|
| `Matute289/xindeler-wiki` (nuevo) | Crear con VitePress |
| VPS `/etc/nginx/sites-enabled/` | Agregar config para wiki subdomain |
| VPS `/srv/xindeler/wiki/` | Directorio de deploy |
| `.github/workflows/deploy-wiki.yml` | CI/CD para el nuevo repo |

---

## Acceptance criteria

- [ ] `wiki.xindeler.greenmountain.dev` resuelve y muestra la wiki
- [ ] Tema visual consistente con la landing (dark, dorado, tipografía)
- [ ] Secciones: Guías, Gameplay, Lore, Base de Datos presentes
- [ ] Páginas de las 4 clases activas con info completa
- [ ] Páginas de las 6 razas jugables con pasivos y habilidades
- [ ] Página de cosmología / historia (modo teaser)
- [ ] Panteón con los 16 Luminaries (nombre + dominio, sin lore profundo)
- [ ] Regiones del mundo listadas con descripción breve
- [ ] Facciones principales con párrafo teaser
- [ ] Búsqueda funcional
- [ ] Deploy automático via GitHub Actions
- [ ] Bilingüe ES/EN (VitePress tiene i18n nativo)

---

## Decisiones a confirmar antes de implementar

1. **¿VitePress ok?** ¿O preferís algo más tipo wiki (Wiki.js, MediaWiki)?
2. **¿Bilingüe desde el inicio** (ES + EN) o arrancamos solo en ES?
3. **¿Las páginas de lore las escribo yo** (con lo del repo design) o querés revisarlas antes de publicar?
4. **¿La wiki va en un repo separado** `xindeler-wiki` o dentro de este mismo repo en una subcarpeta?
5. **¿Busqueda:** local (minisearch, gratuita, sin external API) o Algolia DocSearch (gratuito para open source)?
6. **Facciones:** ¿Confirmar cuáles de las 18 puede tener descripción pública y cuáles solo el nombre?
