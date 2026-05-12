# 📊 Análise Financeira e Projeção de Lucros - MarIA

Esta análise estima a viabilidade do projeto considerando os custos de APIs (OpenAI, Magisterium, UAZapi), infraestrutura (Hostgator) e banco de dados (Supabase).

## 1. Estrutura de Custos

### 💵 Câmbio de Referência (USD/BRL): **R$ 4,89**

### 🏗️ Custos Fixos (Mensais)
| Serviço | Plano | Valor (R$) | Observação |
| :--- | :--- | :--- | :--- |
| **Hostgator** | VPS NVMe 4 (1 ano) | R$ 43,89 | Servidor Backend/Frontend |
| **UAZapi** | 1 Dispositivo | R$ 19,00 | WhatsApp Gateway |
| **Supabase** | Free / Pro | R$ 0,00 | R$ 122,25 após 400 usuários |
| **TOTAL FIXO** | | **R$ 62,89** | (Até 400 usuários) |

### 🤖 Custos Variáveis (IA por Mensagem)
Baseado no fluxo: *Router (GPT-4o-mini) + Magisterium Context + Persona Generation (GPT-4o-mini)*.

*   **OpenAI GPT-4o-mini:** ~R$ 0,006 / msg
*   **Magisterium AI:** ~R$ 0,019 / msg (Consultas Teológicas)
*   **Média Ponderada:** **R$ 0,015 por mensagem** (Mistura de casual e teológico)

---

## 2. Perfis de Uso (Mínimo 10 msgs/dia)

| Perfil | Mensagens / Dia | Mensagens / Mês | Custo IA / Mês (R$) |
| :--- | :---: | :---: | :---: |
| **Moderado (Mínimo)** | 10 | 300 | **R$ 4,50** |
| **Frequente** | 30 | 900 | **R$ 13,50** |
| **Estudante/Pesquisador** | 60 | 1800 | **R$ 27,00** |

---

## 3. Simulação de Lucro por Usuário

| Preço de Venda (R$) | Lucro (Uso Moderado) | Lucro (Uso Frequente) | Lucro (Uso Alto) |
| :--- | :--- | :--- | :--- |
| **R$ 6,00** | + R$ 1,50 | **- R$ 7,50** ⚠️ | **- R$ 21,00** ❌ |
| **R$ 10,00** | + R$ 5,50 | **- R$ 3,50** ⚠️ | **- R$ 17,00** ❌ |
| **R$ 15,00** | + R$ 10,50 | + R$ 1,50 | **- R$ 12,00** ❌ |

---

## 4. Projeção de Escala (Cenário R$ 15/mês - Uso Moderado)

| Total Usuários | Receita Bruta | Custos (IA + Fixo) | Lucro Líquido | Margem |
| :--- | :--- | :--- | :--- | :--- |
| **50** | R$ 750,00 | R$ 287,89 | **R$ 462,11** | 61% |
| **100** | R$ 1.500,00 | R$ 512,89 | **R$ 987,11** | 65% |
| **400** | R$ 6.000,00 | R$ 1.862,89 | **R$ 4.137,11** | 69% |
| **1000** | R$ 15.000,00 | R$ 4.807,39* | **R$ 10.192,61** | 67% |

*\*Inclui upgrade do Supabase Pro (R$ 122,25).*

---

## 5. Proposta de Planos (Tiered Pricing)

Esta estrutura garante que os planos de baixo custo sejam sustentáveis através de limites mensais.

| Plano | Valor (R$) | Limite de Msgs / Mês | Custo IA Máx (R$) | Lucro por User | Público Alvo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Semente** | **R$ 6,90** | 150 msgs (~5/dia) | R$ 2,25 | **R$ 4,65** | Uso casual e devocional rápido. |
| **Caminho** | **R$ 14,90** | 500 msgs (~16/dia) | R$ 7,50 | **R$ 7,40** | Fiéis engajados e estudo diário. |
| **Vida** | **R$ 29,90** | 1.500 msgs (~50/dia) | R$ 22,50 | **R$ 7,40** | Seminaristas, catequistas e pesquisadores. |

### 🛠️ Mecanismo de Controle
- **Mensagem de Limite:** Ao atingir 80% do limite, a MarIA envia um aviso maternal: *"Meu filho(a), estamos chegando ao fim do nosso fôlego deste mês. Gostaria de subir um degrau no nosso plano para continuarmos nossa conversa?"*
- **Bloqueio Educado:** Ao atingir 100%, o bot sugere o upgrade para o próximo nível.

---

## 6. Por que o Plano "Semente" de R$ 6,90 é seguro?
Ao limitar a 150 mensagens, você trava o custo variável em R$ 2,25. Mesmo que o usuário use **todo** o limite, você ainda tem uma margem de **67%** para contribuir com os custos fixos (Hostgator/UAZapi).

---

## ⚠️ Alertas e Recomendações (P0)

> [!CAUTION]
> **O Risco do Uso Ilimitado:** Nunca ofereça planos ilimitados por valores abaixo de R$ 50,00, pois um único usuário pesado (bot ou pesquisador) pode consumir centenas de reais em tokens em poucos dias.

> [!IMPORTANT]
> **Estratégia de Conversão:** O plano de R$ 6,90 serve como "isca" (Entry Point). O lucro real e a sustentabilidade da infraestrutura vêm do plano de **R$ 14,90**, que deve ser o seu "Best Seller".
