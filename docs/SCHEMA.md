# SCHEMA — Saldito

## Filosofía

- **Multi-tenant día 1**: toda tabla con `household_id`. Cuando vendamos la app, no hay refactor.
- **Trazabilidad total**: cada transacción guarda de dónde vino, texto original, confianza del LLM, razonamiento, quién la creó/editó.
- **Idempotencia**: `external_id` único en transactions previene duplicados de webhooks.
- **Soft delete**: `deleted_at` permite undo.
- **RLS estricto**: función `current_household_id()` filtra todo automáticamente.

## Tablas principales

### `households`
Tenant principal. Un hogar = un household. Campos: `id`, `name`, `base_currency`, `plan` (free/premium/familia), `created_at`.

### `profiles`
Personas dentro de un household. Linkeado a `auth.users` cuando hace login (nullable porque el bot puede crear profiles sin auth). Campos clave: `household_id`, `auth_user_id`, `display_name`, `telegram_username` (UNIQUE), `email`, `role` (owner/member/viewer/super_admin).

### `accounts`
Cuentas: efectivo, banco, MP, USD, crypto, tarjeta. Saldo cacheado por trigger.

### `categories`
Jerárquicas (parent_id), con `slug` único por household. **Fuente de verdad para el LLM**. `pending_review=true` cuando las crea el LLM.

### `transactions`
Tabla central. Campos críticos para trazabilidad:
- `source` — telegram/web/import/api/recurring/ocr
- `raw_input` — mensaje original del usuario
- `ai_model`, `ai_confidence`, `ai_reasoning`, `needs_review`
- `external_id` UNIQUE — idempotencia
- `attachment_url` — foto factura en Storage (Fase 4)
- `created_by`, `updated_by`, `deleted_at` — auditoría

Índices: `(household_id, occurred_at DESC)`, `(household_id) WHERE needs_review=true`.

### `goals`, `goal_contributions`
Metas y aportes. `current_amount` recalculado por trigger.

### `recurring_transactions`
Gastos fijos. Si `auto_create=true`, el workflow mensual los inserta.

### `budgets`
Presupuesto por categoría/mes.

### `agent_memory`
Memoria conversacional del bot. Últimos 50 por profile.

### `ai_config`
Prompts versionados. `household_id` nullable (null = global). Único activo por (household_id, key).

### `audit_log`
Inmutable. Cambios con diff jsonb.

### `invitations`, `subscriptions` (Fase 5)
Para invitar miembros y pagos con Stripe. Ya creadas para evitar migration futura.

## RLS

Función helper `current_household_id()` lee `profiles` por `auth.uid()`. Política genérica:
```sql
create policy "household members access" on <tabla> for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());
```

## Realtime

Habilitar en: `transactions`, `goals`, `goal_contributions`, `accounts`, `categories`.

## Mapeo Sheet → Supabase

Categorías drifteadas → unificada (ver `scripts/import-from-sheet.ts`):

| Sheet | Slug |
|---|---|
| Super/Almacen, Comida | `alimentacion-supermercado` |
| Cariceria, Carniceria | `alimentacion-carniceria` |
| Combustible | `transporte-combustible` |
| Servicios IA, Suscripciones Digitales | `gastos-operativos-suscripciones-digitales` |
| Anuncios, Marketing | `gastos-operativos-anuncios` |
| Monotributo | `gastos-operativos-monotributo` |
| Alquiler | `vivienda-alquiler` |
| Honorarios | `finanzas-y-futuro-honorarios` |

Detección de duplicados: `external_id = sheet_{date}_{amount}_{profileId}`.

## Aplicar

`supabase/migrations/0001_initial.sql` y `supabase/seed.sql` están listos.

```bash
pnpm supabase db push
psql $DATABASE_URL -f supabase/seed.sql
```
