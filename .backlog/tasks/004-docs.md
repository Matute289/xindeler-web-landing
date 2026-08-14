# 004 — Portal de Documentación Técnica

**Estado:** `[ ]` Pendiente  
**Prioridad:** Alta  
**Esfuerzo estimado:** XL (nuevo repo + contenido técnico profundo)  
**Subdomain destino:** `docs.xindeler.greenmountain.dev`

---

## Objetivo

Documentar cómo construir, modificar y contribuir al proyecto Xindeler.
Público: programadores, diseñadores, artistas, DevOps y contributors externos.

---

## Stack recomendado: Docusaurus v3

**Razones:**
- React 18 + MDX — misma tecnología que la landing, el equipo ya la conoce
- Estándar de la industria para docs técnicas de proyectos open source en Rust/Game
- Versioning nativo — cuando el juego tenga versiones (alpha, beta), los docs se versionan
- i18n nativo (ES + EN desde el inicio)
- Algolia DocSearch gratuito para open source
- Soporte de code blocks con syntax highlighting para Rust, TOML, RON, JSON
- MDX: permite componentes React interactivos dentro de los docs (diagramas, tablas de items)
- Deploy estático → mismo pipeline rsync que la landing

**Comparación con VitePress (wiki):**

| | Docs (Docusaurus) | Wiki (VitePress) |
|---|---|---|
| Stack | React | Vue |
| Versioning | ✅ nativo | ❌ manual |
| MDX | ✅ | ❌ (solo MD) |
| i18n | ✅ nativo | ✅ nativo |
| Uso ideal | Docs técnica, guías | Enciclopedia de juego |

**Repo nuevo:** `Matute289/xindeler-docs`

---

## Hallazgos clave de la investigación

Antes de diseñar el contenido, es crítico entender la arquitectura real:

### El servidor es MONOLÍTICO (no microservicios)
El spec de ORACLE lo dice explícitamente:
> *"Single-server fork; design for hundreds of concurrent players and years of sim time, with clean seams for more."*

No existen Login Server, Chat Server, World Server y Combat Server como procesos separados.
Son áreas funcionales dentro de **un único proceso Rust** corriendo en el VPS.
La sección "Servidor" de los docs debe documentarlos como subsistemas, no como servicios.

### No hay base de datos relacional
- Persistencia: **MessagePack single-file** (`rtsim/data.dat`, ~25 MB proyectados)
- Chronicle: **JSONL archival** rotado por tamaño
- Waitlist/Contributors: **CSV files** en el VPS
- Seam futuro a RocksDB/SQLite/PostgreSQL está diseñado pero no es v1

### No hay REST API ni WebSocket para el juego
- El game server usa el **protocolo binario propio de Veloren** (TCP/QUIC via Quinn)
- La única REST API es FastAPI (waitlist, contributors, status) en puerto 8010
- ORACLE expone admin commands via el chat del servidor (`/oracle pause`, `/oracle status`, etc.)
- No hay WebSocket; la comunicación real-time es via protocolo Veloren

### ORACLE y AURORA son los sistemas más complejos
- **ORACLE** = World Director autónomo (eventos, narrativa, ecosistema de monstruos)
- **AURORA** = Simulación social de NPCs (mente, memoria, relaciones, economía)
- Corren como extensiones del `rtsim` subsystem dentro del server process
- Ambos tienen specs de 40–80 KB de detalle — la documentación de estos sistemas
  va a ser la parte más valiosa del portal

---

## Estructura de contenido

```
docs/
├── intro.md                    → Qué es Xindeler, cómo navegar los docs
│
├── proyecto/
│   ├── arquitectura.md         → Workspace Rust, módulos, flujo de datos
│   ├── tecnologias.md          → Rust nightly, wgpu, ECS (vek/ECS spec), Quinn, RON
│   ├── instalacion-local.md    → Clonar, cargo build, levantar server+client
│   ├── estructura-de-archivos.md → Mapa del workspace (voxygen, server, rtsim, world, assets)
│   └── persistencia.md         → MessagePack data.dat, JSONL chronicle, CSV waitlist
│
├── cliente/
│   ├── arquitectura.md         → voxygen: render loop, escenas, hot-reload assets
│   ├── renderizado.md          → wgpu pipeline, chunks voxel, LOD, iluminación
│   ├── ui.md                   → egui/conrod, HUD, inventario, chat
│   ├── input.md                → Keybindings, input mapping
│   └── audio.md                → Sistema de sonido, ambient audio
│
├── servidor/
│   ├── arquitectura.md         → Proceso único, ECS tick, subsistemas
│   ├── world-simulation.md     → rtsim: sites, factions, NPC long-running sim
│   ├── combat.md               → ECS systems de combate: buffs, proyectiles, poise, parry
│   ├── economia.md             → Economy en sites, traders, rutas de mercaderes
│   ├── persistencia.md         → Save/load MessagePack, migration strategy (serde default)
│   └── admin-commands.md       → /oracle, /aurora, /give, /set_class, etc.
│
├── sistemas/
│   ├── combate.md              → Mecánicas: combos, buffs/debuffs, poise, backstab, parry
│   ├── magia.md                → Escuelas, MagicSource enum, SpellDef, status effects
│   ├── clases.md               → ClassKind, skill trees, restricciones de equipo
│   ├── razas.md                → Racial traits, habilidades innatas
│   ├── crafting.md             → Recipe system, materials, recipe_book_manifest
│   ├── items.md                → Item types, calidad, requisitos de clase/raza/nivel
│   ├── inventario.md           → Slot system, drag-drop, équipement slots
│   └── habilidades.md          → Skill tree manifest, unlocking, general skills
│
├── oracle/
│   ├── intro.md                → Qué es ORACLE, rol de World Director
│   ├── arquitectura.md         → Placement en rtsim, módulos, threading model
│   ├── world-state.md          → WorldGraph: Region, Settlement, FactionNode, ResourceNode
│   ├── world-facts.md          → WorldFact enum, contrato ORACLE↔AURORA
│   ├── event-engine.md         → Lifecycle (Proposed→Resolved), clases de eventos, pacing
│   ├── narrative.md            → Arc templates, LLM layer, canon validation
│   ├── ecosystem.md            → Monster populations, Lotka-Volterra, drift, variantes
│   ├── astronomy.md            → Seasons, moon phases, eclipses, CelestialState
│   ├── llm-integration.md      → LLM proposer thread, HTTP trait, llama.cpp local vs API
│   ├── admin.md                → Admin commands, kill-switch, canary metrics
│   └── anti-chaos.md           → Safeguards, circuit breaker, auto-rollback
│
├── aurora/
│   ├── intro.md                → Qué es AURORA, relación con ORACLE
│   ├── npc-mind.md             → Mind struct: values, fears, alignment, mood, goals
│   ├── memoria.md              → STM, LTM episódica, semantic — salience, forgetting
│   ├── social-graph.md         → EdgeKind (Kinship, Friendship, Romance...), ego-centric queries
│   ├── life-simulation.md      → Nacimiento, aging, muerte, familia, herencia
│   ├── economia.md             → SiteEconomy, price_mult dinámico, merchant routes
│   ├── organizaciones.md       → Organization types, goals, governance, GOAP
│   ├── quest-generation.md     → Quest templates, need detection, anti-exploit
│   ├── llm-generative.md       → Tier 1 (offline baked), Tier 2 (live local LLM+TTS)
│   └── contratos.md            → ORACLE↔AURORA: Observation queue, WorldFact read-only
│
├── apis/
│   ├── veloren-protocol.md     → Protocolo binario game server (no REST), Quinn/QUIC
│   ├── fastapi-web.md          → REST endpoints: /api/waitlist, /api/contribute, /api/status
│   ├── admin-commands.md       → ORACLE/AURORA admin via server chat commands
│   └── telemetria.md           → TelemetryLayer JSONL, métricas, BoundedWriter
│
├── contribucion/
│   ├── como-empezar.md         → Fork, clone, build, primer PR
│   ├── git-flow.md             → Branching strategy (main/development/feat/*), PRs, reviews
│   ├── code-style.md           → Rust conventions, clippy, rustfmt, naming
│   ├── testing.md              → Cargo test, integration tests, benchmarks
│   ├── agregar-npc.md          → Guía paso a paso: archivo RON, entity, comportamiento
│   ├── agregar-hechizo.md      → SpellDef en compendium.ron, CharacterAbility, balance
│   ├── agregar-item.md         → Item RON, recipe, loot tables, restricciones
│   └── agregar-criatura.md     → Entity file, abilities, loot table, spawn rules
│
└── referencia/
    ├── asset-formats.md        → RON, TOML, formato de assets, calidad de items
    ├── ecs-components.md       → Componentes ECS más comunes (Health, Body, Stats, etc.)
    └── glosario.md             → ECS, rtsim, ORACLE, AURORA, WorldFact, rmp-serde, etc.
```

---

## Prioridad de contenido (orden de redacción)

### Sprint 1 — Esencial para contributors
1. `proyecto/instalacion-local.md` — Cómo compilar y levantar
2. `proyecto/arquitectura.md` — Mapa mental del workspace
3. `contribucion/como-empezar.md` — Primer PR
4. `contribucion/git-flow.md` — Branching strategy
5. `contribucion/code-style.md` — Rust conventions

### Sprint 2 — Sistemas de juego
6. `sistemas/combate.md`
7. `sistemas/magia.md`
8. `sistemas/clases.md`
9. `sistemas/crafting.md`
10. `contribucion/agregar-npc.md` + `agregar-hechizo.md`

### Sprint 3 — ORACLE y AURORA (los más valiosos)
11. `oracle/intro.md` + `oracle/arquitectura.md` + `oracle/world-state.md`
12. `oracle/event-engine.md` + `oracle/narrative.md`
13. `aurora/intro.md` + `aurora/npc-mind.md` + `aurora/memoria.md`
14. `aurora/quest-generation.md`

### Sprint 4 — Referencia completa
15. Cliente (voxygen), Servidor profundo, APIs, Referencia

---

## Correcciones al brief original del usuario

El brief mencionaba algunos elementos que reflejan la arquitectura objetivo pero no la actual:

| Brief original | Realidad actual | Cómo documentar |
|---|---|---|
| "Login Server" | No existe separado. Auth es parte del server process | Subsistema "Autenticación" dentro del server |
| "Chat Server" | No existe separado. Chat es parte del server process | Subsistema "Chat" dentro del server |
| "World Server / Combat Server" | Mismo proceso; áreas funcionales | Documentados como subsistemas del server |
| "Docker" | No especificado en ningún spec | Sección placeholder "próximamente" |
| "Base de datos" | MessagePack single-file, no DB relacional | Documentar como "Persistencia" con la realidad |
| "REST / WebSocket" | Solo FastAPI waitlist; game usa protocolo binario | Documentar el protocolo real + FastAPI |

> El portal de docs puede documentar tanto el estado actual como el futuro planeado,
> marcando claramente qué está implementado y qué es arquitectura objetivo.

---

## Deploy y CI/CD

```yaml
# .github/workflows/deploy-docs.yml (en xindeler-docs)
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: build/
          target: /srv/xindeler/docs/
```

nginx config: nuevo server block para `docs.xindeler.greenmountain.dev`
apuntando a `/srv/xindeler/docs/`.

Los secrets (`VPS_HOST`, `VPS_SSH_KEY`) ya existen en la GitHub org del proyecto.

---

## Acceptance criteria

- [ ] `docs.xindeler.greenmountain.dev` resuelve y muestra el portal
- [ ] Tema visual consistente con la landing (dark, dorado, tipografía Cinzel en headers)
- [ ] Sección "Cómo empezar" completa y funcional (compilar + levantar el juego)
- [ ] Sección ORACLE con arquitectura documentada
- [ ] Sección AURORA con NPC mind + memoria documentada
- [ ] Guías de contribución: agregar NPC, hechizo e item
- [ ] Búsqueda funcional (Algolia DocSearch o local)
- [ ] Bilingüe ES + EN
- [ ] Deploy automático via GitHub Actions
- [ ] Los "seams" futuros (microservicios, DB) documentados como "roadmap" claramente separado

---

## Decisiones a confirmar antes de implementar

1. **¿Docusaurus ok?** ¿O preferís VitePress para que ambos (wiki + docs) usen el mismo stack?
2. **¿Bilingüe desde el inicio** o arrancamos solo en ES dado el volumen de contenido?
3. **ORACLE y AURORA:** ¿puedo usar los specs de `xindeler-design` como fuente para los docs,
   o necesitás revisarlos antes de publicar? (Hay mucho detalle técnico sensible en esos specs.)
4. **¿El repo se llama `xindeler-docs`** o preferís otro nombre?
5. **¿Los docs van en el mismo repo que la wiki** o repos separados?
   (Recomiendo separados — audiencias distintas, deploy independiente.)
