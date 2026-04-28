# CLAUDE.md

> Este archivo es la **fuente de verdad** del proyecto Saldito.
> Lo leen automáticamente Claude Code, Codex, Cursor, Copilot al arrancar una sesión.
> Si necesitás más detalle, está todo en `docs/`. **No hay nada "al aire".**

---

## 1. Qué es Saldito

App web de finanzas familiares y de emprendedores con **bot de Telegram + IA + dashboard real-time**.

**Caso real**: Fabio (emprendedor, `@fabotrader`) y Laura (su pareja). Comparten algunos gastos, otros son personales, otros son del negocio de Fabio. Hoy usan un Google Sheet con un bot de n8n que clasifica con IA. Funciona, pero no es real-time, la UI es mala, y la categorización derrapa.

**Visión a 6 meses**: SaaS que cualquiera pueda usar. Login, multi-hogar, multi-miembro, separación personal/negocio, historial completo, suscripciones de pago. Comercializable mañana.

**Lema**: *"Mandale un mensaje. Saldito te lo registra."*

**Nombre**: provisional. Hay apps "Saldo" pero ninguna "Saldito". Validar disponibilidad de marca/dominio antes de fase 5 (ver `docs/BRANDING.md`).

## 2. Stack (decidido — no proponer cambios)

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 16 + App Router + TypeScript | Estándar para AI agents |
| Estilos | Tailwind v4 + shadcn/ui + Tremor (charts) | Componentes copy-paste, rápido |
| Backend | Supabase (Postgres + Auth + Realtime + Storage) | Una sola cosa para todo |
| Bot Telegram + IA | n8n self-hosted (ya existe) | No tocar lo que funciona |
| LLM clasificador | OpenRouter (default Claude Sonnet) | Modelo intercambiable |
| LLM visión (fase 4) | GPT-4o multimodal | No requiere OCR previo |
| Hosting | Vercel + Supabase Cloud | Free tier alcanza para MVP |
| Pagos (fase 5) | Stripe o Lemon Squeezy | Estándar SaaS |

**Stack rechazado** (no proponer): sidebar admin, Maybe/Sure (Ruby), Firefly III (PHP), Plaid, mover el bot fuera de n8n.

## 3. Reglas duras (no negociables)

1. **Antes de empezar cualquier sesión**: leer este `CLAUDE.md` + `docs/ROADMAP.md` + el último archivo en `docs/sessions/`.
2. **No proponer cambios de stack ni de schema sin permiso explícito.**
3. **Trabajar SIEMPRE dentro del scope de la sesión actual.** Nada de "ya que estoy".
4. **Validar al cierre de cada sesión** antes de avanzar.
5. **Multi-tenant desde día 1**: toda tabla con `household_id`, RLS estricto.
6. **Trazabilidad total** en `transactions`: `source`, `raw_input`, `ai_confidence`, `ai_reasoning`, `created_by`, `updated_by`.
7. **Idempotencia siempre**: webhooks usan `external_id` único.
8. **Soft delete + audit log**. Nada se borra duro.
9. **Lenguaje UI**: español argentino, simple, casual. Ver `docs/UX.md`.
10. **El prompt del LLM vive en la DB** (`ai_config`), editable desde la app. No hardcodearlo en n8n.
11. **No tocar el repo viejo** `Dashbaord-laufab-finanzas` salvo lectura desde `context/`.
12. **No tocar el Google Sheet viejo**. Backup intocable hasta cutover completo (7 días).
13. **No usar el Supabase MCP global** — es de OTRO cliente. Crear proyecto Supabase nuevo dedicado.
14. **Antes de tocar n8n**: backup del workflow actual a `context/old-n8n/`.
15. **Cada sesión termina obligatoriamente** generando `docs/sessions/SESSION_N_NOTES.md` con: qué se hizo, qué se validó, qué falta, comandos para retomar.

## 4. Plan de sesiones (MVP comercializable en 24h)

Detalle completo en `docs/ROADMAP.md`. Resumen:

| # | Sesión | Output | Tiempo |
|---|---|---|---|
| 1 | DB + import del Sheet viejo | Supabase poblado, tipos TS | 2h |
| 2 | n8n adaptado a Supabase | Bot escribe a DB nueva | 1.5h |
| 3 | Bootstrap Next.js + auth + topbar | Login, deploy en Vercel | 2.5h |
| 4 | Dashboard con KPIs + Realtime | Página `/` con datos vivos | 3h |
| 5 | `/movimientos` reemplaza al Sheet | Tabla editable, filtros, undo | 3h |
| 6 | Categorías + Metas + Editor de Prompt | Loop cerrado, polish, PWA | 3h |

**Total: ~15h. Distribuibles en 1-2 días.**

Después: Fase 2 (chat IA), Fase 3 (multi-currency/cuentas), Fase 4 (foto facturas), Fase 5 (SaaS público con login signup, suscripciones, multi-hogar). Todo en `docs/ROADMAP.md` y `docs/SAAS.md`.

## 5. Cómo arranca cada sesión

Pegar a Claude Code (o Codex) **literalmente esto**, reemplazando `N`:

```
Hola. Vamos a hacer la SESIÓN N de Saldito.

1. Leé CLAUDE.md completo.
2. Leé docs/ROADMAP.md → buscá la sección "Sesión N".
3. Leé docs/sessions/SESSION_(N-1)_NOTES.md si N > 1.
4. Mostrame un plan paso a paso ANTES de tocar nada.
5. Esperá mi OK.
6. Ejecutá. Si tenés dudas, frená y preguntame.
7. Al final, generá docs/sessions/SESSION_N_NOTES.md con:
   - Qué se hizo (checklist).
   - Qué se validó y cómo.
   - Qué quedó pendiente.
   - Comandos exactos para retomar.
   - Decisiones tomadas y por qué.
8. Decime "listo" cuando termines y dame el link/comando para validar.
```

## 6. Cómo cerrar cada sesión

El agente genera `SESSION_N_NOTES.md`. Vos:

1. Validás según el "Cómo validar" del archivo.
2. Si OK → marcás el checkbox en `docs/ROADMAP.md` y arrancás la próxima.
3. Si NO OK → corregir antes de avanzar.

## 7. Si el contexto se pierde (chat nuevo)

Pegale al nuevo Claude Code:

```
Soy Fabio, dueño del proyecto Saldito.
Leé CLAUDE.md y el archivo más reciente en docs/sessions/.
Decime en qué sesión estoy y qué debería hacer ahora.
```

Eso recupera todo el contexto.

## 8. Variables de entorno

Archivo `.env.local` (nunca commit-ear):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENAI_API_KEY=
```

## 9. Comandos útiles

```bash
pnpm dev                                                          # dev local
pnpm supabase gen types typescript --linked > supabase/types.ts   # tipos después de migrations
pnpm supabase db push                                             # aplicar migrations
pnpm tsx scripts/import-from-sheet.ts                             # importar CSV (Sesión 1)
pnpm lint && pnpm typecheck                                       # antes de cada commit
```

## 10. Convenciones

- TypeScript estricto, sin `any`.
- Server Components default, `'use client'` solo cuando sea necesario.
- Server Actions para mutaciones (no API routes salvo webhooks externos).
- Naming: archivos `kebab-case`, componentes `PascalCase`, funciones `camelCase`.
- Idioma UI: 100% español argentino. Comentarios en español. Commits en inglés (feat/fix/chore/docs).
- Branches: `feat/*`, `fix/*`, `chore/*`.

## 11. Documentación interna

Todo el detalle vive en estos archivos:

- `docs/ROADMAP.md` — fases y sesiones. **Leer al inicio de cada sesión.**
- `docs/SCHEMA.md` — esquema completo de DB.
- `docs/PROMPT.md` — prompt clasificador con few-shot.
- `docs/N8N.md` — workflows del bot.
- `docs/UX.md` — microcopy, tono, accesibilidad.
- `docs/BRANDING.md` — paleta, tipografías, dirección visual.
- `docs/SAAS.md` — qué se necesita para fase 5.
- `docs/sessions/SESSION_N_NOTES.md` — generado al cierre de cada sesión.
- `context/` — input del proyecto viejo. Read-only.

---

> **Si sos Claude Code o Codex y estás leyendo esto al arrancar:**
> 1. Confirmá que leíste este archivo y `docs/ROADMAP.md`.
> 2. Decime qué sesión vamos a hacer.
> 3. Si voy a empezar una sesión, mostrá el plan ANTES de tocar nada.
> 4. Esperá mi OK antes de ejecutar.
