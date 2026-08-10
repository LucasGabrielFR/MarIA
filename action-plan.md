# Plano de Ação e Arquitetura - MarIA (Bot WhatsApp)

## 1. Escopo e Persona
**Objetivo:** Criar um assistente virtual no WhatsApp focado em acolhimento espiritual, triagem de fiéis e respostas teológicas baseadas nos documentos da Igreja (Magisterium AI).
**Persona:** Nossa Senhora (postura doce, maternal e acolhedora).

## 2. Arquitetura Escolhida: Híbrida (Opção C)
A arquitetura seguirá a **Opção C**, mantendo a estabilidade, o contexto do chat e o estado da conversa inteiramente sob o controle do **Backend Node.js**.

### Divisão de Responsabilidades:
- **Backend Node.js/TypeScript:** Recebe os webhooks do UAZAPI, gerencia a sessão, o histórico da conversa e executa a lógica de roteamento dinâmico (Function Calling/Tools) com o LLM principal.
- **Planejamento Visual de Fluxos:** Para facilitar a manutenção e configuração, será utilizado um **Flow Builder visual** integrado ao painel administrativo. Isso permitirá estruturar a jornada do usuário (onboarding, mensagens padrões) visualmente sem perder o controle programático.
- **Magisterium AI:** Acionado via código (API) como uma "ferramenta" sempre que o modelo principal detectar uma pergunta complexa ou teológica.
- **n8n (Fase 2 / Futuro):** Será utilizado primariamente como motor assíncrono para agendamentos (CRON jobs) e automação de envio de lembretes espirituais proativos, consultando o banco de dados.

## 3. RoadMap do Produto (MVP vs Futuro)

### MVP (Fase 1)
- **Onboarding/Triagem:** O bot recebe o contato, pergunta o nome e faz o acolhimento espiritual inicial (via Flow Builder + LLM).
- **Chat Fluido:** Conversa guiada pelo **GPT-4o-Mini**, que sustentará o prompt forte da persona maternal.
- **Roteamento Inteligente (Tools):** O LLM identifica quando deve responder diretamente ou quando deve consultar o Magisterium AI para precisão doutrinária.
- **Painel Administrativo:** Visualização do histórico, gestão de instâncias de WhatsApp, estatísticas de uso (Dashboard) e o editor visual de fluxos.

### Visão de Futuro (Fase 2)
- **Lembretes e Propósitos (Via n8n):** Automações de planejamento de vida espiritual (ex: lembretes para rezar o terço).
- **Memória Avançada:** Recuperação de interações passadas ("Como está o seu problema familiar que me contou no mês passado?") via bancos vetoriais.
- **Respostas em Áudio:** Sintetização de voz para saudações especiais.

## 4. Orçamento de IA e Previsão de Gastos (Escalabilidade)

O modelo escolhido como motor central será o **OpenAI GPT-4o-Mini**, que une excelência na execução de tarefas estruturadas (*Function Calling*) com um custo muito baixo.

**Tabela de Preços API Oficial:**
- **Input (Contexto enviado):** $0.150 por 1 Milhão de tokens.
- **Output (Resposta gerada):** $0.600 por 1 Milhão de tokens.

### Projeção Média Mensal por Usuário
Considerando um fiel com a seguinte média de interações no mês:
- Média de **60 a 100 interações/mês**.
- Cada envio repassa o prompt da persona e histórico (aprox. 2.500 tokens por requisição) = ~125.000 tokens de Input/mês.
- As respostas são curtas e focadas no acolhimento (aprox. 150 tokens) = ~7.500 tokens de Output/mês.
- **Custo estimado seguro:** **$0.04 USD por usuário/mês**.

### Escala de Usuários (Previsão de Custo Mensal OpenAI)

| Usuários Ativos / Mês | Custo Estimado (USD) | Custo Estimado (BRL)*  |
|-----------------------|----------------------|------------------------|
| 100                   | $4.00                | R$ 22,00               |
| 1.000                 | $40.00               | R$ 220,00              |
| 5.000                 | $200.00              | R$ 1.100,00            |
| 10.000                | $400.00              | R$ 2.200,00            |
| 100.000               | $4,000.00            | R$ 22.000,00           |
| 1.000.000             | $40,000.00           | R$ 220.000,00          |

*(A conversão para Reais [BRL] foi estimada a R$ 5,50. A tabela cobre **exclusivamente os custos da OpenAI** para a camada de inteligência com o modelo GPT-4o-Mini. Gastos secundários como WhatsApp Cloud/UAZAPI, banco de dados (Supabase) e hospedagem da aplicação devem ser orçados separadamente.)*

## 5. Modelo de Monetização e Precificação

Considerando que os custos diretos com a IA são muito baixos (na faixa de **R$ 0,22 por usuário/mês**) e somando uma margem de segurança para os custos fixos de servidores e banco de dados (estimando um teto de custo variável de no máximo **R$ 0,80 a R$ 1,00 por usuário/mês**), temos uma excelente margem para praticar um preço muito acessível para o público final e ainda gerar alto lucro.

### Proposta de Assinatura (SaaS B2C)
O objetivo é que o valor seja acessível para a grande massa, comparável a uma pequena doação ou um serviço de streaming básico.

- **Plano Mensal:** **R$ 9,90 / mês** (Acesso completo a conversas e tira-dúvidas doutrinárias).
- **Plano Anual:** **R$ 99,00 / ano** (Dois meses de desconto, garante retenção e caixa inicial).

### Simulação de Receita vs Lucro (Considerando Plano de R$ 9,90)

| Usuários Pagantes | Receita Bruta (Mês) | Custos Totais Estimados* | **Lucro Líquido Estimado** |
|-------------------|---------------------|--------------------------|----------------------------|
| 100               | R$ 990,00           | ~ R$ 100,00              | **R$ 890,00**              |
| 1.000             | R$ 9.900,00         | ~ R$ 800,00              | **R$ 9.100,00**            |
| 5.000             | R$ 49.500,00        | ~ R$ 4.000,00            | **R$ 45.500,00**           |
| 10.000            | R$ 99.000,00        | ~ R$ 8.000,00            | **R$ 91.000,00**           |
| 100.000           | R$ 990.000,00       | ~ R$ 80.000,00           | **R$ 910.000,00**          |

*(Custos Totais Estimados englobam a API do LLM, infraestrutura backend e margem para serviços terceiros/gateways de pagamento).*

### Alternativa: Modelo Freemium (Estratégia de Crescimento)
Para impulsionar a viralização do bot de boca a boca nas paróquias:
1. **Tier Gratuito:** O usuário pode falar livremente com Nossa Senhora (limitado a 10 mensagens por dia) apenas para acolhimento básico.
2. **Tier Premium (R$ 9,90/mês):** Mensagens ilimitadas, acesso liberado à API de teologia (Magisterium AI) para tirar dúvidas complexas da fé, e acesso à Fase 2 (Planejamento de Vida Espiritual com lembretes diários ativos do bot).

## 6. Cronograma de Lançamento e Go-To-Market (GTM)

Para que o lançamento seja seguro e o marketing eficiente, o projeto seguirá um planejamento em ondas (fases temporais), mitigando riscos técnicos e financeiros.

### Mês 1: Estruturação e Setup Técnico (Estamos Aqui)
- **Ações:** Aprovação deste plano de ação, estruturação da arquitetura híbrida (Backend + Flow Visual).
- **Entregáveis:** Conexão UAZAPI operante, banco de dados (Supabase) configurado, e o script central de prompt (Persona de Maria) testado no console.

### Mês 2: Desenvolvimento do MVP e Testes Internos (Alpha)
- **Ações:** Programação do roteamento inteligente (*Function Calling* entre o papo pastoral e o Magisterium AI). Criação do Dashboard Administrativo.
- **Entregáveis:** Bot respondendo no WhatsApp em tempo real.
- **Testes Alpha:** Liberação exclusiva para os criadores e um grupo muito restrito (5 a 10 pessoas) para estressar a IA, buscar "alucinações" doutrinárias e calibrar o tom de voz.

### Mês 3: Soft Launch (Beta Local) e Validação de Pagamento
- **Ações:** Lançamento controlado para uma comunidade específica (ex: grupo de jovens da sua paróquia, pastoral ou grupo restrito de WhatsApp). Limite de 100 a 500 usuários.
- **Objetivo de Negócio:** Validar se os usuários veem valor suficiente para converter no modelo de R$ 9,90/mês. Analisar métricas de retenção (quantas pessoas voltam a falar com a IA no dia seguinte).
- **Ajustes:** Refinar os bloqueios de segurança (evitar que a IA responda sobre política ou assuntos seculares).

### Mês 4: Lançamento Oficial (Go-to-Market)
- **Campanhas de Aquisição (Tráfego Pago):** Iniciar campanhas no Facebook e Instagram Ads hiper-segmentadas para o público católico (Interesses como: *Igreja Católica, Terço, Canção Nova, Padre Marcelo Rossi, Papa Francisco*).
- **Conteúdo Viral (Tiktok/Reels):** Criar vídeos curtos com a narrativa: *"Descubra como a inteligência artificial pode te ajudar a estar mais perto da fé todos os dias"*, mostrando trechos borrados de conversas reais de acolhimento.
- **Parcerias (Influenciadores):** Fechar parcerias de permuta ou afiliado com micro-influenciadores católicos para divulgarem o link do WhatsApp do bot. O sistema de afiliados contará com links únicos e dinâmicos para a Landing Page e para o WhatsApp (com mensagens pré-preenchidas configuráveis pelo administrador, disponíveis para cópia no próprio painel do afiliado).

### Mês 5 ao 12: Tração e Fase 2 (Retenção)
- **Engajamento Ativo:** Implementação pesada do n8n para enviar lembretes proativos aos assinantes Premium (ex: "Bom dia filho, não se esqueça do seu propósito de ler o Evangelho hoje"). Isso evita o churn (cancelamento da assinatura).
- **Campanhas Sazonais:** Promoções do Plano Anual (R$ 99,00) em datas fortes (Mês Mariano em Maio, Quaresma, Natal).
- **Escala de Infraestrutura:** Transição para servidores dedicados maiores para suportar a marca de 10.000+ assinantes ativos simultâneos.
