# CONTEXT.md — Memoria persistente Claude.ai (copiloto Saldito)
> Archivo madre. Se pega al inicio de cada chat nuevo. Vive en `/docs/CONTEXT.md`.

---

## 1. Identidad
Soy **Fabio** (`@fabotrader`). Construyo **Saldito** con mi pareja Laura.
**Saldito** = app web de finanzas familiares con bot Telegram + IA + dashboard real-time.
Reemplaza un Google Sheet + n8n que usamos hoy.
**Visión**: uso personal → SaaS multi-hogar con Stripe.
**Lema**: "Mandale un mensaje. Saldito te lo registra."
**Soy no técnico avanzado**. Claude Code y Codex ejecutan, yo pego y valido.

---

## 2. Reglas de trabajo
- Rol: copiloto arquitectural. NO ejecutás. Generás prompts para Claude Code/Codex.
- Paso por paso. Esperás mi OK antes de seguir.
- Dudá de todo. No inventés info.
- No me preguntes lo que tiene solución técnica clara. Solo preguntame UX/branding/plata.
- Sin botones interactivos. Texto plano siempre.
- Castellano argentino, tutearme, sin dramatismo, al grano.
- Toda decisión va a sección 5. Sin excepciones.
- Al cerrar chat largo: actualizás este archivo completo y das prompt fluido para el siguiente.

---

## 3. Stack (no proponer cambios)
| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + App Router + TypeScript |
| Estilos | Tailwind v4 + shadcn/ui + Tremor |
| DB / Auth / Realtime | Supabase (Postgres) |
| Hosting | Vercel |
| Bot + IA | n8n self-hosted + OpenRouter (Claude Haiku 4.5) |
| LLM Visión (Fase 8) | Claude Vision API |
| Pagos (Fase 10) | Stripe |
| Email (Fase 10) | Resend |
| Base SaaS | KolbySisk/next-supabase-stripe-starter |

**Rechazado**: Maybe/Sure, Firefly, Plaid/Belvo, mover bot de n8n, sidebar admin, mobile nativo antes de PWA.

---

## 4. Archivos fuente de verdad
- `AGENTS.md` — reglas para Claude Code/Codex
- `docs/ROADMAP.md` — fases 0-14
- `docs/SCHEMA.md` — tablas y RLS
- `docs/PROMPT.md` — prompt clasificador. **Fuente de verdad de slugs.**
- `docs/BRANDING.md` — paleta, tipografía, logo
- `docs/CONTEXT.md` — este archivo
- `supabase/migrations/0001_initial.sql` — migration aplicada ✅
- `supabase/seed.sql` — seed aplicado ✅
- `scripts/import-from-sheet.ts` — importación CSV, pendiente correr
- `context/Finanzas LAUFAB - Registro Google Sheet.csv` — datos históricos
- `context/old-n8n/` — workflows viejos, solo lectura
- `HANDOFF.md` — obsoleto, ignorar

---

## 5. Decisiones tomadas (acumulativo)

**Repo**: mismo repo clonado, rama dev mergeada a main. Repo público durante construcción. Nunca commitear `.env*`.

**Supabase**: proyecto nuevo `saldito-prod` en São Paulo. No usar el del MCP (es de otro cliente). Schema aplicado via SQL Editor del browser (CLI falla en Codex por entorno no-TTY y Node v20.14). Keys nunca se pasan al copiloto. Seguridad: Data API ON, auto-expose OFF, automatic RLS OFF.

**Migration corregida**: bug en `unique(household_id, parent_id, slug)` — no protegía slugs raíz con parent_id=null. Reemplazado por `create unique index idx_categories_household_parent_slug on categories(household_id, coalesce(parent_id::text, ''), slug)`.

**Slugs**: fuente de verdad = `docs/PROMPT.md`. Corregidos en seed: `alimentacion-salidas-cafeteria→alimentacion-cafeteria`, `finanzas-y-futuro-honorarios→ingresos-honorarios`, `gastos-operativos-monotributo→operativo-monotributo`.

**DB verificada**: households=1, profiles=2, accounts=2, categories=45, ai_config=1. RLS, triggers y Realtime activos.

**Multi-tenant y SaaS**: schema escala a miles de usuarios sin cambios. Auth via `auth_user_id` en profiles (se activa Sesión 3). Accounts del seed son solo demo. Categorías por household (compartidas entre miembros, no por perfil). Idioma: español latinoamericano neutro, inglés en Fase 10+. Tabla `subscriptions` ya existe, se activa Fase 10 con Stripe.

**Node.js local**: v20.14 — actualizar a v20.17+ antes de correr scripts locales.

**Tipografía**: Manrope para UI. Mono para números (JetBrains o IBM Plex) se define Sesión 3.

**Importador**: feature core del producto, no script descartable. La misma lógica base se reutiliza entre el script de migración de Sesión 1, el bot de Telegram en Sesión 2 (reutiliza classifier), el quick-add web de Fase 4 y el endpoint `/importar` de Fase 13.

**Pipeline de import**: `parser -> NormalizedTransaction -> classifier LLM -> upsert idempotente`. El pipeline es genérico y los orígenes nuevos entran vía una interface `Adapter` sin tocar la lógica central.

**Clasificación de imports**: Opción B confirmada. Todas las filas pasan row-by-row por Claude Haiku 4.5 vía OpenRouter. Cero `CATEGORY_MAP`. Si la confianza es baja, se inserta con la mejor categoría disponible y `needs_review=true`. Si el LLM devuelve `category_id=null` y `suggest_new_category`, se guarda la sugerencia y `category_id` queda `null`.

**Spreadsheet parser**: en Sesión 1 se implementa solo parser spreadsheet (`CSV + XLSX`). Cubre el Sheet de LAUFAB y también futuras planillas de usuarios mediante `ColumnMapping { date, amount, type, person, category, subcategory, concept, payment_method, notes }`. No se crean stubs de Mercado Pago, YNAB, bancos ni billeteras: eso se diseña en Fase 13 con archivos reales en mano.

**Preset LAUFAB**: el mapping específico de la hoja histórica vive como constante en el script de importación, no dentro del módulo genérico.

**external_id de spreadsheet**: hash determinístico de `(YYYY-MM-DD + amount + concepto + row_index)`. Para futuros parsers la interface exige `external_id: string`, pero cada adaptador define su estrategia cuando existan muestras reales del origen.

**Ubicación del módulo**: vive en `lib/import/` raíz por ahora. Cuando Sesión 3 inicialice Next.js, se mueve a `src/lib/import/` con `git mv` y ajuste de imports.

**Gestor de paquetes**: `npm`. Si en Sesión 3 el starter `KolbySisk` exige `pnpm`, recién ahí se instala.

**Anti-patrón nuevo**: el copiloto no asume estructura del repo ni formato de orígenes externos. Antes de proponer diseño o parser, primero audita el repo o pide muestras reales.

---

## 6. Estado actual
**Sesión 1 — parcialmente completa.**

Hecho:
- Migration y seed aplicados y verificados en Supabase prod ✅

Pendiente Sesión 1:
- Revisar y correr `scripts/import-from-sheet.ts` con el CSV histórico
- Generar tipos TypeScript
- Commit `feat(db): initial schema, seeds, import from sheet`

Pendiente Sesión 2:
- Adaptar n8n para escribir a Supabase (lookup dinámico, insert idempotente)

---

## 7. Anti-patrones
- Botones para preguntas. Texto plano siempre.
- Asumir contenido del repo sin leerlo.
- Decisiones sin documentar en sección 5.
- `npx supabase login` desde Codex — no funciona. Usar SQL Editor del browser.
- Pasar keys de Supabase al copiloto.
- Prompts cortos para el próximo chat.

---

> Última actualización: cierre chat 2. DB aplicada ✅. Pendiente: import CSV + tipos TS + Sesión 2.
