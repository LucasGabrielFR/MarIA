import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const rosaryGuideContent = `**Roteiro do Santo Terço:**

1. **Sinal da Cruz:** Em nome do Pai, do Filho e do Espírito Santo. Amém.
2. **Oferecimento:** Divino Jesus, nós Vos oferecemos este terço que vamos rezar, meditando nos mistérios da nossa Redenção.
3. **Creio:** Creio em Deus Pai Todo-Poderoso...
4. **Pai Nosso** (pelo Santo Padre).
5. **Três Ave Marias** (pela fé, esperança e caridade).
6. **Glória ao Pai...**
7. **Para cada mistério:**
   - Enuncia-se o Mistério.
   - Reza-se 1 Pai Nosso.
   - Reza-se 10 Ave Marias.
   - Reza-se 1 Glória ao Pai.
   - Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno...
8. **Agradecimento e Salve Rainha.**`;

  // Insert rosary_guide
  await supabase.from('ai_prompts').upsert({
    key: 'rosary_guide',
    description: 'Roteiro fixo passo a passo de como rezar o terço. Enviado pela IA sempre que o usuário pedir instruções ou o roteiro.',
    content: rosaryGuideContent,
    is_active: true
  }, { onConflict: 'key' });

  // Update intent_rosary
  const { data: intentRosary } = await supabase.from('ai_prompts').select('content').eq('key', 'intent_rosary').single();
  if (intentRosary) {
    if (!intentRosary.content.includes('{{rosary_guide}}')) {
      const updatedContent = intentRosary.content + `\n\nIMPORTANTE: Se o usuário pedir o roteiro, o passo a passo ou instruções de COMO rezar o terço, inclua o texto do roteiro a seguir EXATAMENTE como está antes ou depois dos mistérios.\n\nROTEIRO FIXO:\n{{rosary_guide}}`;
      await supabase.from('ai_prompts').update({ content: updatedContent }).eq('key', 'intent_rosary');
    }
  }

  console.log('Seed completed successfully.');
}

run().catch(console.error);
