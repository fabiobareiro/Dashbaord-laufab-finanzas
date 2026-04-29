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

**Sesión 1 — Cierre auditoría e implementación importador**

- **Lib XLSX**: ExcelJS (MIT, npm directo). SheetJS descartado por estar stale en npm.
- **Lib fechas**: date-fns. Multi-formato configurable.
- **Parser de monto**: implementación propia multi-locale (`AR | US | auto`). Maneja "$ 34.842,00", "1,500.00", "1500", negativos por "-" o "(...)", símbolos. Sin dep extra.
- **Parser de fecha**: default `auto` con fallbacks ISO, dd/MM/yyyy HH:mm:ss, dd/MM/yyyy, MM/dd/yyyy, yyyy-MM-dd. Soporta serial Excel.
- **ColumnMapping extendido** con (todas opcionales salvo `source`): `source`, `typeMap?`, `dateFormat?`, `amountLocale?`, `defaultCurrency?`. `typeMap` resuelve valores crudos ("Egreso"→"egreso") al enum del schema.
- **NormalizedTransaction.type ahora nullable**. El parser no siempre sabe el tipo (extracto bancario solo trae signo). Classifier confirma con `type_confirmed`.
- **external_id final**: SHA-256 truncado a 16 hex de `${date}|${amount}|${concepto}|${rowIndex}`, formato `${source}_${hash16}`. Reemplaza fórmula vieja de SCHEMA.md. En Fase 13 se usa ID propio del origen si existe.
- **Adapter interface formal: NO se crea ahora (YAGNI)**. Funciones públicas son la API. Se extrae cuando aparezcan 2+ adapters.
- **tsconfig.json include**: `["scripts/**/*.ts", "lib/**/*.ts"]`.
- **Split parser/classifier (clave)**: parser es 100% código determinístico, classifier es el único con LLM. Una sola implementación de classifier la reusan bot Telegram, quick-add web e import. La IA va donde hay ambigüedad semántica, no donde hay estructura tabular.
- **n8n NO entra en Sesión 1**. Import histórico es script local one-shot. n8n entra en Sesión 2 reusando `lib/import/classify.ts`.
- **Herramientas**: Claude Code default Sesión 1. Codex cuando convenga laburo agéntico/libre.
- **Pendientes Fase 13** (detalle completo en ROADMAP.md): hardening (streaming, límites, sandbox, sanitización CSV injection, job tracking, retry), adaptadores nuevos (bancos AR, apps personales, WhatsApp export, PDFs Vision), UI `/importar` con autodetección y drag-drop. NO se implementa en MVP. Registrado para que próxima sesión lo retome sin sorpresas.

**Sincronización Supabase prod ↔ repo (decisión arquitectural)**
Supabase prod no está conectado a Claude Code ni a Codex. Las migrations y el seed se aplican manualmente desde el SQL Editor del navegador en Supabase. Esto significa:

El estado real de la DB en prod puede divergir del repo si se aplican fixes solo en el archivo SQL pero no se ejecutan en Supabase.
Cualquier cambio a supabase/migrations/*.sql o supabase/seed.sql que modifique datos vivos requiere ejecución manual en Supabase Studio.
Para datos puntuales (ej. corregir un registro de ai_config), se documenta el SQL de fix en este CONTEXT y se aplica vía SQL Editor.
Verificación post-fix: query directa desde Studio para confirmar que el cambio impactó.
En Fase 3+ (cuando exista app Next.js), evaluar mover a Supabase CLI con migrations versionadas y comando deploy. Por ahora flujo manual.

**Fix pendiente de aplicar manual en Supabase prod (decisión chat 5):**
El registro activo de ai_config con key='classifier_prompt' tiene 2 placeholders mal escritos: {{categorias_json}} (debe ser {{categories_json}}) y falta el bloque PROFILES DEL HOUSEHOLD: {{profiles_json}}. El archivo seed.sql se corrige en este chunk; queda pendiente aplicar el UPDATE manual en Supabase antes del import real (chunk 6/7 de Sesión 1).

---

## 6. Estado actual

**Sesión 1 — En curso. Cierre chat 5.**

Hecho ✅ (commits en rama dev, no pusheados aún a main):

- `aa0af3b` docs: cierre auditoría sesión 1 + decisiones de implementación importador
- `192e2da` feat(import): parser de spreadsheet (CSV + XLSX) con multi-locale y external_id determinístico
- `0edab92` docs(roadmap): UX flow del import en Fase 13 (staging editable + validación previa)
- `d8e3e42` feat(import): classifier vía OpenRouter Haiku 4.5 + alineación al schema real

Detalle de lo construido en chat 5:

**lib/import/spreadsheet/** (parser, 100% código determinístico):
- `parsers/amount.ts`: multi-locale (`AR | US | auto`). Maneja "$ 34.842,00", "1,500.00", "1500", negativos por "-" o "(...)". `Math.abs()` en return porque schema exige `amount > 0`; el signo informa al typeMap, no al monto.
- `parsers/date.ts`: ISO + 4 fallbacks (`dd/MM/yyyy HH:mm:ss`, `dd/MM/yyyy`, `MM/dd/yyyy`, `yyyy-MM-dd`) + serial Excel.
- `external-id.ts`: SHA-256 truncado a 16 hex de `${date}|${amount}|${concepto}|${rowIndex}`, formato `${source}_${hash16}`.
- `spreadsheet-adapter.ts`: detecta CSV vs XLSX por extensión. Tolera filas inválidas (skip + console.warn, no aborta). `readMappedValue` con fallback trim para headers sucios tipo `"Medio "` con espacio.

**lib/import/classify.ts** (LLM puro, único punto con IA):
- `classify(tx, ctx): ClassificationResult`. Función pura, no toca DB.
- Retry con backoff 1s/2s/4s en 429/5xx/timeout/network. JSON inválido = error duro, no se reintenta.
- AbortController de 30s.
- `replaceAll` para placeholders (importante: aparecen más de una vez en el prompt).
- Validación estricta del shape del payload del LLM con error específico por campo.
- `RetryableRequestError` como clase propia para distinguir errores reintenables.
- Si el LLM devuelve `category_slug` no encontrado en `ctx.categories`: `category_id=null`, `needs_review=true`, anota razón en `ai_reasoning`.
- Stats globales (`classifyStats` + `resetClassifyStats`): `totalCalls`, `totalTokens`, `totalCostUsd`. El caller (run-import) loguea total al final.

**lib/import/types.ts** (interfaces públicas del módulo):
- `ColumnMapping` extendido con `source`, `typeMap?`, `dateFormat?`, `amountLocale?`, `defaultCurrency?`.
- `NormalizedTransaction.type` ahora `TransactionType | null`.
- Nuevas: `CategoryRef`, `ProfileRef`, `ClassifyContext`.

**Otros**:
- `package.json`: deps nuevas `exceljs`, `date-fns`. Mantiene csv-parse, supabase-js, dotenv, tsx, typescript.
- `tsconfig.json`: include extendido a `["scripts/**/*.ts", "lib/**/*.ts"]`.
- `.gitignore`: agregada línea `.claude/settings.local.json`.
- `supabase/seed.sql`: placeholders del prompt corregidos (`{{categories_json}}`, agregado bloque `PROFILES DEL HOUSEHOLD: {{profiles_json}}`).
- ROADMAP.md Fase 13 reescrita: hardening + adaptadores nuevos + UX flow del import (staging editable con validación previa).
- ARCHITECTURE.md actualizado: split parser/classifier formalizado como decisión arquitectural.

**Anomalías resueltas durante el chat**:
- Apareció un `CLAUDE.md` en raíz con contenido de Meta Ads / IngeniaSync (no de Saldito). Movido a `C:\Users\fbare\Desktop\CLAUDE-meta-ads-RECUPERADO.md` para no perderlo. Saldito no necesita CLAUDE.md (las reglas para CLI viven en AGENTS.md).
- Dos placeholders mal escritos en seed.sql (`{{categorias_json}}` con tilde) que rompían el classifier silenciosamente. Corregidos en archivo. Pendiente aplicar el UPDATE manual en Supabase prod (ver bloque "Fix pendiente" más abajo).

**Pendiente Sesión 1 (próximo chat copiloto, chunks 3-7)**:

A) Decisión bloqueante antes de empezar chunk 3 — **mapping persona → profile_id**:
   El parser lee `tx.person` del Sheet (valores "Laura"/"Fabio" en LAUFAB). El schema exige `transactions.profile_id NOT NULL`. classify es puro y no resuelve este mapping. La decisión la difiere chat 5 al copiloto siguiente porque requiere razonar el contrato del orquestador.
   Opciones planteadas en chat 5 (no decidir solo, preguntar a Fabio):
   - a) Match exacto contra `profiles.display_name`. Si no matchea: error log, fila no se inserta.
   - b) Match con fallback a profile default (owner del household).
   - c) Match case-insensitive + trim. Si no matchea: error log, fila no se inserta.
   Voto del copiloto chat 5: opción (c). Decide Fabio en chat 6.

B) Implementar `lib/import/run-import.ts` (orquestador):
   - Recibe lista de `NormalizedTransaction[]`, `ClassifyContext` y cliente Supabase.
   - Por cada tx: `classify(tx, ctx)` → resolver `profile_id` (según decisión A) → upsert idempotente a `transactions` con `ON CONFLICT (external_id) DO NOTHING` o `DO UPDATE`. Decidir cuál es el comportamiento (probablemente DO NOTHING para no pisar correcciones manuales del usuario).
   - Errores en classify (después de 3 retries): insertar fila con `category_id=null`, `needs_review=true`, `ai_reasoning="API error: <msg>"`. Nunca abortar el import.
   - Logueo: progreso cada 25 filas, total final con costo de OpenRouter.
   - Soporta `--dry-run`: corre todo en memoria, no toca Supabase, imprime preview de qué se insertaría.

C) Implementar `scripts/import-from-sheet.ts` (wrapper con preset LAUFAB):
   - Lee `.env` (Supabase URL, SERVICE_ROLE key, OpenRouter key).
   - Lee de Supabase: prompt activo de `ai_config`, `categories` del household (con todos los campos de `CategoryRef`), `profiles` del household.
   - Construye `ColumnMapping` específico para el CSV de LAUFAB:
     - `source: "sheet"`
     - Columnas: `date="ID-TIME"`, `amount="Importe"`, `type="Tipo"`, `person="Persona"`, `category="Categoría"`, `subcategory="Subcat"`, `concept="Concepto"`, `payment_method="Medio "` (con espacio literal final), `notes="Notas"`.
     - `typeMap: { "Ingreso": "ingreso", "Egreso": "egreso", "Ahorro": "ahorro", "Transferencia": "transferencia" }` (verificar valores reales del CSV antes).
     - `dateFormat: "dd/MM/yyyy HH:mm:ss"`.
     - `amountLocale: "AR"`.
     - `defaultCurrency: "ARS"`.
   - Llama a `parseSpreadsheet` → `runImport`.
   - Soporta flag `--dry-run`.

D) Crear `.env` local (NO commitear, ya está en .gitignore via `.env*.local` y `.env`):
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...` (no la anon, hace falta service role para bypass de RLS en import)
   - `OPENROUTER_API_KEY=...`

E) **Aplicar manualmente en Supabase Studio** el SQL de fix del prompt (ver bloque "Fix pendiente" en sección 5). Sin esto, classify recibe el prompt roto y va a clasificar mal.

F) Correr dry-run: `npm run import -- --dry-run`. Validar que el preview tiene sentido (montos correctos, fechas ISO, categorías sugeridas razonables).

G) Correr import real: `npm run import`. Verificar en Supabase Studio:
   - `select count(*) from transactions where source='sheet';` debe dar ~345.
   - `select count(*) from transactions where source='sheet' and needs_review=true;` ver cuántas quedan para revisar.
   - `select category_id, count(*) from transactions where source='sheet' group by category_id order by count desc limit 10;` ver distribución.

H) Generar tipos TS de Supabase con `supabase gen types typescript`. Esto requiere Supabase CLI; si no está instalado, dejarlo registrado en pendientes Sesión 3.

I) Commit final de cierre Sesión 1. Mensaje sugerido: `feat(import): orquestador + script LAUFAB + import histórico aplicado`.

J) Merge `dev` → `main`, push.

K) Actualizar CONTEXT.md sección 6 con Sesión 1 completa y armar handoff a Sesión 2 (n8n adaptado).

**Pendiente Sesión 2** (próximo chat después de cerrar Sesión 1):
Adaptar bot Telegram en n8n para escribir a Supabase reusando `lib/import/classify.ts`. Importante: el bot recibe **lenguaje natural** (texto crudo del usuario), no estructura tabular. La adaptación: en n8n, antes de llamar a classify, armar un `NormalizedTransaction` con `source: "telegram"`, `amount=null`, `type=null`, `concept=mensaje crudo`, `category=null`, `person=lookup por telegram_username`. Classify resuelve todo lo demás. Ese es el diseño plug-in del módulo.

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

> Última actualización: cierre chat 5. Parser + classifier implementados y commiteados (4 commits en dev sin push aún). Próximo chat: chunks 3-7 de Sesión 1 (run-import, script LAUFAB, .env, dry-run, import real, tipos TS, merge a main).
