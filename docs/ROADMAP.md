# Roadmap de Saldito

## Filosofía

MVP usable en 24h. Cada fase agrega valor real. La arquitectura del día 1 es la del día 1000 (multi-tenant, soft-delete, audit, prompt versionado).

---

## Fase 0 — Setup (1h)

**Objetivo**: Claude Code y Codex tienen contexto completo y herramientas cargadas.

**Entregables**:
- Estructura `docs/` + `.claude/` lista.
- Skills en `.claude/skills/`: `frontend-design`, `systematic-debugging`, `test-driven-development`.
- Subagents en `.claude/agents/`: `db-schema-expert`, `ui-designer`, `n8n-workflow-builder`, `prompt-engineer`.
- Slash commands `/session-start`, `/session-end`, `/check-context`.
- HTML viejo movido a `legacy/`.
- `context/` con `data.csv`, `old-html/`, `old-n8n/` cargados.
- `.gitignore` correcto.

**Cómo arrancar**: `docs/sessions/SESSION_0.md`.

---

## Fase 1 — Base de datos y datos migrados (2h)

**Objetivo**: Supabase nuevo con schema completo + datos del Sheet importados.

**Entregables**:
- Proyecto Supabase nuevo (no el del MCP).
- Migrations aplicadas: schema, RLS, Realtime, triggers.
- Seed: 1 household, 2 profiles (Fabio, Laura), categorías default, prompt v1.
- Script `scripts/import-from-sheet.ts` corrido: datos migrados, drift normalizado.
- Tipos TypeScript generados.

**Verificación**: en Supabase Studio, tabla `transactions` con N filas, `categories` sin "Cariceria"/"Comida"/"Super-Almacen" duplicadas.

**Cómo arrancar**: `docs/sessions/SESSION_1.md`.

---

## Fase 2 — n8n adaptado (1.5h)

**Objetivo**: bot Telegram clasifica con IA mejorada y registra en Supabase.

**Entregables**:
- Workflow nuevo (no romper el viejo).
- Lookup dinámico de profile, categorías, memoria, prompt activo.
- LLM con prompt versionado (no hardcodeado).
- Insert en `transactions` con `external_id` (idempotente).
- Insert en `agent_memory` (mensaje user + respuesta).
- Reply Telegram con confirmación.

**Verificación**: 5 mensajes desde el celular aparecen en Supabase con `ai_confidence` y categoría correcta.

**Cómo arrancar**: `docs/sessions/SESSION_2.md`.

---

## Fase 3 — Bootstrap Next.js + auth (2.5h)

**Objetivo**: app deployada en Vercel con login.

**Entregables**:
- Next.js 16 + App Router clonado del starter `KolbySisk/next-supabase-stripe-starter`.
- Branding aplicado (paleta, fuentes Syne+Inter, logo).
- Topbar horizontal con nav: Resumen / Movimientos / Categorías / Metas / Tú.
- Auth Supabase magic-link.
- Theme provider light/dark.
- Deploy automático a Vercel desde push.

**Verificación**: abrir URL Vercel, login con email, magic link, entrar al dashboard vacío.

**Cómo arrancar**: `docs/sessions/SESSION_3.md`.

---

## Fase 4 — Dashboard real con Realtime (3h)

**Objetivo**: página principal viva con datos del household.

**Entregables**:
- Saludo personalizado.
- Quick-add input: texto natural → Server Action → Claude → preview → confirmar.
- 4 KPIs animados (Ingresos, Egresos, Balance, Tasa de ahorro).
- Tabs Todos / Fabio / Laura.
- Period selector (Hoy/Semana/Mes/Año).
- Chart evolución (Tremor).
- Top 5 categorías.
- Últimas 7-10 transacciones.
- Sección metas.
- Realtime: nueva transacción aparece sin recargar.

**Verificación**: dashboard abierto, mensaje al bot, transacción aparece con animación.

**Cómo arrancar**: `docs/sessions/SESSION_4.md`.

---

## Fase 5 — Página `/movimientos` (3h)

**Objetivo**: reemplazo total del Google Sheet.

**Entregables**:
- TanStack Table virtualizada (>1000 filas sin lag).
- Edición inline (doble click → enter).
- Filtros pills: persona, tipo, categoría, fecha, monto, búsqueda.
- URL params reflejan filtros.
- Selección múltiple → batch edit/delete.
- Soft delete con undo (toast 10s).
- Badge `needs_review`, filtro "solo pendientes".
- Export CSV.

**Verificación**: editar 5 filas, borrar 2 con undo, recategorizar 10 en batch, exportar.

**Cómo arrancar**: `docs/sessions/SESSION_5.md`.

---

## Fase 6 — Categorías + Metas + Editor de Prompt (3h)

**Objetivo**: cerrar el loop, todo gestionable desde la app.

**Entregables**:
- `/categorias`: tree view, crear/editar/archivar/mergear, badge `pending_review`.
- `/metas`: cards con progreso, simulador, link a transactions.
- `/admin/prompt`: editor con versiones, rollback, test, cola de revisión, recategorización masiva.
- Cmd+K palette.
- PWA setup (manifest, service worker).
- README final.

**Verificación**: crear meta, modificar prompt, agregar categoría, instalar PWA en celular.

**Cómo arrancar**: `docs/sessions/SESSION_6.md`.

---

## Hito: MVP comercializable

A partir de acá ya podés invitar beta testers. Las siguientes fases son agregar valor diferencial.

---

## Fase 7 — Asistente IA conversacional (semana 2)

- `/asistente`: chat estilo ChatGPT contra la DB.
- Vercel AI SDK + Claude Sonnet con tools.
- Tools: `get_balance`, `list_transactions`, `categorize`, `create_goal`, `compare_periods`, `find_savings`.
- "¿Cuánto gasté en super en marzo?" → respuesta con datos reales.

## Fase 8 — Recibos por foto (semana 2-3)

- Telegram captura `photo`.
- n8n manda imagen a Claude Vision API.
- Claude extrae: comerciante, fecha, items, total, IVA, medio de pago.
- Mismo pipeline de clasificación.
- Caso: foto del ticket del super → registrado.

## Fase 9 — Multi-currency real (semana 3)

- `accounts` con `currency` real (ARS/USD/cripto).
- Cotización del día desde dolarapi.com (oficial, blue, MEP, CCL).
- Toggle "Ver todo en X".
- Histórico de cotizaciones para reportes pasados consistentes.

## Fase 10 — Onboarding + Stripe (semana 4)

- Signup público.
- Crear household al registrarse.
- Invitar miembros con link mágico (`role: owner | member | viewer`).
- Plan free (1 household, 2 miembros, 200 tx/mes).
- Plan pro con Stripe (households ilimitados, recibos por foto, IA chat).
- Página pricing.
- Webhook Stripe sincroniza subscripción.

## Fase 11 — Negocio vs personal a fondo (semana 4-5)

- Reportes separados: P&L del negocio, presupuesto personal.
- Vista monotributo: facturado vs categoría AFIP.
- Alertas: "Estás por superar la categoría B del monotributo".
- Export para contador.

## Fase 12 — Reportes y exportación (semana 5)

- PDF mensual: KPIs, charts, top categorías, comparativo.
- PDF anual.
- Export Excel con tabla dinámica pre-armada.
- Email automático fin de mes.

## Fase 13 — Importadores (semana 6)

- Subir extracto bancario PDF → Claude Vision parsea → importa.
- Subir CSV de Mercado Pago.
- Subir resumen de tarjeta de crédito.
- Mapping inteligente con preview.

## Fase 14 — Mobile native opcional (mes 2-3)

- Si la PWA no alcanza: Expo + React Native compartiendo lib/hooks.
- Native push (alertas presupuesto).
- Native receipt camera con cropper.

---

## Métricas de éxito

| Hito | Cuándo |
|---|---|
| Saldito reemplaza al Sheet en uso diario | Fin Fase 6 |
| 5 usuarios beta no-Fabio/Laura | Fin Fase 10 |
| Primer pago Stripe | 1 mes después Fase 10 |
| 50 usuarios pagos | Mes 6 |

---

## NO vamos a:

- ❌ Migrar a Maybe / Sure / Firefly. Stack distinto.
- ❌ Plaid / Belvo. No aplica en Argentina.
- ❌ Mover bot fuera de n8n.
- ❌ Mobile native antes de PWA.
- ❌ Sidebar admin.
- ❌ Reescribir en Rails / PHP / Python.
