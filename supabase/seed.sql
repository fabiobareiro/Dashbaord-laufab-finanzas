-- ─────────────────────────────────────────────────────────
-- Saldito — Seed inicial
-- 1 household demo, 2 profiles (Fabio, Laura), 2 cuentas,
-- categorías default, prompt v1 en ai_config.
-- ─────────────────────────────────────────────────────────

-- HOUSEHOLD
insert into households (id, name, base_currency)
values ('00000000-0000-0000-0000-000000000001', 'Saldito Demo', 'ARS');

-- PROFILES
insert into profiles (household_id, display_name, telegram_username, color, emoji, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Fabio', 'fabotrader', '#4F6EF7', '🤓', 'owner'),
  ('00000000-0000-0000-0000-000000000001', 'Laura', null, '#FF6584', '💖', 'member');

-- ACCOUNTS default
insert into accounts (household_id, name, type, currency)
values
  ('00000000-0000-0000-0000-000000000001', 'Efectivo', 'cash', 'ARS'),
  ('00000000-0000-0000-0000-000000000001', 'Mercado Pago', 'wallet', 'ARS');

-- ─────────────────────────────────────────────────────────
-- CATEGORÍAS DEFAULT (jerárquicas)
-- ─────────────────────────────────────────────────────────

-- Vivienda y Servicios
with parent as (
  insert into categories (household_id, name, slug, type, icon)
  values ('00000000-0000-0000-0000-000000000001', 'Vivienda y Servicios', 'vivienda-servicios', 'egreso', '🏠')
  returning id
)
insert into categories (household_id, parent_id, name, slug, type, icon)
select '00000000-0000-0000-0000-000000000001', id, x.name, x.slug, 'egreso', x.icon from parent,
  (values
    ('Alquiler', 'vivienda-alquiler', '🔑'),
    ('Expensas', 'vivienda-expensas', '🏢'),
    ('Luz', 'vivienda-luz', '💡'),
    ('Gas', 'vivienda-gas', '🔥'),
    ('Internet', 'vivienda-internet', '📡'),
    ('Agua', 'vivienda-agua', '💧'),
    ('Mantenimiento', 'vivienda-mantenimiento', '🔧')
  ) as x(name, slug, icon);

-- Alimentación
with parent as (
  insert into categories (household_id, name, slug, type, icon)
  values ('00000000-0000-0000-0000-000000000001', 'Alimentación', 'alimentacion', 'egreso', '🍽️')
  returning id
)
insert into categories (household_id, parent_id, name, slug, type, icon)
select '00000000-0000-0000-0000-000000000001', id, x.name, x.slug, 'egreso', x.icon from parent,
  (values
    ('Supermercado/Hogar', 'alimentacion-supermercado', '🛒'),
    ('Almacén', 'alimentacion-almacen', '🥖'),
    ('Carnicería', 'alimentacion-carniceria', '🥩'),
    ('Verdulería', 'alimentacion-verduleria', '🥬'),
    ('Salidas/Cafetería', 'alimentacion-cafeteria', '☕'),
    ('Salidas/Restaurant', 'alimentacion-salidas-restaurant', '🍽️'),
    ('Delivery', 'alimentacion-delivery', '🛵')
  ) as x(name, slug, icon);

-- Transporte
with parent as (
  insert into categories (household_id, name, slug, type, icon)
  values ('00000000-0000-0000-0000-000000000001', 'Transporte', 'transporte', 'egreso', '🚗')
  returning id
)
insert into categories (household_id, parent_id, name, slug, type, icon)
select '00000000-0000-0000-0000-000000000001', id, x.name, x.slug, 'egreso', x.icon from parent,
  (values
    ('Combustible', 'transporte-combustible', '⛽'),
    ('Estacionamiento', 'transporte-estacionamiento', '🅿️'),
    ('SUBE', 'transporte-sube', '🚌'),
    ('Uber/Cabify', 'transporte-uber', '🚕'),
    ('Mantenimiento Auto', 'transporte-mantenimiento', '🔧'),
    ('Peajes', 'transporte-peajes', '🛣️')
  ) as x(name, slug, icon);

-- Estilo de Vida
with parent as (
  insert into categories (household_id, name, slug, type, icon)
  values ('00000000-0000-0000-0000-000000000001', 'Estilo de Vida', 'estilo-vida', 'egreso', '✨')
  returning id
)
insert into categories (household_id, parent_id, name, slug, type, icon)
select '00000000-0000-0000-0000-000000000001', id, x.name, x.slug, 'egreso', x.icon from parent,
  (values
    ('Salud', 'estilo-vida-salud', '⚕️'),
    ('Gimnasio', 'estilo-vida-gimnasio', '💪'),
    ('Ropa', 'estilo-vida-ropa', '👕'),
    ('Regalos', 'estilo-vida-regalos', '🎁'),
    ('Hobbies', 'estilo-vida-hobbies', '🎨'),
    ('Suscripciones Personales', 'estilo-vida-suscripciones', '📺')
  ) as x(name, slug, icon);

-- Finanzas y Futuro
with parent as (
  insert into categories (household_id, name, slug, type, icon)
  values ('00000000-0000-0000-0000-000000000001', 'Finanzas y Futuro', 'finanzas-y-futuro', 'ingreso', '💰')
  returning id
)
insert into categories (household_id, parent_id, name, slug, type, icon)
select '00000000-0000-0000-0000-000000000001', id, x.name, x.slug, x.type, x.icon from parent,
  (values
    ('Sueldo', 'finanzas-y-futuro-sueldo', 'ingreso', '💵'),
    ('Honorarios', 'ingresos-honorarios', 'ingreso', '💼'),
    ('Reembolso', 'finanzas-y-futuro-reembolso', 'ingreso', '↩️'),
    ('Venta', 'finanzas-y-futuro-venta', 'ingreso', '🏷️'),
    ('Ahorro', 'finanzas-y-futuro-ahorro', 'ahorro', '🐷'),
    ('Inversión', 'finanzas-y-futuro-inversion', 'ahorro', '📈')
  ) as x(name, slug, type, icon);

-- Gastos Operativos (negocio)
with parent as (
  insert into categories (household_id, name, slug, type, icon, is_business)
  values ('00000000-0000-0000-0000-000000000001', 'Gastos Operativos', 'gastos-operativos', 'egreso', '💼', true)
  returning id
)
insert into categories (household_id, parent_id, name, slug, type, icon, is_business)
select '00000000-0000-0000-0000-000000000001', id, x.name, x.slug, 'egreso', x.icon, true from parent,
  (values
    ('Monotributo', 'operativo-monotributo', '🧾'),
    ('Servicios IA', 'gastos-operativos-servicios-ia', '🤖'),
    ('Suscripciones Digitales', 'gastos-operativos-suscripciones-digitales', '🔌'),
    ('Anuncios', 'gastos-operativos-anuncios', '📢'),
    ('Materiales', 'gastos-operativos-materiales', '📦'),
    ('Empleados', 'gastos-operativos-empleados', '👥'),
    ('Impuestos', 'gastos-operativos-impuestos', '🏛️')
  ) as x(name, slug, icon);

-- ─────────────────────────────────────────────────────────
-- AI_CONFIG — prompt v1 del clasificador (global)
-- ─────────────────────────────────────────────────────────

insert into ai_config (household_id, key, value, version, active, notes)
values (
  null,
  'classifier_prompt',
  $PROMPT$Sos un analista financiero familiar argentino. Tu trabajo es clasificar mensajes de Telegram o web en transacciones financieras estructuradas.

REGLAS DURAS:
1. Devolvé ÚNICAMENTE JSON válido. Nada de markdown, nada de texto extra.
2. Elegí la categoría de la lista CATEGORIES_AVAILABLE. Si NINGUNA calza, poné "category_slug": null Y "suggest_new_category": "<nombre>".
3. NUNCA inventes montos. Si no hay número claro, "amount": null y "needs_review": true.
4. ai_confidence (0-1):
   - 0.9+: todo claro y explícito
   - 0.7-0.9: 1 dato inferido razonablemente
   - <0.7: marcá needs_review=true
5. is_business=true SOLO si la categoría es de negocio (Monotributo, Anuncios, Servicios IA, Materiales, etc.). Default false.
6. concept es 3-6 palabras, profesional. NO copies el mensaje del usuario tal cual.
7. notes captura el "por qué" si el usuario lo proveyó. Si no, null.

PERSONA ACTUAL: {{persona_actual}}

CATEGORIES_AVAILABLE:
{{categorias_json}}

ÚLTIMOS 5 MENSAJES DE ESTA PERSONA:
{{last_messages}}

OUTPUT SCHEMA:
{
  "type": "ingreso" | "egreso" | "ahorro" | "transferencia",
  "amount": number | null,
  "currency": "ARS" | "USD",
  "category_slug": string | null,
  "suggest_new_category": string | null,
  "concept": string,
  "payment_method": "efectivo" | "transferencia" | "tarjeta" | "mp" | null,
  "is_business": boolean,
  "notes": string | null,
  "ai_confidence": number,
  "ai_reasoning": string,
  "needs_review": boolean
}

EJEMPLOS:

Input: "café 1500 en el centro porque hacía frío"
Output: {"type":"egreso","amount":1500,"currency":"ARS","category_slug":"alimentacion-cafeteria","suggest_new_category":null,"concept":"Café al paso","payment_method":null,"is_business":false,"notes":"Hacía frío en el centro","ai_confidence":0.95,"ai_reasoning":"Monto y contexto claros","needs_review":false}

Input: "40k del coto"
Output: {"type":"egreso","amount":40000,"currency":"ARS","category_slug":"alimentacion-supermercado","suggest_new_category":null,"concept":"Compra Coto","payment_method":null,"is_business":false,"notes":null,"ai_confidence":0.85,"ai_reasoning":"Coto = supermercado, k = miles","needs_review":false}

Input: "alquiler 505 mil"
Output: {"type":"egreso","amount":505000,"currency":"ARS","category_slug":"vivienda-alquiler","suggest_new_category":null,"concept":"Alquiler mensual","payment_method":"transferencia","is_business":false,"notes":null,"ai_confidence":0.95,"ai_reasoning":"Monto explícito","needs_review":false}

Input: "monotributo 62000"
Output: {"type":"egreso","amount":62000,"currency":"ARS","category_slug":"operativo-monotributo","suggest_new_category":null,"concept":"Pago Monotributo","payment_method":null,"is_business":true,"notes":null,"ai_confidence":0.95,"ai_reasoning":"Impuesto del trabajo independiente","needs_review":false}

Input: "honorarios 800k"
Output: {"type":"ingreso","amount":800000,"currency":"ARS","category_slug":"ingresos-honorarios","suggest_new_category":null,"concept":"Honorarios profesionales","payment_method":"transferencia","is_business":false,"notes":null,"ai_confidence":0.9,"ai_reasoning":"Ingreso por servicios","needs_review":false}

Input: "guarde 100mil para vacaciones"
Output: {"type":"ahorro","amount":100000,"currency":"ARS","category_slug":"finanzas-y-futuro-ahorro","suggest_new_category":null,"concept":"Ahorro para vacaciones","payment_method":null,"is_business":false,"notes":"Destinado a meta vacaciones","ai_confidence":0.9,"ai_reasoning":"Movimiento de ahorro explícito","needs_review":false}

Input: "yoga 25 mil este mes"
Output: {"type":"egreso","amount":25000,"currency":"ARS","category_slug":null,"suggest_new_category":"Salud y Deporte / Yoga","concept":"Cuota yoga","payment_method":null,"is_business":false,"notes":null,"ai_confidence":0.7,"ai_reasoning":"No hay categoría yoga, sugiero crear","needs_review":true}

Input: "pagué algo el lunes"
Output: {"type":"egreso","amount":null,"currency":"ARS","category_slug":null,"suggest_new_category":null,"concept":"Pago sin detallar","payment_method":null,"is_business":false,"notes":"Sin detalles","ai_confidence":0.2,"ai_reasoning":"Falta monto y categoría","needs_review":true}

AHORA CLASIFICÁ ESTE MENSAJE:

Mensaje del usuario: {{user_message}}$PROMPT$,
  1,
  true,
  'v1 inicial — few-shot Argentina'
);
