/**
 * Saldito — Importador del Sheet viejo (one-shot, Sesión 1)
 *
 * Lee context/data.csv (export del Google Sheet "Finanzas LAUFAB"),
 * normaliza categorías drifteadas, detecta duplicados, e inserta en Supabase
 * con source='import'.
 *
 * Uso: pnpm tsx scripts/import-from-sheet.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const HOUSEHOLD_ID = '00000000-0000-0000-0000-000000000001';
const CSV_PATH = 'context/data.csv';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeo de categorías drifteadas → slug normalizado
const CATEGORY_MAP: Record<string, string> = {
  'super/almacen|alimentación': 'alimentacion-supermercado',
  'comida|alimentación': 'alimentacion-supermercado',
  'cariceria|alimentación': 'alimentacion-carniceria',
  'carniceria|alimentación': 'alimentacion-carniceria',
  'verduleria|alimentación': 'alimentacion-verduleria',
  'cafeteria|alimentación': 'alimentacion-salidas-cafeteria',
  'restaurant|alimentación': 'alimentacion-salidas-restaurant',
  'delivery|alimentación': 'alimentacion-delivery',
  'combustible|transporte': 'transporte-combustible',
  'sube|transporte': 'transporte-sube',
  'uber|transporte': 'transporte-uber',
  'estacionamiento|transporte': 'transporte-estacionamiento',
  'mantenimiento|transporte': 'transporte-mantenimiento',
  'peaje|transporte': 'transporte-peajes',
  'alquiler|vivienda y servicios': 'vivienda-alquiler',
  'expensas|vivienda y servicios': 'vivienda-expensas',
  'luz|vivienda y servicios': 'vivienda-luz',
  'gas|vivienda y servicios': 'vivienda-gas',
  'internet|vivienda y servicios': 'vivienda-internet',
  'agua|vivienda y servicios': 'vivienda-agua',
  'mantenimiento|vivienda y servicios': 'vivienda-mantenimiento',
  'servicios|vivienda y servicios': 'vivienda-internet',
  'monotributo|gastos operativos': 'gastos-operativos-monotributo',
  'pago de impuestos|gastos operativos': 'gastos-operativos-monotributo',
  'impuestos|gastos operativos': 'gastos-operativos-impuestos',
  'servicios ia|gastos operativos': 'gastos-operativos-servicios-ia',
  'suscripciones digitales|gastos operativos': 'gastos-operativos-suscripciones-digitales',
  'anuncios|gastos operativos': 'gastos-operativos-anuncios',
  'marketing|gastos operativos': 'gastos-operativos-anuncios',
  'materiales|gastos operativos': 'gastos-operativos-materiales',
  'empleados|gastos operativos': 'gastos-operativos-empleados',
  'salud|estilo de vida': 'estilo-vida-salud',
  'gimnasio|estilo de vida': 'estilo-vida-gimnasio',
  'ropa|estilo de vida': 'estilo-vida-ropa',
  'regalos|estilo de vida': 'estilo-vida-regalos',
  'hobbies|estilo de vida': 'estilo-vida-hobbies',
  'sueldo|finanzas y futuro': 'finanzas-y-futuro-sueldo',
  'honorarios|finanzas y futuro': 'finanzas-y-futuro-honorarios',
  'reembolso|finanzas y futuro': 'finanzas-y-futuro-reembolso',
  'venta|finanzas y futuro': 'finanzas-y-futuro-venta',
  'ahorro|finanzas y futuro': 'finanzas-y-futuro-ahorro',
  'inversion|finanzas y futuro': 'finanzas-y-futuro-inversion',
  'capital inicial|finanzas y futuro': 'finanzas-y-futuro-ahorro',
};

function normalizeKey(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function parseImporte(val: string): number {
  if (!val) return 0;
  const clean = String(val).replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const m = val.trim().match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4] || '12'), parseInt(m[5] || '0'), parseInt(m[6] || '0'));
}

async function main() {
  console.log('🌱 Saldito — Importador del Sheet viejo\n');

  const raw = readFileSync(CSV_PATH, 'utf-8');
  const rows: any[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  console.log(`📄 ${rows.length} filas leídas del CSV`);

  const { data: profiles } = await supabase.from('profiles').select('id, display_name').eq('household_id', HOUSEHOLD_ID);
  const { data: categories } = await supabase.from('categories').select('id, slug').eq('household_id', HOUSEHOLD_ID);
  const { data: accounts } = await supabase.from('accounts').select('id, name').eq('household_id', HOUSEHOLD_ID);

  const profileByName = new Map(profiles!.map(p => [p.display_name, p.id]));
  const catBySlug = new Map(categories!.map(c => [c.slug, c.id]));
  const defaultAccountId = accounts!.find(a => a.name === 'Efectivo')?.id;

  const txs: any[] = [];
  const skipped: string[] = [];
  const unmatchedCategories = new Set<string>();
  let dupSkipped = 0;

  for (const row of rows) {
    const date = parseDate(row['ID-TIME']);
    const amount = parseImporte(row['Importe']);
    const personName = row['Persona']?.trim();
    const tipo = row['Tipo']?.trim().toLowerCase();
    const cat = row['Categoría'] || row['Categoria'] || '';
    const subcat = row['Subcat'] || '';
    const concept = row['Concepto']?.trim() || 'Movimiento sin concepto';

    if (!date || amount <= 0) {
      skipped.push(`${date}|${amount}|${concept}`);
      continue;
    }

    const profileId = profileByName.get(personName);
    if (!profileId) {
      console.warn(`⚠️  Persona desconocida: ${personName}`);
      continue;
    }

    const key = `${normalizeKey(subcat || cat)}|${normalizeKey(cat)}`;
    let slug = CATEGORY_MAP[key];

    if (!slug) {
      for (const [k, v] of Object.entries(CATEGORY_MAP)) {
        if (key.includes(k.split('|')[0])) {
          slug = v;
          break;
        }
      }
    }

    let categoryId: string | null = null;
    if (slug && catBySlug.has(slug)) {
      categoryId = catBySlug.get(slug)!;
    } else {
      unmatchedCategories.add(`${cat} / ${subcat}`);
    }

    txs.push({
      household_id: HOUSEHOLD_ID,
      profile_id: profileId,
      category_id: categoryId,
      account_id: defaultAccountId,
      occurred_at: date.toISOString(),
      amount,
      currency: 'ARS',
      type: tipo === 'ingreso' ? 'ingreso' : 'egreso',
      is_business: cat?.toLowerCase().includes('operativ') ?? false,
      concept,
      notes: row['Notas']?.trim() || null,
      payment_method: row['Medio']?.trim() || row['Medio ']?.trim() || null,
      source: 'import',
      raw_input: `[Sheet] ${concept} ${row['Notas'] || ''}`.trim(),
      ai_confidence: null,
      needs_review: !categoryId,
      external_id: `sheet_${date.toISOString()}_${amount}_${profileId}`,
    });
  }

  console.log(`✅ ${txs.length} transacciones listas`);
  console.log(`⏭️  ${skipped.length} filas saltadas (datos inválidos)`);
  if (unmatchedCategories.size > 0) {
    console.warn(`\n⚠️  Categorías sin match (importadas con needs_review=true):`);
    unmatchedCategories.forEach(c => console.warn(`   - ${c}`));
  }

  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < txs.length; i += BATCH) {
    const batch = txs.slice(i, i + BATCH);
    const { error, data } = await supabase.from('transactions').upsert(batch, {
      onConflict: 'external_id',
      ignoreDuplicates: true,
    }).select('id');

    if (error) {
      console.error(`❌ Error batch ${i}:`, error.message);
      continue;
    }
    inserted += data?.length || 0;
    dupSkipped += batch.length - (data?.length || 0);
    process.stdout.write(`\r📥 Insertando... ${inserted}/${txs.length}`);
  }

  console.log('\n');
  console.log('─────────────────────────────────────');
  console.log(`✅ Insertadas: ${inserted}`);
  console.log(`⏭️  Duplicadas saltadas: ${dupSkipped}`);
  console.log(`⚠️  Saltadas por datos inválidos: ${skipped.length}`);
  console.log(`📋 Categorías sin match: ${unmatchedCategories.size}`);
  console.log('─────────────────────────────────────');
  console.log('\n👉 Próximo paso: revisá las transacciones con needs_review=true en /movimientos');
}

main().catch(e => {
  console.error('💥 Error fatal:', e);
  process.exit(1);
});
