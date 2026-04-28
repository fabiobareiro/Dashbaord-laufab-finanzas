# Sesión 1 — Base de datos y migración

## Antes vos

1. Ir a supabase.com → New project. Nombre: `saldito-prod`. Región: São Paulo.
2. Generar contraseña DB, guardarla.
3. Copiar Project URL + anon key + service_role key.
4. Asegurar `context/data.csv` está en el repo.

## Pegar a Claude Code

```
Vamos a hacer la Sesión 1 de Saldito.

CONTEXTO REQUERIDO:
- CLAUDE.md
- docs/ROADMAP.md (Fase 1)
- docs/ARCHITECTURE.md (sección Schema)
- docs/PROMPT.md (para el seed de ai_config)

INVOCÁ AL SUBAGENT db-schema-expert.

OBJETIVO: schema aplicado + datos del CSV migrados + tipos TS generados.

PASOS:

1. Crear archivos en supabase/migrations/:
   - 0001_initial_schema.sql con TODAS las tablas de docs/ARCHITECTURE.md
     (households, profiles, accounts, categories, transactions, goals,
      goal_contributions, recurring_transactions, budgets, agent_memory,
      ai_config, audit_log, household_invites)
   - 0002_rls_policies.sql con current_household_id() y políticas RLS por tabla
   - 0003_realtime.sql habilitando Realtime en transactions, goals,
     goal_contributions, accounts, categories
   - 0004_triggers.sql con set_updated_at() y triggers de audit_log

2. Crear supabase/seed.sql:
   - 1 household: name='Saldito Demo', base_currency='ARS'
   - 2 profiles:
     * Fabio: telegram_username='fabotrader', display_name='Fabio',
       color='#4F6EF7', emoji='🧔', role='owner'
     * Laura: telegram_username='<el de Laura del sheet>', display_name='Laura',
       color='#FF6584', emoji='👩', role='member'
   - 1 account: 'Efectivo ARS', type='cash', currency='ARS'
   - Categorías default jerárquicas (lista al final de este archivo)
   - 1 ai_config: key='classifier_prompt', value=(prompt v1 de docs/PROMPT.md),
     version=1, active=true

3. Pedirme las credenciales Supabase, después aplicar:
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push

4. Verificar en Supabase Studio: tablas existen, RLS habilitado.

5. Crear scripts/import-from-sheet.ts:
   - Leer context/data.csv
   - Mapeo de normalización de categorías:
     "Super/Almacen" -> alimentacion-supermercado
     "Cariceria"     -> alimentacion-supermercado
     "Comida"        -> alimentacion-supermercado
     "Almacen"       -> alimentacion-supermercado
     (revisar el CSV completo, mostrarme el mapeo antes de correr)
   - Detectar duplicados por (occurred_at, amount, profile_id)
   - Insert con source='import', external_id='import_<row_number>'
   - ai_confidence=null
   - Loggear: leídas, insertadas, saltadas, categorías nuevas creadas

6. Correr: tsx scripts/import-from-sheet.ts. Mostrame el resumen.

7. Generar tipos:
   npx supabase gen types typescript --linked > src/lib/supabase/types.ts

8. Commit: "feat(db): initial schema, seeds, import from sheet"

VERIFICACIÓN:
- En Supabase Studio: transactions tiene N filas (decirme N).
- categories sin "Cariceria" duplicado.
- ai_config tiene 1 row con classifier_prompt.
- RLS habilitado en TODAS las tablas.
- types.ts existe.

CIERRE: /session-end 1

CATEGORÍAS DEFAULT:

VIVIENDA Y SERVICIOS (egreso, 🏠) — vivienda
  Alquiler (vivienda-alquiler), Expensas, Internet, Luz, Gas, Agua, Mantenimiento

ALIMENTACIÓN (egreso, 🛒) — alimentacion
  Supermercado y Hogar (alimentacion-supermercado), Verdulería, Carnicería,
  Cafetería (alimentacion-cafeteria), Restaurant (alimentacion-restaurant), Delivery

TRANSPORTE (egreso, ⛽) — transporte
  Combustible, Estacionamiento, SUBE, Uber/Cabify, Mantenimiento Auto, Peajes

ESTILO DE VIDA (egreso, 👕) — personal
  Salud, Gimnasio, Ropa, Regalos, Hobbies, Suscripciones Personales

OPERATIVO (egreso, is_business=true, 💼) — operativo
  Monotributo (operativo-monotributo), Servicios IA (operativo-servicios-ia),
  Anuncios (operativo-anuncios), Materiales, Empleados, Impuestos

INGRESOS (ingreso, 💰) — ingresos
  Sueldo, Honorarios (ingresos-honorarios, is_business=true), Reembolso, Venta, Regalo recibido

AHORROS Y FUTURO (ahorro, 🎯) — ahorros
  Ahorro pesos, Ahorro dólares, Inversión, Aporte a meta
```

## Siguiente: SESSION_2.md
