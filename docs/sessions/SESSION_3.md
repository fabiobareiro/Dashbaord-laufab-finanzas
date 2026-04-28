# Sesión 3 — Bootstrap Next.js + auth

## Antes vos

1. Tener listo en Supabase: URL + anon key.
2. Vercel conectado al repo (debería estarlo del setup viejo).
3. Si la URL de Vercel apunta a `index.html` del HTML viejo: vamos a configurar para que apunte al Next.js nuevo. Vercel detecta automáticamente el `package.json` de Next.

## Pegar a Claude Code

```
Vamos a hacer la Sesión 3 de Saldito.

CONTEXTO:
- CLAUDE.md
- docs/ARCHITECTURE.md (sección "Estructura de archivos del frontend")
- docs/BRANDING.md (paleta, fuentes, microcopy)
- docs/notes/SESSION_1_NOTES.md (URL Supabase, keys)

INVOCÁ AL SUBAGENT ui-designer.

OBJETIVO: app Next.js 16 funcionando en Vercel con login Supabase + topbar
horizontal + theme provider light/dark + branding aplicado.

PASOS:

1. Bootstrap del starter:
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
   (si pregunta por sobreescribir el repo: aceptar; legacy/ ya está protegido)

   Si querés clonar el starter completo (recomendado):
   git clone https://github.com/KolbySisk/next-supabase-stripe-starter.git tmp-starter
   cp -r tmp-starter/* tmp-starter/.* . 2>/dev/null || true
   rm -rf tmp-starter .git/index.lock 2>/dev/null
   (ojo: preservar legacy/, context/, docs/, .claude/, CLAUDE.md, AGENTS.md)

2. Instalar dependencias clave:
   npm install @supabase/ssr @supabase/supabase-js zod
   npm install lucide-react @tremor/react
   npx shadcn@latest init  # config: base color slate, css variables yes
   npx shadcn@latest add button card input label dialog dropdown-menu \
     avatar tabs toast badge skeleton sonner

3. Configurar fonts en src/app/layout.tsx:
   - import { Syne, Inter } from 'next/font/google'
   - Aplicar como variables CSS

4. Aplicar paleta de docs/BRANDING.md en src/app/globals.css:
   :root con --bg, --surface, --ink, --green, --red, --blue, --amber, etc.
   .dark con valores dark mode.

5. Crear src/lib/supabase/:
   - browser.ts: createBrowserClient de @supabase/ssr
   - server.ts: createServerClient
   - middleware.ts: refresh de sesión
   - types.ts: (ya generado en Sesión 1)

6. Crear src/middleware.ts en root:
   - Protege rutas que no son /login
   - Redirige a /login si no hay sesión

7. Crear app/(auth)/login/page.tsx:
   - Formulario simple email + botón "Mandame el link"
   - Usa supabase.auth.signInWithOtp({email, options:{emailRedirectTo}})
   - Mostrar mensaje "Te mandé un mail con el link de acceso"
   - Diseño minimalista: card centrada, logo arriba, fondo --bg

8. Crear app/(app)/layout.tsx con:
   - Topbar horizontal con logo a la izquierda, nav al medio, theme toggle
     y avatar a la derecha. SIN SIDEBAR.
   - Nav links: Resumen / Movimientos / Categorías / Metas / Tú
   - Active link: underline con --blue
   - Theme toggle (light/dark)
   - Auth check: si no hay user, redirect a /login

9. Crear app/(app)/page.tsx con placeholder:
   - Hero "Hola, {nombre}" con saludo según hora del día
   - Texto "Tu dashboard real va a aparecer en la próxima sesión"
   - Botón "Probá el quick-add" (deshabilitado, solo decorativo)

10. Crear theme provider con next-themes:
    npm install next-themes

11. Configurar variables de entorno (.env.local):
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

12. Configurar las mismas en Vercel (settings → environment variables).

13. Probar local: npm run dev → ir a localhost:3000 → debería redirigir a
    /login → meter mail → recibir mail → click link → entra al dashboard.

14. Commit: "feat(app): bootstrap Next.js 16 + auth + topbar + branding"

15. Push a main → Vercel deploys automático.

16. Probar la URL de Vercel.

VERIFICACIÓN:
- Local: login con magic link funciona end-to-end.
- Producción: misma URL anterior ahora muestra Next.js, no el HTML viejo.
- Theme toggle cambia paleta.
- Mobile: topbar se ve bien (no hace overflow).

CIERRE: /session-end 3
```

## Siguiente: SESSION_4.md
