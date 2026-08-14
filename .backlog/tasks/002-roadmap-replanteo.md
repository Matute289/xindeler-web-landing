# 002 — Replanteo de la Hoja de Ruta

**Estado:** `[x]` Completo — mergeado en `feat/roadmap-replanteo`  
**Prioridad:** Alta  
**Esfuerzo estimado:** M (1–2 hs — contenido bilingüe + cambios de estructura)

## Problema

El roadmap actual tiene 6 fases y no refleja el estado real del proyecto:

- **Fase 1** marcada como completada, pero CI/CD para cliente y servidor de juego aún falta.
- **Fase 2** incluye "Landing page" que ya está hecha — mezcla cosas completadas con pendientes.
- **Fase de Magia** en progreso real, pero hay mucho por hacer (no está capturado en los items).
- Faltan fases completas: **Items**, **Framework IA del Mundo (Game Master)**, y otras en desarrollo.
- El **Framework de NPCs** (actual Fase 4) debería ir después del Framework IA del Mundo.
- No hay visión de las "grandes ideas" del proyecto — el roadmap actual se queda corto.

## Solución técnica

### Nueva estructura de fases (9 fases)

| # | Título | Estado |
|---|--------|--------|
| 1 | Fundación & Infraestructura Web | ✅ `completed` |
| 2 | Documentación, Wiki & Autenticación | 🔄 `in-progress` |
| 3 | Engine & CI/CD de Juego | ⏳ `upcoming` |
| 4 | Sistema de Magia | 🔄 `in-progress` |
| 5 | Sistema de Items | ⏳ `upcoming` |
| 6 | Framework IA del Mundo (Game Master) | ⏳ `upcoming` |
| 7 | Framework NPCs con IA | ⏳ `upcoming` |
| 8 | Misiones Dinámicas | ⏳ `upcoming` |
| 9 | Mundo MMORPG Persistente | ⏳ `upcoming` |

> ⚠️ **Punto a confirmar:** Fase 4 (Magia) figura como `in-progress` porque el usuario dijo
> que "está en proceso". Confirmar si debe mostrarse así públicamente o como `upcoming`.

---

### Desglose de cada fase

#### Fase 1: Fundación & Infraestructura Web ✅
> Landing page ya live, CI/CD web funcionando, dominio y VPS configurados.
- Landing page & CI/CD web
- Identidad de marca (Xindeler)
- Dominio, CDN y VPS
- API waitlist + lista de espera

#### Fase 2: Documentación, Wiki & Autenticación 🔄
> Web está lista. Quedan docs, wiki y el servicio de auth.
- Portal de documentación
- Sistema wiki
- Servicio de autenticación
- Integración auth con cliente

#### Fase 3: Engine & CI/CD de Juego ⏳
> Infraestructura de juego que falta: mejorar el fork del motor Veloren y automatizar builds.
- Mejoras al motor (fork Veloren/Rust)
- CI/CD aplicación cliente
- CI/CD servidor de juego
- Pipeline de releases multiplataforma

#### Fase 4: Sistema de Magia 🔄
> En proceso. Muchas cosas por desarrollar en este sistema.
- Framework de hechizos
- Escuelas de magia
- UI de creación de hechizos
- Sistema de efectos visuales (VFX)
- Progresión arcana y balance

#### Fase 5: Sistema de Items ⏳
> Loot, crafteo avanzado e inventario — base de la economía del juego.
- Sistema de items & loot
- Crafteo avanzado
- Inventario y equipamiento
- Economía base de recursos

#### Fase 6: Framework IA del Mundo — Game Master ⏳
> Capa de IA que actúa como "Game Master": controla eventos, narrativa emergente y el estado
> del mundo de forma dinámica. Va ANTES del framework de NPCs.
- Motor IA del mundo
- Sistema de eventos dinámicos
- Narrativa emergente generativa
- Estado global del mundo

#### Fase 7: Framework NPCs con IA ⏳
> Los NPCs se apoyan en el Game Master para recibir contexto del mundo.
- Sistema de memoria persistente
- Motor de diálogos dinámicos
- Árbol de comportamiento
- Grafo de relaciones sociales

#### Fase 8: Misiones Dinámicas ⏳
> Generación procedural de quests basada en estado del mundo + NPCs.
- Generador de misiones
- Motor de contexto
- Balanceador de recompensas
- Hilos narrativos

#### Fase 9: Mundo MMORPG Persistente ⏳
> Lanzamiento del mundo online persistente, el objetivo final.
- Servidores persistentes
- Economía de jugadores
- Sistema de facciones y política
- Eventos globales del mundo

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Roadmap.jsx` | Agregar phases 7, 8, 9 al array `PHASES` |
| `src/locales/es/translation.json` | Reescribir fases 1–6, agregar fases 7–9 |
| `src/locales/en/translation.json` | Ídem en inglés |

### Cambios en `Roadmap.jsx`

El componente es 100% data-driven — no requiere cambios de lógica.
Solo actualizar el array `PHASES`:

```js
const PHASES = [
  { number: 1, status: 'completed'   },
  { number: 2, status: 'in-progress' },
  { number: 3, status: 'upcoming'    },
  { number: 4, status: 'in-progress' },  // ← cambia de upcoming a in-progress
  { number: 5, status: 'upcoming'    },
  { number: 6, status: 'upcoming'    },  // ← era "Framework NPCs", ahora "Game Master"
  { number: 7, status: 'upcoming'    },  // ← nuevo: Framework NPCs
  { number: 8, status: 'upcoming'    },  // ← nuevo: Misiones Dinámicas
  { number: 9, status: 'upcoming'    },  // ← nuevo: MMORPG Persistente
];
```

> Nota: el badge numérico usa `0${phase.number}` — funciona bien hasta fase 9.
> Para fase 10+ habría que cambiar el formato.

### También actualizar `aiWorld` disclaimer (opcional)

En `translation.json` hay texto que dice "Fase 4 del desarrollo" referenciando al NPC framework.
Con el nuevo orden, el NPC framework pasa a Fase 7. Actualizar esa referencia.

---

## Acceptance criteria

- [ ] Roadmap muestra 9 fases correctamente
- [ ] Fases 1 (✅), 2 (🔄) y 4 (🔄) tienen los badges de estado correctos
- [ ] Fase 6 dice "Framework IA del Mundo / Game Master" (no NPC Framework)
- [ ] Fase 7 dice "Framework NPCs con IA"
- [ ] Contenido bilingüe: ES y EN actualizados
- [ ] El disclaimer en `aiWorld` referencia correctamente la fase de NPCs (Fase 7)
- [ ] Timeline visual se ve bien en mobile y desktop con 9 fases

## Decisiones a confirmar antes de implementar

1. **Fase 4 (Magia):** ¿`in-progress` o `upcoming` en el roadmap público?
2. **Nombres exactos de las fases** — ¿alguno a ajustar?
3. **Fases adicionales "en desarrollo"**: ¿hay más que agregar después de Fase 9 o van como sub-items?
4. **Fase 3 (Engine):** ¿El "mejorar el motor" es mejoras al fork base de Veloren o algo más específico?
