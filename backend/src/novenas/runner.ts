import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { INITIAL_NOVENAS } from './initial-novenas-data';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log(`Iniciando semeadura de ${INITIAL_NOVENAS.length} novenas no Supabase...`);

  for (const n of INITIAL_NOVENAS) {
    console.log(`Processando: "${n.title}" (${n.slug})...`);

    // 1. Upsert da Novena
    const { data: novena, error: novenaErr } = await supabase
      .from('novenas')
      .upsert(
        {
          slug: n.slug,
          title: n.title,
          subtitle: n.subtitle,
          description: n.description,
          category: n.category,
          tags: n.tags,
          feast_date: n.feast_date,
          ideal_start_date: n.ideal_start_date,
          image_url: n.image_url,
          banner_color: n.banner_color,
          is_published: n.is_published ?? true,
          is_featured: n.is_featured ?? false,
          display_order: n.display_order ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();

    if (novenaErr || !novena) {
      console.error(`Erro ao inserir novena ${n.title}:`, novenaErr?.message);
      continue;
    }

    console.log(`Novena salva com ID: ${novena.id}. Inserindo os ${n.days?.length || 0} dias...`);

    // 2. Inserir dias
    if (n.days && n.days.length > 0) {
      for (const d of n.days) {
        const { error: dayErr } = await supabase.from('novena_days').upsert(
          {
            novena_id: novena.id,
            day_number: d.day_number,
            title: d.title,
            opening_prayer: d.opening_prayer,
            scripture_reading: d.scripture_reading,
            meditation: d.meditation,
            daily_prayer: d.daily_prayer,
            intentions_prompt: d.intentions_prompt,
            concluding_prayer: d.concluding_prayer,
          },
          { onConflict: 'novena_id,day_number' },
        );

        if (dayErr) {
          console.error(`  Erro no dia ${d.day_number}:`, dayErr.message);
        }
      }
      console.log(`  Todos os 9 dias de "${n.title}" foram salvos com sucesso!`);
    }
  }

  console.log('Semeadura concluída com sucesso!');
}

runSeed().catch((err) => {
  console.error('Erro na execução da semeadura:', err);
  process.exit(1);
});
