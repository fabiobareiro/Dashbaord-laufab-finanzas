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

## 2. Reglas de trabajo (CRÍTICAS — respetar siempre)

- Rol: copiloto arquitectural. NO ejecutás. Generás prompts para Claude Code/Codex.
- **Paso por paso. Esperás mi OK antes de seguir. Sin excepciones.**
- **Respuestas cortas. Sin listas largas. Sin dramatismo. Al grano.**
- **Un prompt = una unidad de trabajo. Nunca prompts monstruosos.**
- Dudá de todo. **No inventés información. No inventés slugs, categorías, ni campos.**
- Antes de proponer cualquier mapeo o estructura: investigá, leé el repo, pedí auditoría a Codex. No resolvás nada hasta haber investigado.
- No asumas estructura del repo. Verificá con Codex antes de proponer.
- No me preguntes lo que tiene solución técnica clara. Solo preguntame UX/branding/plata.
- Sin botones interactivos. Texto plano siempre.
- Castellano argentino, tutearme.
- **Toda decisión va a sección 5 ANTES de avanzar al siguiente paso. Sin excepciones, sin que te lo recuerde.**
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
| LLM Visión (Fase 8 / Fase 13) | Claude Vision API |
| Pagos (Fase 10) | Stripe |
| Email (Fase 10) | Resend |
| Base SaaS | KolbySisk/next-supabase-stripe-starter |
| Gestor de paquetes | npm (hasta Sesión 3) |

**Rechazado**: Maybe/Sure, Firefly, Plaid/Belvo, mover bot de n8n, sidebar admin, mobile nativo antes de PWA.

---

## 4. Archivos fuente de verdad
- `AGENTS.md` — reglas para Claude Code/Codex
- `docs/ROADMAP.md` — fases 0-14
- `docs/SCHEMA.md` — tablas y RLS
- `docs/PROMPT.md` — prompt clasificador. **Fuente de verdad de slugs.**
- `docs/BRANDING.md` — paleta, tipografía, logo
- `docs/CONTEXT.md` — este archivo
- `docs/ARCHITECTURE.md` — incluye sección "Módulo de import"
- `lib/import/` — pipeline de importación (módulo core)
- `lib/import/types.ts` — interfaces y tipos públicos del módulo
- `package.json` + `tsconfig.json` — setup Node/TypeScript en raíz
- `supabase/migrations/0001_initial.sql` — migration aplicada ✅
- `supabase/seed.sql` — seed aplicado ✅
- `scripts/import-from-sheet.ts` — wrapper del módulo + preset LAUFAB (a implementar)
- `context/Finanzas LAUFAB - Registro Google Sheet.csv` — datos históricos (345 filas)
- `context/old-n8n/` — workflows viejos, solo lectura

---

## 5. Decisiones tomadas (acumulativo)

**Repo**: mismo repo clonado, rama dev mergeada a main. Repo público durante construcción. Nunca commitear `.env*`.

**Flujo de ramas**: laburar siempre en `dev`. Mergear a `main` solo en cierres de sesión o features completos. Codex/Claude Code nunca commitea directo a `main` salvo que se le pida explícitamente.

**Supabase**: proyecto `saldito-prod` en São Paulo. Schema aplicado via SQL Editor del browser. Seguridad: Data API ON, auto-expose OFF, automatic RLS OFF.

**DB verificada en prod**: households=1, profiles=2, accounts=2, categories=45, ai_config=1, transactions=0. RLS, triggers y Realtime activos.

**Migration corregida**: bug en `unique(household_id, parent_id, slug)` — no protegía slugs raíz con parent_id=null. Reemplazado por índice con `coalesce(parent_id::text, '')`. Ya commiteado y pusheado.

**Slugs alineados a PROMPT.md**: `alimentacion-salidas-cafeteria→alimentacion-cafeteria`, `finanzas-y-futuro-honorarios→ingresos-honorarios`, `gastos-operativos-monotributo→operativo-monotributo`. Ya commiteado y pusheado.

**Multi-tenant y SaaS**: schema escala a miles de usuarios sin cambios. Auth via `auth_user_id` en profiles (se activa Sesión 3). Categorías por household (compartidas entre miembros). Idioma: español latinoamericano neutro. Tabla `subscriptions` ya existe, se activa Fase 10.

**Tracking histórico**: requerimiento confirmado. El usuario quiere consultar finanzas desde el inicio del sistema, años atrás. Soft delete siempre. `occurred_at` con timestamptz.

**Importador como feature core (no script descartable)**: cualquier usuario nuevo llega con su historia (Sheet, Excel, Notion, banco, app vieja). Sin tracking desde el día 1 no hay retención. **Migración sin fricción es retención** — mismo principio que aplicó Claude para que la gente migrara desde ChatGPT. El importador es el speech del producto, no un utilitario.

**Pipeline único de import**: `parser → NormalizedTransaction → classifier (LLM) → upsert idempotente`. Lo usa el script de migración (Sesión 1), bot n8n (Sesión 2 reutiliza classifier), quick-add web (Fase 4) y endpoint `/importar` (Fase 13).

**Clasificación — Opción B confirmada**: TODAS las filas pasan por LLM Haiku 4.5 vía OpenRouter. Cero CATEGORY_MAP arbitrario. Cero slugs hardcodeados. Costo estimado <USD 2 para el Sheet de Fabio (345 filas).

**Reglas de clasificación**:
- Row-por-row, una sola función `classify(tx)`. Sin batch.
- Baja confianza: insertar igual con la mejor categoría del LLM + `needs_review=true`.
- Si LLM devuelve `category_id=null` + `suggest_new_category`: guardar la sugerencia, `category_id` queda null. NO se crea categoría en caliente.

**Parser implementado en Sesión 1: `spreadsheet`** (CSV + XLSX). Recibe un `ColumnMapping` que dice qué columna del archivo es cada campo. Cubre Google Sheet, Excel y CSV con un solo archivo. Sirve para LAUFAB ahora y para cualquier usuario que llegue con su planilla en Fase 13.

**Preset LAUFAB**: vive en `scripts/import-from-sheet.ts`, NO en el módulo. El módulo es genérico.

**external_id de spreadsheet**: hash determinístico de `(YYYY-MM-DD + amount + concepto + row_index)`. El `row_index` garantiza que dos transacciones idénticas el mismo día no se pisen.

**Adaptadores futuros (Fase 13)**: bancos AR (Galicia, BBVA, Santander, Macro, Brubank, Mercado Pago, Naranja X, Ualá), exports (YNAB, Maybe, Firefly, Notion), PDFs vía Claude Vision. **NO se diseñan en abstracto**. Se diseñan cuando tengamos archivos reales en mano. Por eso en Sesión 1 NO se crean stubs.

**Ubicación del módulo**: `lib/import/` en raíz. En Sesión 3 se mueve a `src/lib/import/` cuando se inicialice Next.js (`git mv` + ajuste de imports).

**Setup Node/TS en raíz**: `package.json` + `tsconfig.json` creados. Deps: `@supabase/supabase-js`, `csv-parse`, `dotenv`, `tsx`, `typescript`, `@types/node`. Gestor: npm. Si Sesión 3 (KolbySisk) pide pnpm, se instala ahí.

**Diseño del módulo cerrado**: ver `lib/import/types.ts` y `docs/ARCHITECTURE.md` sección "Módulo de import". Interfaces: `Adapter`, `ColumnMapping`, `NormalizedTransaction`, `ClassificationResult`. Funciones públicas: `parseSpreadsheet`, `classify`, `runImport`. Tipos en español alineados al schema (`ingreso | egreso | ahorro | transferencia`). Currency `ARS | USD` con default ARS para spreadsheet.

**Node.js local**: v20.14 — actualizar a v20.17+ antes de Sesión 3.

**Tipografía**: Manrope para UI. Mono para números (JetBrains o IBM Plex) se define Sesión 3.

---

## 6. Estado actual

**Sesión 1 — Diseño cerrado, implementación pendiente.**

Hecho ✅:
- Migration y seed aplicados, verificados, commiteados, pusheados.
- Setup Node/TS en raíz commiteado y pusheado.
- Diseño del módulo `lib/import/` cerrado (interfaces, signatures, docs actualizados).
- Commit `feat(import): diseño del módulo lib/import + decisiones documentadas` pusheado.

Pendiente Sesión 1 (próximo chat):
- Implementar `lib/import/spreadsheet/spreadsheet-adapter.ts` (parser CSV + XLSX).
- Implementar `lib/import/classify.ts` (llamada a OpenRouter).
- Implementar `lib/import/run-import.ts` (orquestador con upsert idempotente).
- Implementar `scripts/import-from-sheet.ts` con preset LAUFAB.
- Crear `.env` local con credenciales (Supabase + OpenRouter).
- Correr dry-run del import del Sheet, validar.
- Correr import real del Sheet, verificar en Supabase.
- Generar tipos TypeScript de Supabase.
- Commit final de cierre Sesión 1.

Pendiente Sesión 2:
- Adaptar n8n para escribir a Supabase reutilizando `lib/import/classify.ts`.

---

## 7. Anti-patrones
- Respuestas largas con muchas listas. Texto plano, corto, al grano.
- Prompts monstruosos para Codex. Una unidad de trabajo por prompt.
- Inventar slugs, categorías, campos o estructuras de archivos sin verificar.
- Asumir contenido del repo o formato de orígenes externos sin auditar.
- Diseñar adaptadores de import sin tener archivos reales del origen.
- Decisiones sin documentar en sección 5 — esto se hace SIEMPRE, sin recordatorio.
- Crear stubs de adaptadores futuros "por las dudas". Solo lo que se implementa ahora.
- `npx supabase login` desde Codex — no funciona.
- Pasar keys de Supabase u OpenRouter al copiloto.

---

> Última actualización: cierre chat 4. Diseño módulo import cerrado. Próximo: implementación.
