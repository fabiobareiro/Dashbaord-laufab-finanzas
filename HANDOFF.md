# HANDOFF — cómo retomar este proyecto en otro chat

## Para abrir nuevo chat de Claude.ai

Pegale al asistente este mensaje:

---

> Voy a retomar un proyecto. Te paso el `CLAUDE.md` con todo el contexto. Lo armé en otra sesión donde investigamos el problema, validamos el diseño con un mockup HTML, y dejamos un plan de 6 sesiones de Claude Code.
>
> El proyecto es un dashboard de finanzas familiares (LAUFAB) que reemplaza un sistema viejo de Google Sheets + HTML estático por Next.js + Supabase + n8n con bot de Telegram.
>
> Estoy listo para arrancar **Sesión 1** del plan. Necesito que me des el prompt exacto que tengo que pegar a Claude Code en mi terminal para ejecutarla.
>
> [pegar CLAUDE.md acá]

---

## Para ir directo a Claude Code (sin chat intermedio)

1. Crear carpeta nueva: `mkdir laufab-finanzas-v2 && cd laufab-finanzas-v2`
2. Copiar `CLAUDE.md` adentro.
3. Crear estructura de contexto:
   ```
   mkdir -p context/old-n8n context/old-html
   ```
4. Copiar adentro:
   - Los 2 JSON de n8n → `context/old-n8n/`
   - El HTML viejo → `context/old-html/index.html`
   - Export CSV del Sheet → `context/data.csv`
5. Lanzar Claude Code: `claude`
6. Pegarle:

   > Lee `CLAUDE.md` completo y los archivos de `context/`. Después arrancá la **Sesión 1** del plan. Antes de tocar nada, mostrame el SQL completo de la migration y el seed para que valide. Después aplicá todo y corré el import del CSV.

## Antes de la primera sesión

Tenés que tener:

- [ ] Cuenta en Supabase (supabase.com).
- [ ] Cuenta en GitHub.
- [ ] Repo nuevo creado: `laufab-finanzas-v2` (privado, vacío).
- [ ] Cuenta OpenRouter activa (la que ya usás en n8n).
- [ ] Vercel conectado a tu GitHub.
- [ ] Export CSV del Sheet actual.
- [ ] Backup de los 2 workflows de n8n exportados como JSON.

## Para que cada sesión sea limpia

Al final de cada sesión, decile a Claude Code:

> Generá `SESSION_X_NOTES.md` con: qué se hizo, qué quedó pendiente, decisiones tomadas, comandos para retomar.

Así si abrís otro chat después, simplemente le decís "leé `CLAUDE.md` + el último `SESSION_X_NOTES.md` y seguí con la Sesión X+1".

## Si te trabás

- Si Claude Code/Codex propone cambios fuera del plan → recordale el punto 2 de las "Reglas" en `CLAUDE.md`.
- Si pide acceso al Supabase del MCP actual → recordale el punto 7 (es de otro cliente, hay que crear uno nuevo).
- Si quiere agregar sidebar → recordarle que el usuario lo odia, dirección visual es Monarch/Lunch Money.
