# Sesión 2 — n8n adaptado

## Antes vos

1. Acceder al panel de n8n.
2. Exportar workflow viejo de Telegram a JSON, ponerlo en `context/old-n8n/`.
3. En Supabase Studio → Settings → API: copiar Project URL + service_role key.
4. En n8n → Credentials → New → "HTTP Header Auth":
   - Name: "Supabase Service"
   - Header: `apikey` con value `<service_role_key>`
   - + otra: `Authorization` con value `Bearer <service_role_key>`

## Pegar a Claude Code

```
Vamos a hacer la Sesión 2 de Saldito.

CONTEXTO:
- CLAUDE.md
- docs/PROMPT.md (cómo se arma el prompt dinámico)
- docs/ARCHITECTURE.md (sección "Flujo: usuario manda mensaje a Telegram")
- docs/notes/SESSION_1_NOTES.md (URL Supabase, household_id, etc.)
- context/old-n8n/*.json (workflow viejo)

INVOCÁ AL SUBAGENT n8n-workflow-builder.

OBJETIVO: workflow nuevo de n8n que escribe a Supabase con clasificación IA
mejorada y idempotencia. NO TOCAR el workflow viejo, dejarlo intacto.

PASOS:

1. Leer context/old-n8n/*.json para entender la estructura actual.

2. Diseñar n8n/saldito-telegram-bot-v2.json con estos nodos en orden:

   1. Webhook
      Path: /webhook/saldito-bot-v2 (path nuevo, no pisa el viejo)
      Method: POST
   
   2. HTTP "Get Profile":
      GET {{$env.SUPABASE_URL}}/rest/v1/profiles
        ?telegram_username=eq.{{$json.body.message.from.username}}
        &select=id,display_name,household_id,emoji
      Si vacío: responder "No te tengo registrado, pedile a Fabio que te
      agregue" y terminar.
   
   3. HTTP "Get Categories":
      GET {{$env.SUPABASE_URL}}/rest/v1/categories
        ?household_id=eq.{{$('Get Profile').first().json.household_id}}
        &archived=eq.false
        &select=id,slug,name,type,is_business,parent_id
   
   4. HTTP "Get Memory":
      GET {{$env.SUPABASE_URL}}/rest/v1/agent_memory
        ?household_id=eq.{{...}}
        &profile_id=eq.{{$('Get Profile').first().json.id}}
        &order=created_at.desc
        &limit=10
        &select=role,content,created_at
   
   5. HTTP "Get Active Prompt":
      GET {{$env.SUPABASE_URL}}/rest/v1/ai_config
        ?household_id=eq.{{...}}
        &key=eq.classifier_prompt
        &active=eq.true
        &select=value,version
        &limit=1
   
   6. Code "Build Prompt" (JS): tal cual el snippet de docs/PROMPT.md
   
   7. HTTP "OpenRouter": POST a OpenRouter API con el prompt armado.
      Model: anthropic/claude-haiku-4.5
      Body: { model, messages: [{role:'user', content: finalPrompt}],
              response_format: {type:'json_object'} }
   
   8. Code "Parse JSON" con bulletproof clean (manejar markdown si lo mete):
      const raw = $json.choices[0].message.content;
      const cleaned = raw.replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();
      const parsed = JSON.parse(cleaned);
      return { ...parsed };
   
   9. IF "Suggest new category?": rama si parsed.suggest_new_category != null
      → HTTP POST /rest/v1/categories con pending_review=true
      → Setear category_id de la nueva
   
   10. HTTP "Insert Transaction":
       POST {{$env.SUPABASE_URL}}/rest/v1/transactions
       Headers: apikey, Authorization, Prefer: return=representation
       Body: {
         household_id, profile_id, category_id,
         occurred_at: now(),
         amount, currency, type, is_business, concept, payment_method, notes,
         source: 'telegram',
         raw_input: $('Webhook').first().json.body.message.text,
         ai_model: 'claude-haiku-4.5',
         ai_confidence, ai_reasoning, needs_review,
         external_id: 'telegram_' + $('Webhook').first().json.body.update_id,
         created_by: profile_id
       }
       Si 409 (duplicado por external_id): saltar al reply.
   
   11. HTTP "Insert Memory User":
       POST /rest/v1/agent_memory
       Body: { household_id, profile_id, role: 'user',
               content: raw_input }
   
   12. HTTP "Insert Memory Assistant":
       POST /rest/v1/agent_memory
       Body: { household_id, profile_id, role: 'assistant',
               content: <reply_text>,
               metadata: { ai_confidence, category_slug } }
   
   13. Telegram "Send Reply":
       Texto:
       Si needs_review:
         "🤔 Lo registré pero no estoy 100% seguro. Revisalo en
          {{$env.APP_URL}}/movimientos?review=true"
       Si confidence > 0.85:
         "✅ Anotado: {concept} — ${amount} ({categoria})"
       Si entre 0.6-0.85:
         "📝 Anotado: {concept} — ${amount} ({categoria}). Si está mal,
          editalo en {{$env.APP_URL}}/movimientos"

3. Variables de entorno en n8n:
   SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENROUTER_API_KEY, APP_URL
   (los dos primeros ya configurados como credenciales, los otros agregar)

4. Activar el workflow nuevo en n8n. NO desactivar el viejo todavía.

5. Configurar el webhook en Telegram para que apunte al nuevo:
   curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=<n8n_url>/webhook/saldito-bot-v2

6. PROBAR mandando 5 mensajes desde el celular:
   a) "café 1500"
   b) "40k del coto"
   c) "alquiler 505000"
   d) "monotributo 124k"
   e) "pagué algo el lunes" (debe marcar needs_review)

7. Verificar en Supabase Studio que las 5 transacciones aparecen con
   external_id correcto y ai_confidence apropiado.

8. Commit el JSON del workflow:
   "feat(n8n): nuevo workflow Telegram → Supabase con prompt dinámico"

VERIFICACIÓN:
- 5 transacciones en Supabase.
- Mensaje (e) tiene needs_review=true.
- agent_memory tiene 10 filas (5 user + 5 assistant).
- Mandar el MISMO mensaje 2 veces (mismo update_id) → no debe duplicar.

CIERRE: /session-end 2
```

## Siguiente: SESSION_3.md
