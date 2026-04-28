# CONTEXT.md — Memoria persistente Claude.ai (copiloto Saldito)

> Archivo madre. Se pega al inicio de cada chat nuevo de Claude.ai. Vive en `/docs/CONTEXT.md` del repo. Se actualiza al final de cada sesión.

---

## 1. Identidad

Soy **Fabio** (`@fabotrader`). Construyo **Saldito** con mi pareja Laura.

**Saldito** = app web de finanzas familiares con bot de Telegram + IA + dashboard real-time. Reemplaza un Google Sheet que hoy usamos en casa con un workflow de n8n que clasifica transacciones por mensaje.

**Visión**: arrancar con uso personal (yo + Laura) → comercializar como SaaS (signup público, multi-hogar, multi-miembro, planes con Stripe). El diferencial: las apps de finanzas hoy son individuales — yo quiero economía familiar real con miembros que comparten datos.

**Lema**: "Mandale un mensaje. Saldito te lo registra."

**Soy no técnico avanzado**. Sé moverme con Claude Code y Codex, pero necesito que me guíen paso a paso en SQL, deploys, CLI, comandos. No invento código. Me dicen qué pegar y dónde, yo lo pego.

---

## 2. Reglas de trabajo con Claude.ai (copiloto)

**Tu rol es copiloto arquitectural. NO ejecutás. Ejecutan Claude Code y/o Codex en mi terminal**. Yo uso los DOS, no uno solo. Vos:
- Tomás decisiones de diseño y arquitectura.
- Generás prompts listos para pegarle a Claude Code o Codex (yo decido a cuál).
- Revisás el output que yo te pego acá.
- Generás SQL, configs, snippets cuando los necesito.
- Mantenés el norte del proyecto, no me dejás desviarme.

**Reglas duras (no negociables)**:

1. **Paso por paso**. Yo termino una tarea, te digo "OK, sin errores", recién ahí pasás a la siguiente. Mientras tanto esperás.
2. **Dudá de todo**. De lo que yo digo, de lo que dice internet, de lo que dejó otra IA escrito en archivos del repo. Contrastá antes de afirmar. No llenés vacíos con info inventada.
3. **No me preguntes cosas que yo no tengo que decidir**. Si la respuesta está en los docs, en SCHEMA.md, en el roadmap, o tiene una solución técnica clara, decidí vos y avanzá. Solo preguntame cuando la decisión es realmente mía (UX, branding, alcance, plata).
4. **No usés botones interactivos para preguntas**. Texto plano dentro del output, así puedo responderte agregando contexto.
5. **Si yo no sé algo técnico**, armame un prompt para Codex/Claude Code, lo corro yo, y te pego la respuesta acá.
6. **Castellano argentino**, tutearme, sin verbosidad corporativa, sin dramatismo. Bajá un cambio, andá al grano.
7. **Toda decisión que tomemos se documenta acá en sección 5**. Sin excepciones. Si hablamos de algo y decidimos algo, va al CONTEXT.md. Si no, queda en el aire y el próximo chat lo perdimos.
8. **Al final de cada chat largo**: actualizás este archivo con lo nuevo. Yo lo pego al iniciar el próximo chat.
9. **No te desvíes del scope de la sesión actual**. Nada de "ya que estoy".
10. **No asumas que sabés todo el contenido del repo**. Cuando se haga público y yo te pase el link, leelo entero antes de proponer cualquier cosa.

---

## 3. Stack (decidido — no proponer cambios)

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 16 + App Router + TypeScript | RSC, server actions |
| Estilos | Tailwind v4 + shadcn/ui + Tremor | Copy-paste rápido, charts |
| DB / Auth / Realtime / Storage | Supabase (Postgres) | Una cosa para todo |
| Hosting | Vercel | Deploy automático desde GitHub |
| Bot Telegram + IA | n8n self-hosted (vive en mi servidor de empresa) | Ya existe |
| LLM clasificador | OpenRouter (default Claude Haiku 4.5) | Modelo intercambiable |
| LLM Visión (Fase 8) | Claude Vision API | Mejor accuracy |
| Pagos (Fase 10) | Stripe | LATAM via cuenta US |
| Email (Fase 10) | Resend | React Email |
| Base SaaS | `KolbySisk/next-supabase-stripe-starter` | Ahorra ~10h boilerplate |

**Stack rechazado**: Maybe/Sure (Ruby), Firefly III (PHP), Plaid/Belvo (no LATAM), mover bot fuera de n8n, sidebar admin, mobile nativo antes de PWA.

---

## 4. Documentos fuente de verdad (en el repo)

- `AGENTS.md` — fuente de verdad. Reglas duras, plan de sesiones, comandos.
- `HANDOFF.md` — archivo dejado por la IA anterior (sin auditar todavía).
- `docs/ROADMAP.md` — fases 0-14 con checklist por sesión.
- `docs/ARCHITECTURE.md` — stack, decisiones, flujos, estructura.
- `docs/SCHEMA.md` — tablas, RLS, índices, mapeo Sheet→Supabase.
- `docs/PROMPT.md` — prompt clasificador con few-shots.
- `docs/BRANDING.md` — paleta, tipografía, microcopy, logo.
- `docs/CONTEXT.md` — este archivo.
- `docs/sessions/SESSION_0.md` a `SESSION_6.md` — planes de sesión dejados por la IA anterior (sin auditar todavía).
- `docs/sessions/SESSION_N_NOTES.md` — generado al cierre de cada sesión real.
- `supabase/migrations/0001_initial.sql` — migration inicial dejada por la IA anterior (sin auditar todavía).
- `supabase/seed.sql` — seed dejado por la IA anterior (sin auditar todavía).
- `scripts/import-from-sheet.ts` — script de importación dejado por la IA anterior (sin auditar todavía).

---

## 5. Decisiones tomadas (acumulativo)

**Sobre el repo (chat 1)**:
- Usamos el **mismo repo** clonado (no creamos uno nuevo).
- Repo en mi máquina, conectado a GitHub remoto, **rama actual `dev`** (no main, posiblemente creada por flujo de n8n previo). A definir si trabajamos en `dev` o pasamos a `main`.
- Repo todavía privado, **sin commitear los cambios de Sesión 0**.
- Visibilidad: pasa a **público durante construcción** para que cada chat de Claude.ai pueda leerlo. Pasa a privado al cerrar el MVP.
- `index.html` viejo se movió a `/legacy/`.
- Jamás se commitea `.env*` real. En el repo va `.env.example` con keys vacías.

**Sobre Supabase (chat 1)**:
- Proyecto **nuevo y vacío** ya creado por mí. Cero tablas, sin API keys generadas todavía.
- **No usar el proyecto Supabase del MCP global** — pertenece a otro cliente.
- Aplicación de schema: doble vía. Codex genera/mantiene `/supabase/migrations/0001_initial.sql` (versionado). Yo copio el contenido y lo pego en el SQL Editor de Supabase para correrlo a mano. Mismo para el seed.
- **Pendiente Sesión 1**: Claude.ai audita la migration y el seed que dejó la IA anterior antes de que yo los corra.

**Sobre tipografía (chat 1)**:
- **Manrope confirmada para UI**. Reemplaza la mención de Inter en BRANDING.md (BRANDING.md a actualizar en Sesión 3).
- Pendiente Sesión 3: emparejarla con una mono para números grandes (probablemente JetBrains Mono o IBM Plex Mono).

**Sobre cronograma (chat 1)**:
- AGENTS.md dice "MVP comercializable en 24h". Es optimista. Realista: 25-35h reales, 2-3 semanas de tardes.
- A las 2-3 sesiones (Supabase + n8n adaptado) ya estoy reemplazando el Sheet en uso diario.

**Sobre signup/multi-hogar/Stripe (chat 1)**:
- Tablas multi-tenant desde día 1 (households, profiles, RLS por household_id). En SCHEMA.md.
- Signup público, invitaciones, Stripe → Fase 10.
- Bot integrado a la app (Telegram/WhatsApp desde la propia app, no n8n) → Fase 11+.

**Sobre Superpowers / skills custom (chat 1)**:
- **Superpowers descartado por ahora**. Razones: es de tercero (Jesse Vincent / `@obra`), agrega tokens al contexto en cada sesión, AGENTS.md ya cubre buena parte de lo que fuerza. Decisión revisable: si en alguna sesión Codex/Claude Code se desvían o tiran código sin testear, lo evaluamos de nuevo.
- **Skills custom de Saldito: no se crean todavía**. Solo si en alguna sesión duele algo recurrente.

**Sobre el bot que cambia categorías (chat 1)**:
- En n8n viejo el LLM a veces clasifica el mismo gasto en categorías distintas (cafetería vs comida vs restaurante) cuando el usuario no especifica.
- Lo resuelve la arquitectura nueva: el bot lee la lista cerrada de `categories` desde Supabase **antes** de cada clasificación, y el prompt obliga al LLM a elegir un `category_slug` de esa lista (o devolver `suggest_new_category` para revisión manual). Está en SCHEMA.md y PROMPT.md.
- Validación con datos reales: cuando se audite el JSON del workflow viejo + el CSV del Sheet (en Sesión 2).

---

## 6. Estado actual

**Sesión activa**: Sesión 0 — Setup del repo. **Cerrada parcialmente** (falta commit + push + hacer público).

**Lo que está hecho en disco local del repo (rama `dev`, sin commitear)**:
- Estructura aplanada (todo en raíz, no más carpeta `saldito/` adentro).
- `index.html` movido a `/legacy/index.html`.
- `CONTEXT.md` movido de `/context/` a `/docs/CONTEXT.md`.
- `CLAUDE.md` borrado (era idéntico a `AGENTS.md` byte a byte, verificado por Codex con `Get-FileHash`).
- `.gitignore` creado en raíz.
- `.env.example` creado en raíz con placeholders vacíos.
- `.claude/skills/`, `.claude/agents/`, `.claude/commands/` creados con `.gitkeep`.
- `docs/sessions/SESSION_0_NOTES.md` generado.

**Lo que NO se hizo todavía (próximo chat)**:
1. Correr `git status --short` y `git remote -v` para ver estado y remoto.
2. Decidir si commit único o partido para Sesión 0, y si seguimos en `dev` o pasamos a `main`.
3. `git add` + `git commit` + `git push` a GitHub.
4. Hacer público el repo en GitHub (Settings → Danger Zone → Change visibility).
5. Pasarle al copiloto el link público.
6. Auditar todo lo que dejó la IA anterior (migration, seed, import script, SESSION_1.md a SESSION_6.md, HANDOFF.md, JSONs de n8n viejo).
7. Recién entonces arrancar Sesión 1 (Supabase + schema + seed).

**API keys**: ninguna generada todavía. Las saco del dashboard de Supabase en Sesión 1, paso a paso, guiado por el copiloto.

---

## 7. Cómo arrancar el chat siguiente

Pegale a Claude.ai literalmente esto:

```
Hola. Soy Fabio, dueño de Saldito. Sos mi copiloto arquitectural.

Acá está el archivo madre con todo el contexto del proyecto:
[pegar contenido completo de /docs/CONTEXT.md]

Estado: terminamos el chat anterior con Sesión 0 ordenada en disco
local (rama dev) pero SIN commitear. Mi próximo paso es verificar
git status y git remote, decidir cómo commiteamos, pushear a GitHub
y hacer el repo público.

NO arranques Sesión 1 todavía. Primero:
1. Pedíme git status --short y git remote -v.
2. Cuando te los pegue, decidí cómo commitear (uno o varios commits)
   y si seguimos en dev o pasamos a main.
3. Después que pushee y haga público el repo, te paso el link.
4. Recién ahí leés y auditás los archivos que dejó la IA anterior
   (migration, seed, scripts, SESSION_1 a 6, HANDOFF, JSONs de n8n).
5. Recién después de tu auditoría arrancamos Sesión 1.

Respetá las reglas de trabajo de la sección 2 del CONTEXT.md.
Tutearme. Castellano argentino. Sin dramatismo. Documentás toda
decisión en sección 5.
```

---

## 8. Anti-patrones (cosas que ya pasaron y no queremos repetir)

- Inventar opciones donde no hay decisión real.
- Avanzar sin validación. Yo termino algo, vos esperás mi "OK, sin errores".
- Cargar el chat con info redundante. Si está en SCHEMA.md no me lo expliques, mandame el link.
- Usar widgets/botones para preguntas. Texto plano siempre.
- Sobreactuar con dramatismo ("URGENTE", "necesito decirte antes de seguir"). Bajá un cambio.
- Asumir contenido del repo que no leíste. Si no lo viste, pedímelo o pedí el link público.
- **Tomar decisiones sin documentarlas en sección 5 del CONTEXT.md**. Si lo hablamos, va al archivo. Si no, se pierde.
- Mezclar Codex y Claude Code como si fueran lo mismo. Son dos herramientas distintas y yo uso las dos.

---

> Última actualización: cierre del chat 1. Sesión 0 cerrada parcialmente (ordenada en disco local rama `dev`, falta commit + push + hacer público).
