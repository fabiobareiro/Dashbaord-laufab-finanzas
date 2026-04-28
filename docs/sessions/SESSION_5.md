# Sesión 5 — Página /movimientos

## Pegar a Claude Code

```
Vamos a hacer la Sesión 5 de Saldito.

CONTEXTO:
- CLAUDE.md
- docs/ARCHITECTURE.md (transactions schema)
- docs/BRANDING.md (filters, microcopy)
- docs/notes/SESSION_4_NOTES.md

INVOCÁ AL SUBAGENT ui-designer.

OBJETIVO: página /movimientos que reemplaza al Google Sheet. Tabla virtualizada,
edición inline, filtros, undo, batch actions, export.

PASOS:

1. Instalar:
   npm install @tanstack/react-table @tanstack/react-virtual nanoid
   npm install date-fns

2. app/(app)/movimientos/page.tsx:
   - Server component carga transactions con paginación inicial.
   - Pasa a client component <TransactionsTable />.

3. components/transactions/transactions-table.tsx:
   - TanStack Table con virtualización.
   - Columnas:
     * Fecha (formateada en español)
     * Persona (avatar + emoji + name)
     * Concepto
     * Categoría (con icon emoji + nombre, badge needs_review si aplica)
     * Importe (verde ingreso / rojo egreso)
     * Medio de pago
     * Notas (truncado, hover muestra completo)
     * Confianza IA (icono según valor)
   - Edición inline: doble click en celda → input → enter para guardar.
   - Selección múltiple: checkbox por fila + master.
   - Hover row: aparecen acciones a la derecha (editar, borrar).

4. components/transactions/filters.tsx:
   - Pills horizontales: persona, tipo, categoría, fecha, monto, búsqueda.
   - Cada filter abre un dropdown.
   - Pills muestran el valor seleccionado, X para limpiar.
   - URL params reflejan filtros (compartibles).
   - Filtro especial "Solo pendientes de revisar" (toggle).

5. Acciones batch:
   - Cuando hay seleccionadas: barra inferior con "Cambiar categoría",
     "Marcar revisadas", "Eliminar".
   - "Cambiar categoría" abre dialog con selector → confirma → bulk update.
   - "Eliminar" hace soft delete con toast + undo.

6. Soft delete con undo:
   - Click "Eliminar" → setea deleted_at = now().
   - Toast 10s con botón "Deshacer".
   - Si click undo: deleted_at = null.

7. Server actions:
   - update-transaction.ts (single edit)
   - bulk-update-transactions.ts (batch)
   - soft-delete-transactions.ts
   - restore-transactions.ts
   - export-csv.ts (devuelve CSV con todos los filtros aplicados)

8. components/transactions/edit-drawer.tsx:
   - Drawer lateral cuando se hace click en una fila.
   - Form completo con todos los campos.
   - Mostrar audit log de esa transacción al final.

9. Loading skeletons + empty state ("Acá van a aparecer tus movimientos
   cuando empieces a registrar.").

10. Botón "Exportar CSV" arriba a la derecha.

11. Commit: "feat(movimientos): tabla editable, filtros, batch, export"

VERIFICACIÓN:
- Editar 5 transacciones inline.
- Borrar 2 con undo en cada una.
- Recategorizar 10 en batch.
- Aplicar filtros y compartir URL → otra ventana muestra mismo estado.
- Filtro "solo pendientes" muestra las needs_review=true.
- Exportar CSV → archivo descargado correcto.

CIERRE: /session-end 5
```

## Siguiente: SESSION_6.md
