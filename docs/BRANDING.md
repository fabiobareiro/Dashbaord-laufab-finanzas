# Branding de Saldito

## Nombre

**Saldito** (provisorio). Diminutivo cariñoso de "saldo". Argentino, corto, fácil de recordar.

Alternativas si no está disponible: **Plata**, **Junti**, **Bolsillo**.

**Acción Sesión 0**: chequear `saldito.app`, `saldito.com.ar`, `saldito.io`.

## Tagline

**"Mandale un mensaje. Saldito te lo registra."**

Variantes para ads:
- "La economía de tu familia, en tiempo real."
- "Hablale como a un amigo. Te entiende."

## Voz y tono

Como hablás con un amigo que sabe de plata. Tutear siempre. Frases cortas.

❌ "Su balance del período actual asciende a..."
✅ "Esta semana se te fue $150K en delivery."

❌ "Procesando solicitud..."
✅ "Pensando..."

Reglas:
- Plata = plata, no "fondos" ni "capital".
- Errores en tono humano: "Algo no salió bien, ¿probamos de nuevo?".
- Si la app no entiende: "No te entendí, ¿podés repetirlo?".

## Paleta

```css
/* Light */
--bg:           #FAFAF7;
--surface:      #FFFFFF;
--surface-alt:  #F4F4F0;
--ink:          #0A0A0A;
--mid:          #6B6B6B;
--soft:         #A0A0A0;
--line:         #EBEBE5;

--green:        #00B383;  /* ingresos, ahorro */
--red:          #E8425A;  /* egresos, alertas */
--blue:         #4F6EF7;  /* primario, links, balance */
--amber:        #E89B2C;  /* warnings, needs_review */

/* Dark */
--bg:           #0E0E0C;
--surface:      #1A1A18;
--surface-alt:  #1F1F1C;
--ink:          #F5F5F0;
--mid:          #999;
--green:        #22D49A;
--red:          #FF6B7E;
--blue:         #7B8FFF;
--amber:        #FFB454;
```

**Regla**: max 2 acentos por pantalla. Verde positivo, rojo solo cuando algo está mal, azul primario.

## Tipografía

- **Display** (números, títulos cards): **Syne** 700-800.
- **UI** (todo lo demás): **Inter** 400-600.

```css
font-family: 'Syne', sans-serif;
font-family: 'Inter', -apple-system, sans-serif;
```

Cargar via Google Fonts. Fallback `system-ui`.

## Logo

Concepto: **una "S" estilizada** en cuadrado redondeado con gradiente azul→verde.

```html
<svg width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <text x="16" y="22" text-anchor="middle"
        font-family="Syne" font-weight="800"
        font-size="18" fill="white">S</text>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="32" y2="32">
      <stop offset="0%" stop-color="#4F6EF7"/>
      <stop offset="100%" stop-color="#00B383"/>
    </linearGradient>
  </defs>
</svg>
```

## Iconos de categorías

Emoji nativo (cero peso, multiplataforma):

```
🏠 Vivienda y Servicios
🛒 Alimentación
⛽ Transporte
☕ Salidas
👕 Personal y Estilo
💼 Negocio / Operativo
💰 Ingresos
🎯 Ahorros y Metas
📈 Inversiones
💊 Salud
🎉 Ocio
🎁 Regalos
✈️ Viajes
📚 Educación
🐶 Mascotas
```

## UI essentials

- **Bordes**: 1px, color `--line`. Nunca 2px.
- **Radios**: cards 14px, botones 10px, pills 24px.
- **Sombras**: muy sutiles. `0 1px 2px rgba(10,10,10,.04)`. Solo FAB y modales tienen sombra fuerte.
- **Espaciado**: múltiplos de 4px.
- **Animaciones**: 150-200ms hovers, 300-400ms entradas. Easing `cubic-bezier(.4,0,.2,1)`.

## Microcopy crítico

| Contexto | Texto |
|---|---|
| Quick-add placeholder | "Decime un gasto o ingreso… ej: '40 mil en el super'" |
| Confirmación | "Listo, lo anoté." |
| Botón principal | "Registrar" |
| Estado vacío | "Acá van a aparecer tus movimientos cuando empieces a registrar." |
| Loading | "Pensando…" |
| Error genérico | "Algo no salió bien. ¿Lo intentamos de nuevo?" |
| Confirmación borrar | "¿Seguro? Lo podés deshacer en los próximos 10 segundos." |
| Welcome bot | "Hola. Mandame un mensaje con un gasto y te lo anoto. Ej: '5000 de café'." |

## Bot de Telegram

- Foto perfil: logo en cuadrado.
- Nombre: "Saldito".
- Username: `@SalditoBot` o disponible.
- Bio: "Anotá tus gastos hablándome. saldito.app"

## Anti-patrones

❌ Logo que cambia según pantalla.
❌ 3+ tipografías.
❌ Emojis decorativos en botones (✓ Aceptar). Solo en categorías.
❌ Gradientes en todos lados (solo logo).
❌ Animaciones >500ms.
❌ Stock photos de gente sonriendo en landing fintech.
