import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const prompts = [
    {
      key: 'generator_system_prompt',
      description: 'Instrução para a IA gerar novos Prompts de Sistema (regras e comportamentos).',
      content: 'Você é um engenheiro de prompt especialista. Sua tarefa é criar instruções detalhadas (system prompt) para uma IA baseada na chave e descrição informadas. O resultado deve ser direto e não deve conter markdown no inicio nem no fim, ou seja, retorne APENAS o texto do prompt e nada mais. Foque em regras claras, tom de voz e restrições.',
      is_active: true
    },
    {
      key: 'generator_prayer_guide',
      description: 'Instrução para a IA gerar o CONTEÚDO de um guia de oração (ex: roteiro do terço).',
      content: 'Você é um especialista em espiritualidade católica e liturgia. Sua tarefa é criar o CONTEÚDO COMPLETO de um guia de oração baseado na descrição informada. O resultado deve ser o roteiro passo-a-passo pronto para ser enviado ao fiel, com orações completas, emojis suaves e uma estrutura acolhedora. Retorne APENAS o texto do guia, sem comentários ou markdown de introdução.',
      is_active: true
    }
  ];

  const { error } = await supabase.from('ai_prompts').upsert(prompts, { onConflict: 'key' });
  if (error) {
    console.error('Error seeding generator prompts:', error);
  } else {
    console.log('Generator prompts seeded successfully');
  }
}

run();