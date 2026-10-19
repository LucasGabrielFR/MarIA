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

const termsOfUse = `# Termos de Uso da MarIA

Bem-vindo à **MarIA**, uma assistente virtual de inteligência artificial voltada ao acolhimento e suporte pastoral católico. Ao utilizar nossos serviços através do WhatsApp ou de nossas plataformas web, você concorda com estes Termos de Uso. Por favor, leia-os com atenção espiritual e responsabilidade civil.

## 1. Natureza do Serviço e Caráter Devocional

A **MarIA** é um serviço de inteligência artificial generativa projetado para fornecer companhia espiritual, reflexões litúrgicas diárias, contemplações do Santo Terço e respostas fundamentadas na doutrina e no Magistério da Igreja Católica Apostólica Romana.

- **Apoio Devocional:** O conteúdo gerado pela MarIA possui caráter estritamente educativo, de devoção pessoal e reflexão interior.
- **Não Substituição Sacramental:** Esta inteligência artificial **NÃO substitui nenhum sacramento** da Igreja Católica (como a Confissão/Reconciliação, Unção dos Enfermos ou a Sagrada Eucaristia) nem o aconselhamento pastoral e a direção espiritual fornecidos por um sacerdote humano ou autoridade eclesiástica legítima.
- **Doutrina Católica:** As respostas e interpretações são baseadas em fontes teológicas de referência (como o Catecismo da Igreja Católica), mas devem ser interpretadas como ferramentas auxiliares para a fé, não como pronunciamentos oficiais da Igreja.

## 2. Planos, Cobrança e Gestão de Assinaturas

O acesso à MarIA é oferecido por meio de planos de assinatura contratados por via digital.

- **Planos Disponíveis:** O serviço dispõe de limites de mensagens que variam conforme o plano contratado (Básico ou Premium). O consumo de conteúdos utilitários estáticos (como a Liturgia Diária e o Santo do Dia gerados no cache) não desconta da franquia de mensagens contratada pelo fiel.
- **Gateway de Pagamento:** Todas as transações financeiras, cobranças e recorrências (mensais ou anuais) são processadas com segurança através do nosso gateway de pagamento parceiro **Asaas**.
- **Gestão de Assinatura:** O usuário pode gerenciar sua assinatura de forma direta através da área logada "Minha Conta", onde é possível solicitar o cancelamento da cobrança recorrente a qualquer momento.
- **Cancelamento e Upgrade:** Em caso de cancelamento, a conta permanecerá ativa e com acesso aos recursos contratados até o final do ciclo já pago. O upgrade de planos cancela automaticamente cobranças anteriores a fim de evitar duplicidade financeira (*double-billing*).

## 3. Diretrizes de Uso Aceitável e Segurança

Buscamos proporcionar um ambiente de acolhimento espiritual fraterno e seguro para todos os fiéis.

- **Uso Pessoal:** O acesso ao serviço é de uso pessoal e intransferível do titular do número de WhatsApp ou conta cadastrada.
- **Proibição de Automação:** É expressamente proibida a utilização de scripts, robôs, scrapers ou qualquer outro mecanismo de automação externa para interagir com o chat da MarIA ou extrair dados em massa de nossas plataformas.
- **Respeito e Urbanidade:** O fiel compromete-se a interagir com a MarIA com o devido respeito. Mensagens abusivas, profanas, caluniosas ou ofensivas contra a fé católica ou a moral cristã violam estes termos.
- **Segurança da Informação:** A MarIA dispõe de algoritmos de detecção para proteger a infraestrutura contra intenções maliciosas ou pedidos de dados sensíveis do sistema (chaves, tokens ou segredos). Tentativas de burlar as restrições operacionais da IA resultarão em bloqueio imediato do serviço.

## 4. Privacidade, Tratamento de Dados e Confidencialidade

Respeitamos profundamente a privacidade de sua jornada de fé e a segurança de suas informações, atuando em conformidade com a LGPD (Lei Geral de Proteção de Dados).

- **Contexto Pastoral e Personalização:** O sistema processa e armazena o histórico das conversas e os dados do contexto pastoral fornecidos pelo próprio fiel para oferecer uma conversação empática, personalizada e de alta qualidade teológica.
- **Segredo e Confidencialidade:** As conversas e reflexões trocadas com a MarIA são tratadas com sigilo absoluto, sob proteção de segurança da informação em nível tecnológico e respeito pastoral em nível ético.
- **Direito à Exclusão:** O fiel tem o direito de solicitar a qualquer momento a exclusão total do seu histórico de conversas e perfil pastoral de nosso banco de dados.
- **Canal de Contato:** Para exercer o direito de exclusão ou tirar dúvidas sobre o tratamento de seus dados de faturamento ou de conversa, o usuário deve entrar em contato diretamente com o nosso canal oficial de suporte pelo e-mail: **maria@acutistech.com.br**.

## 5. Disposições Finais

Estes termos podem ser atualizados periodicamente para refletir melhorias no serviço ou adequações legais. A data da última atualização estará sempre indicada no topo da página de termos no nosso site oficial. O uso continuado do serviço após a publicação de novos termos constitui aceitação tácita das alterações.`;

async function run() {
  const { error } = await supabase.from('system_settings').upsert(
    {
      key: 'terms_of_use',
      value: termsOfUse,
      description: 'Termos de Uso oficiais da aplicação MarIA',
      updated_at: new Date()
    },
    { onConflict: 'key' }
  );

  if (error) {
    console.error('Failed to upsert terms_of_use:', error.message);
    process.exit(1);
  } else {
    console.log('Successfully seeded terms_of_use in system_settings.');
  }
}

run();
