# Sesión 4 — Dashboard real con Realtime

## Antes vos

Ya están corriendo: Sesiones 1, 2, 3 OK. Tenés datos reales en Supabase, el bot escribiendo, y la app deployada con login.

Necesitás `OPENROUTER_API_KEY` en Vercel para el quick-add. Configurarla en environment variables.

## Pegar a Claude Code

```
Vamos a hacer la Sesión 4 de Saldito.

CONTEXTO:
- CLAUDE.md
- docs/BRANDING.md (KPIs, charts, colores)
- docs/PROMPT.md (quick-add usa el mismo prompt que el bot)
- docs/notes/SESSION_3_NOTES.md

INVOCÁ AL SUBAGENT ui-designer.

OBJETIVO: dashboard principal con datos reales + Realtime. Cuando llega un
mensaje al bot, aparece en la página sin recargar.

PASOS:

1. Hooks en src/hooks/:
   - use-current-household.ts: lee profile del user logueado, devuelve
     household_id + display_name + emoji + role.
   - use-realtime-transactions.ts: suscripción a INSERTs/UPDATEs en
     transactions del household. Devuelve { rows, isLoading, refresh }.
   - use-categories.ts: lista de categorías activas con caché.

2. Componentes en src/components/:
   - kpi/kpi-card.tsx: card con título, valor animado (CountUp),
     diferencia vs período anterior, icono.
   - charts/evolution-chart.tsx: line chart de Tremor con ingresos vs egresos.
   - charts/top-categories.tsx: bar chart horizontal con top 5.
   - transactions/recent-list.tsx: últimas N transacciones, click abre detail
     drawer.
   - transactions/quick-add.tsx: textarea grande, botón "Pensar"
     (server action), preview, "Confirmar".
   - layout/period-selector.tsx: tabs Hoy/Semana/Mes/Año.
   - layout/profile-tabs.tsx: tabs Todos/Fabio/Laura (dinámico desde profiles).

3. Server Action en src/app/(app)/_actions/classify.ts:
   - Recibe { text }
   - Carga profile del user, categorías, prompt activo, últimas memorias.
   - Arma el mismo prompt de docs/PROMPT.md.
   - Llama a OpenRouter con anthropic/claude-haiku-4.5.
   - Parsea JSON.
   - Devuelve { parsed, raw } sin guardar (preview).

4. Server Action en src/app/(app)/_actions/save-transaction.ts:
   - Recibe el parsed + raw_input.
   - Inserta en transactions con source='web', external_id='web_<nanoid>'.
   - Inserta en agent_memory.
   - revalidatePath('/').

5. app/(app)/page.tsx (dashboard):
   - "Hola {nombre}, {saludo según hora}"
   - Quick-add prominente arriba.
   - 4 KPI cards: Ingresos, Egresos, Balance, Tasa de ahorro.
     Calcular en server component con query SQL.
   - Tabs Todos / Fabio / Laura → filtra los KPIs.
   - Period selector → recarga con nuevos rangos.
   - Evolution chart full width.
   - Top 5 categorías + Últimas 7 transacciones (2 columnas).
   - Sección "Tus metas" (placeholder si vacío).

6. Realtime:
   - En el dashboard client component, useRealtimeTransactions().
   - Cuando llega un INSERT: toast "Nueva transacción de {profile}",
     refrescar KPIs (router.refresh()).
   - Cuando llega un UPDATE: lo mismo + animación fade-yellow en la fila.

7. Skeletons mientras carga:
   - KPI cards con shimmer.
   - Chart con loading state.
   - Lista con 5 placeholders.

8. Commit: "feat(dashboard): KPIs + chart + quick-add + realtime"

VERIFICACIÓN:
- Abrir el dashboard.
- Mandar mensaje al bot desde el celular.
- En 1-2 segundos, la transacción aparece en el dashboard sin recargar.
- Quick-add web: tipear "café 1500", click Pensar, ver preview, Confirmar,
  aparecer en la lista.
- Cambiar a tab "Fabio" y ver que los KPIs filtran.
- Cambiar período a "Año" y ver que el chart cambia.

CIERRE: /session-end 4
```

## Siguiente: SESSION_5.md
