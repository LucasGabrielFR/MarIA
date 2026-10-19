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

const privacyPolicy = `# Política de Privacidade da MarIA

Na **MarIA**, compreendemos que a sua jornada de fé e as suas interações de aconselhamento e apoio pastoral são de natureza íntima e sagrada. Estamos profundamente comprometidos em proteger a privacidade, a confidencialidade e a segurança de todos os dados pessoais compartilhados conosco, atuando em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD) e com os princípios da ética e caridade cristã.

Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos suas informações ao interagir com a MarIA no WhatsApp e em nossos ambientes web.

## 1. Informações que Coletamos

Para viabilizar um acolhimento pastoral empático, eficiente e personalizado, processamos apenas as informações estritamente necessárias para a prestação e melhoria dos nossos serviços.

- **Dados de Identificação e Contato:** Coletamos o seu número de telefone (WhatsApp ID), o nome de perfil que você nos informa durante a triagem e o seu endereço de e-mail de faturamento fornecido no checkout.
- **Histórico de Mensagens:** Armazenamos temporariamente o histórico das conversas trocadas no WhatsApp (perguntas, orações, pedidos de conselho) para que a MarIA consiga manter a linha de raciocínio e fornecer respostas contínuas e contextuais.
- **Contexto Pastoral e Memória:** Nosso sistema analisa as interações para gerar resumos de perfil pastoral (expectativas, temas espirituais de interesse e preferências devocionais). Isso ajuda a MarIA a tratá-lo de forma humana, personalizada e acolhedora em futuros diálogos.
- **Dados Financeiros e de Cobrança:** Todas as transações são efetuadas de forma segura e direta por meio do nosso gateway parceiro **Asaas**. A MarIA **NÃO armazena** dados de cartão de crédito em seus servidores; retemos apenas o ID do cliente Asaas, o ID da assinatura e o histórico simplificado de faturas para fins de controle de acesso ao plano Premium.

## 2. Como Utilizamos os Seus Dados

Utilizamos as informações coletadas unicamente com o propósito de edificar e apoiar a sua vida de oração e interação com a Igreja, operando com total transparência tecnológica.

- **Acolhimento e Personalização:** Usamos o histórico e o contexto pastoral para ajustar o tom de voz da IA e sugerir orações, passagens bíblicas e conteúdos litúrgicos que façam sentido para a sua jornada.
- **Gestão do Serviço e Quotas:** Controlamos a volumetria de mensagens para garantir o cumprimento das quotas associadas aos planos Básico e Premium.
- **Suporte Técnico e Correções:** Analisamos logs de erros e telemetria simplificada de consumo de tokens (LLM) para assegurar o funcionamento ininterrupto da aplicação.
- **Comunicação Importante:** Enviamos notificações essenciais de sistema, como códigos de verificação para login sem senha na área "Minha Conta", códigos de ativação pós-compra e avisos amigáveis sobre a expiração de assinaturas.

## 3. Com Quem Compartilhamos Seus Dados

A confidencialidade de sua partilha espiritual é nossa prioridade máxima. Nós **NÃO vendemos, alugamos ou comercializamos** seus dados com terceiros para fins publicitários. O compartilhamento ocorre estritamente para a viabilização técnica do serviço com provedores de infraestrutura de alta confiança:

- **Provedores de Inteligência Artificial:** Enviamos partes anonimizadas das interações para motores cognitivos de ponta (como OpenRouter, OpenAI, Google e Magisterium AI) de forma segura e encriptada, estritamente para o processamento das respostas devocionais.
- **Plataformas de Mensagens e Integrações:** A comunicação de WhatsApp é trafegada com segurança pela API certificada da **Uazapi**.
- **Serviço de Faturamento:** Seus dados cadastrais de faturamento (e-mail, nome, telefone) são compartilhados com o gateway de pagamentos **Asaas** para emissão de faturas e processamento de assinaturas de cartão de crédito.
- **Serviço de E-mail Transacional:** O e-mail de faturamento do cliente é utilizado para o disparo de instruções de resgate e códigos de ativação por meio do nosso serviço integrado de envio de e-mails (\`MailService\`).

## 4. Segurança e Retenção dos Dados

Implementamos rigorosas medidas de segurança de nível corporativo para proteger suas informações contra acessos não autorizados, alteração, divulgação ou destruição.

- **Isolamento de Dados (RLS):** Todo o nosso banco de dados no Supabase utiliza **Row Level Security (RLS)**, garantindo que suas informações fiquem isoladas e blindadas de acessos indevidos.
- **Criptografia:** Todas as conexões e tráfego de dados entre o WhatsApp, nossos servidores e as APIs parceiras são totalmente criptografados (HTTPS/SSL).
- **Tempo de Retenção:** Mantemos seu histórico de conversas ativo para viabilizar a continuidade da assistência pastoral. Você pode, a qualquer momento, solicitar a exclusão definitiva de seus dados.

## 5. Seus Direitos (LGPD) e Exclusão Total

Você é o único proprietário de sua história e de seus dados pessoais. Respeitamos integralmente os seus direitos assegurados pela LGPD:

- **Direito à Exclusão Permanente:** Se você desejar encerrar sua jornada com a MarIA ou simplesmente limpar o seu histórico espiritual, poderá solicitar a **exclusão definitiva de todos os dados** (contexto pastoral, histórico de conversas no banco de dados e detalhes pessoais).
- **Exclusão Rápida:** Ao realizar a exclusão, suas mensagens e preferências são apagadas permanentemente e seu status no banco de dados é alterado para desativado (*disabled*). Caso decida enviar uma nova mensagem no futuro, a MarIA iniciará um novo fluxo de triagem totalmente limpo do zero.
- **Canal Oficial de Privacidade:** Para exercer o seu direito de exclusão, solicitar um relatório de seus dados ou tirar qualquer dúvida relacionada à privacidade, basta enviar um e-mail a partir do e-mail cadastrado na assinatura para: **maria@acutistech.com.br**.

## 6. Alterações nesta Política

Podemos atualizar esta Política de Privacidade de tempos em tempos para refletir avanços técnicos ou conformidades legais. Recomendamos que você visite esta página periodicamente. O uso do serviço WhatsApp ou web da MarIA após qualquer alteração representa a sua concordância com a nova política.`;

async function run() {
  const { error } = await supabase.from('system_settings').upsert(
    {
      key: 'privacy_policy',
      value: privacyPolicy,
      description: 'Política de Privacidade oficial da aplicação MarIA',
      updated_at: new Date()
    },
    { onConflict: 'key' }
  );

  if (error) {
    console.error('Failed to upsert privacy_policy:', error.message);
    process.exit(1);
  } else {
    console.log('Successfully seeded privacy_policy in system_settings.');
  }
}

run();
