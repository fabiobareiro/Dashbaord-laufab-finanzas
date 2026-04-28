# Sesión 0 — Setup

## Antes vos

1. Repo: usar el actual `Dashbaord-laufab-finanzas` (ya conectado a Vercel).
2. Tener listos en `context/`:
   - `data.csv` (export del Sheet)
   - `old-html/index.html` (HTML viejo)
   - `old-n8n/*.json` (workflows exportados)

## Pegar a Claude Code

```
Vamos a hacer la Sesión 0 de Saldito (ver CLAUDE.md y docs/sessions/SESSION_0.md).

OBJETIVO: setup del repo con skills, subagents, comandos y estructura.

PASOS:

1. Mover el HTML viejo:
   - mkdir -p legacy
   - git mv index.html legacy/index.html
   - Crear legacy/README.md: "Versión anterior antes de migrar a Saldito v2."

2. Crear estructura:
   - context/old-n8n/, context/old-html/
   - .claude/skills/, .claude/agents/, .claude/commands/, .claude/notes/
   - docs/notes/ (vacío)
   - supabase/migrations/, supabase/seeds/
   - n8n/, scripts/, src/

3. Actualizar .gitignore:
   .env*
   .claude/notes/
   node_modules/
   .next/
   supabase/.branches/
   supabase/.temp/

4. Crear skills en .claude/skills/ (cada una con SKILL.md):

   frontend-design/SKILL.md:
   ---
   name: frontend-design
   description: Apply Saldito's design system. Use when creating any UI.
   ---
   Read docs/BRANDING.md first. Use Tailwind v4 + shadcn/ui. Syne for headings,
   Inter for body. No sidebar — horizontal topbar. Light + dark. Microcopy
   argentino, tutear, casual. Animations 150-200ms. Rounded 14px cards, 10px
   buttons, 24px pills. Border 1px --line. Subtle shadows except FAB/modals.

   systematic-debugging/SKILL.md:
   ---
   name: systematic-debugging
   description: Use when encountering bugs, test failures, or unexpected behavior.
   ---
   Before fixing: 1) Reproduce reliably. 2) Read the error fully. 3) Trace data
   flow backwards from error. 4) Identify root cause, not symptom. 5) Write a
   test that fails, then fix. 6) Verify fix doesn't break anything else.

   test-driven-development/SKILL.md:
   ---
   name: test-driven-development
   description: Use when implementing any feature or bugfix.
   ---
   Red → Green → Refactor. Write the failing test first. Implement minimum to
   pass. Refactor. Tests are documentation.

5. Crear subagents en .claude/agents/:

   db-schema-expert.md:
   ---
   name: db-schema-expert
   description: Postgres/Supabase migrations, RLS, indexes. Use for schema work.
   tools: Read, Edit, Write, Bash
   model: sonnet
   ---
   Always read docs/ARCHITECTURE.md first. Multi-tenant via household_id,
   soft-delete via deleted_at, audit_log triggers, idempotency via external_id
   UNIQUE. numeric(14,2) for money. timestamptz only. Generate types after
   every migration.

   ui-designer.md:
   ---
   name: ui-designer
   description: React components, pages, layouts. Use for anything visual.
   tools: Read, Edit, Write
   model: sonnet
   skills:
     - frontend-design
   ---
   Always read docs/BRANDING.md first. Saldito uses Syne+Inter. No sidebar.
   Horizontal layout Monarch-style. Light+dark. Microcopy argentino casual.
   No admin dashboard patterns.

   n8n-workflow-builder.md:
   ---
   name: n8n-workflow-builder
   description: Modify or create n8n workflows for Saldito.
   tools: Read, Edit, Write
   model: sonnet
   ---
   Existing workflow in context/old-n8n/. New architecture in docs/PROMPT.md.
   Always: lookup profile by telegram_username, lookup categories, lookup
   last 5 messages from agent_memory, lookup active prompt from ai_config,
   inject all into LLM, parse JSON bulletproof, insert with external_id.

   prompt-engineer.md:
   ---
   name: prompt-engineer
   description: Iterate the LLM classifier prompt. Test variations.
   tools: Read, Edit, Write, Bash
   model: sonnet
   ---
   Read docs/PROMPT.md for current version. Test variations against real cases
   from context/data.csv before suggesting changes. Preserve JSON-only output
   and few-shot examples format.

6. Crear slash commands en .claude/commands/:

   session-start.md:
   ---
   description: Inicia una sesión específica del roadmap
   ---
   Lee docs/sessions/SESSION_$1.md y arrancá esa sesión. Antes de tocar nada,
   mostrame el plan que vas a seguir.

   session-end.md:
   ---
   description: Cierra la sesión actual generando notas
   ---
   Generá docs/notes/SESSION_$1_NOTES.md con: qué se hizo, qué quedó,
   decisiones tomadas, comandos para retomar, archivos modificados.
   Después marcá la sesión como completada en CLAUDE.md ([ ] → [x] con fecha).

   check-context.md:
   ---
   description: Verifica que el contexto esté cargado
   ---
   Listá los archivos que leíste: CLAUDE.md, docs/ROADMAP.md,
   docs/ARCHITECTURE.md, docs/BRANDING.md, docs/PROMPT.md, último notes.
   Si falta alguno, leelo ahora.

7. Generar logo en public/logo.svg según docs/BRANDING.md (la S con gradiente).

8. Crear AGENTS.md como copia de CLAUDE.md (para Codex):
   cp CLAUDE.md AGENTS.md

9. Verificación: tree -L 3 -I 'node_modules', mostrame estructura.

10. Commit: "chore: setup Saldito v2 — skills, subagents, commands, structure"

NO hacer: crear Supabase, tocar package.json (más allá del nombre), clonar starter Next.js.

Al terminar: /session-end 0
```

## Siguiente: SESSION_1.md
