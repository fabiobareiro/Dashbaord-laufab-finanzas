# Sesión 6 — Categorías + Metas + Editor de Prompt + Polish

## Pegar a Claude Code

```
Vamos a hacer la Sesión 6 de Saldito (la última del MVP).

CONTEXTO:
- CLAUDE.md
- docs/ARCHITECTURE.md (categories, goals, ai_config)
- docs/PROMPT.md (editor del prompt)
- docs/BRANDING.md
- docs/notes/SESSION_5_NOTES.md

INVOCÁ AL SUBAGENT ui-designer y prompt-engineer cuando corresponda.

OBJETIVO: cerrar el MVP. /categorias, /metas, /admin/prompt, Cmd+K, PWA.

PASOS:

1. /categorias (page + components):
   - Tree view con jerarquía padre-hijo.
   - Cada item: emoji + nombre + count de transacciones + acciones.
   - Crear nueva (modal con padre opcional).
   - Editar nombre/emoji/color/is_business inline.
   - Archive (soft) con confirmación.
   - Mergear duplicadas: "Mover N transacciones de X a Y, archivar X".
   - Badge dorado en categorías con pending_review=true + tooltip "Sugerida
     por la IA, ¿la querés conservar?" → botón "Aprobar" / "Archivar".

2. /metas (page + components):
   - Grid de cards con progreso visual (barra + %).
   - Crear meta: name, emoji, target_amount, target_date, monthly_contribution,
     account opcional.
   - Detalle: drawer con simulador "Si aportás $X/mes llegás el ___".
   - Lista de contribuciones (goal_contributions linked).
   - Botón "Aportar" → crea transaction (type=ahorro, category linked) +
     goal_contribution.
   - Estado completado con confetti cuando se alcanza el target.

3. /admin/prompt (solo accesible por owner):
   - Editor monaco-like del prompt activo.
   - Sidebar con historial de versiones (lista con fecha + autor + comentario).
   - Click en versión vieja → preview + botón "Restaurar como activa".
   - Botón "Probar con mensaje": input → corre prompt sin guardar → muestra
     JSON resultante + tiempo de ejecución + tokens.
   - Tab "Cola de revisión": lista de transactions con needs_review=true.
     Por cada una: ver mensaje original + categorización IA + 
     botón "Aprobar como está" / "Corregir y guardar como ejemplo".
   - Tab "Recategorizar histórico": botón que lanza job que recorre todas
     las transactions del household y aplica el prompt actual a las que
     tienen ai_confidence < 0.7. Mostrar progreso en tiempo real.

4. Command Palette (Cmd+K):
   - Buscar transacciones por concepto.
   - Acciones rápidas: "Nueva transacción", "Nueva meta", "Ir a categorías",
     "Cambiar tema".
   - Sugerencias contextuales según página.

5. PWA setup:
   - public/manifest.json con name "Saldito", icons (logo en varios tamaños),
     theme_color, background_color, display "standalone".
   - public/sw.js básico (offline shell).
   - Meta tags en layout para iOS.

6. README final del repo:
   - Qué es Saldito.
   - Stack.
   - Cómo correr local.
   - Variables de entorno.
   - Link al ROADMAP.

7. Validaciones finales:
   - Mobile responsive en /movimientos (la tabla debe scrollear lateral).
   - Dark mode coherente en todas las páginas.
   - Todos los textos en español, microcopy de docs/BRANDING.md.
   - Empty states en cada lista.

8. Commit: "feat: categorias, metas, prompt editor, cmd+k, PWA"

9. Última cosa: en CLAUDE.md, marcar todas las sesiones como [x] con fecha.

VERIFICACIÓN MVP COMPLETO:
- Login funciona desde cero.
- Bot Telegram registra con clasificación buena.
- Dashboard muestra datos reales en vivo.
- /movimientos permite editar, filtrar, exportar.
- /categorias permite gestionar todo el árbol.
- /metas permite crear y trackear.
- /admin/prompt permite iterar sin tocar código.
- PWA instalable en celular.
- Mobile UX OK.

A PARTIR DE AHÍ: invitar a Laura a usarlo todos los días por 1 semana,
documentar friction points, decidir qué fase del roadmap (7-14) priorizar.

CIERRE: /session-end 6
```

## Después del MVP

Ver `docs/ROADMAP.md` Fases 7-14 para el plan de comercialización.

## Patrón para futuras sesiones

Crear `docs/sessions/SESSION_N.md` con la misma estructura:
- Antes vos
- Pegar a Claude Code (con contexto requerido + subagent + pasos + verificación + cierre)
- Siguiente

Cada nueva fase del roadmap se vuelve una nueva sesión.
