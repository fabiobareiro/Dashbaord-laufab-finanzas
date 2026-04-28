# Arquitectura de Saldito

> El **schema completo** de la base de datos está en `docs/SCHEMA.md` (más detallado).
> Este archivo cubre stack, decisiones, flujos y estructura del frontend.

## Stack

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | Next.js 16 + App Router + TypeScript | Estándar moderno, RSC, server actions |
| Estilos | Tailwind v4 + shadcn/ui + Tremor | Sin lock-in, charts financieros |
| DB / Auth / Realtime / Storage | Supabase (Postgres) | Una sola cosa para todo |
| Hosting | Vercel | Deploy automático |
| Bot Telegram + IA | n8n self-hosted | Ya existe, escalable |
| LLM clasificador | OpenRouter (default Claude Haiku 4.5) | Modelo intercambiable |
| LLM Visión (Fase 8) | Claude Vision API | Mejor accuracy en facturas |
| Pagos (Fase 10) | Stripe | LATAM via cuenta US |
| Base SaaS | `KolbySisk/next-supabase-stripe-starter` | Ahorra ~10h boilerplate |
| Email | Resend | Sencillo, React Email |

## Por qué no otras opciones

- **Maybe / Sure**: Ruby on Rails. Stack incompatible.
- **Firefly III**: PHP. Filosofía contable estricta, mata UX.
- **Actual Budget**: local-first, no encaja con bot compartido.
- **Plaid / Belvo**: APIs bancarias. En Argentina no funciona o cuesta caro.
- **Edge Functions Supabase para el bot**: requiere reescribir n8n. n8n se queda.

## Schema

Ver `docs/SCHEMA.md` para el SQL completo, RLS policies, triggers e índices.

Resumen de tablas:
- `households` — hogar/cuenta multi-tenant
- `profiles` — usuarios del hogar (Fabio, Laura, …)
- `accounts` — cuentas bancarias / efectivo / wallets
- `categories` — jerárquicas con slug, soft archive
- `transactions` — núcleo, soft delete, audit, idempotencia, IA fields
- `goals` + `goal_contributions` — metas de ahorro
- `recurring_transactions` — gastos/ingresos recurrentes
- `budgets` — presupuestos por categoría/mes
- `agent_memory` — memoria conversacional del bot
- `ai_config` — prompts versionados editables
- `audit_log` — historial de cambios
- `household_invites` — invitaciones (Fase 10)

## Flujos principales

### Usuario manda mensaje a Telegram

```
Telegram → n8n webhook
  → Lookup profile (telegram_username)
  → Lookup categorías activas del household
  → Lookup últimos 5 mensajes de agent_memory
  → Lookup prompt activo de ai_config
  → Inyectar todo al LLM (OpenRouter)
  → Parsear JSON
  → Si suggest_new_category: crear con pending_review=true
  → Insert en transactions con external_id (idempotencia)
  → Insert en agent_memory
  → Reply Telegram con confirmación + link
  → Realtime dispara update en frontend automáticamente
```

### Usuario edita en el dashboard

```
Click en celda → editable
  → Server Action de Next.js
  → Validación con Zod
  → Update en transactions
  → Trigger inserta diff en audit_log
  → Realtime emite UPDATE
  → Otros clientes ven el cambio
```

### Usuario sube foto de recibo (Fase 8)

```
Telegram (foto) → n8n webhook
  → Descargar imagen
  → Subir a Supabase Storage (attachment_url)
  → Llamar a Claude Vision API
  → Claude devuelve JSON: { vendor, date, items, total, tax, payment_method }
  → Mismo pipeline de clasificación contra categorías
  → Insert en transactions con source='photo'
```

## Estructura de archivos del frontend

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (app)/
│   │   ├── layout.tsx           ← topbar + theme + auth
│   │   ├── page.tsx             ← dashboard
│   │   ├── movimientos/
│   │   ├── categorias/
│   │   ├── metas/
│   │   ├── reportes/
│   │   ├── tu/                  ← perfil + miembros + plan
│   │   ├── admin/prompt/
│   │   └── asistente/           ← Fase 7
│   └── api/
│       ├── classify/
│       └── webhooks/{stripe,telegram}/
├── components/
│   ├── ui/                      ← shadcn primitives
│   ├── charts/                  ← Tremor wrappers
│   ├── kpi/, transactions/, categories/, goals/
│   └── layout/{topbar,theme-toggle,command-palette}.tsx
├── lib/
│   ├── supabase/{server,browser,middleware,realtime,types}.ts
│   ├── ai/{classify,prompt-runner}.ts
│   ├── currency/format.ts
│   └── utils/
├── hooks/
│   ├── use-realtime-transactions.ts
│   ├── use-current-household.ts
│   └── use-categories.ts
└── styles/globals.css
```

## Decisiones que afectan código

1. **Soft delete siempre**. Nunca DELETE físico. Filtros por `deleted_at IS NULL`.
2. **`updated_at` automático** vía trigger.
3. **Audit log automático** en `transactions`, `goals`, `categories`.
4. **`external_id` UNIQUE** previene duplicados. Formato: `telegram_{update_id}` o `web_{nanoid}`.
5. **numeric(14,2)** para todos los importes. Nunca float.
6. **timestamptz** siempre. UTC en DB, local en frontend.
7. **Tipos generados**: `npx supabase gen types typescript --linked > src/lib/supabase/types.ts` después de cada migration.

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=                 # Fase 7+ (chat) y Fase 8 (vision)
NEXT_PUBLIC_SITE_URL=

# Fase 10
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

n8n usa sus propias credenciales separadas.
