# Configuração do Asaas

Para que a integração do backend da MarIA com o Asaas funcione perfeitamente para gerar cobranças e gerir os planos "Básico" e "Premium" (mensal e anual), você precisará configurar suas credenciais.

## 1. Variáveis de Ambiente no Backend

Abra o arquivo `.env` na pasta `backend/` e adicione a seguinte variável:

```env
ASAAS_API_KEY=sua_chave_de_api_do_asaas_aqui
ASAAS_API_URL=https://sandbox.asaas.com/api/v3 # Use https://api.asaas.com/v3 para produção
```

*Como obter:* No seu painel do Asaas, vá em "Configurações" > "Integração" > "Gerar Chave de API".

## 2. Configurando os Webhooks

O Asaas precisa saber para qual URL avisar quando um pagamento for compensado ou quando uma assinatura for cancelada/deletada.

No painel do Asaas:
1. Vá em **Configurações > Integrações > Webhooks**
2. Ative a URL de Webhook e aponte para: `https://sua-api-de-producao.com/payment/asaas/webhook`
3. Marque os eventos de Assinatura e Pagamentos (especialmente `PAYMENT_CONFIRMED` e `SUBSCRIPTION_CANCELED`).

## 3. Gestão de Planos
A nossa aplicação (`AsaasService`) já cria a Subscription de forma dinâmica na API deles com base nos IDs que o botão de "Assinar" do Frontend envia:
- `planId=basic` e `cycle=monthly` -> R$ 14,90 / mês
- `planId=basic` e `cycle=annual` -> R$ 154,80 / ano
- `planId=premium` e `cycle=monthly` -> R$ 29,90 / mês
- `planId=premium` e `cycle=annual` -> R$ 322,80 / ano

O backend gera o link nesta ordem (conforme [documentação Asaas](https://docs.asaas.com/)):

1. **Link de pagamento recorrente** (`POST /v3/paymentLinks`, `chargeType: RECURRENT`) — página onde o cliente preenche dados e escolhe Pix, cartão ou boleto.
2. **Checkout hospedado** (`POST /v3/checkouts`, `chargeTypes: RECURRENT`) — formulário completo do Asaas Checkout.
3. **Assinatura + fatura** (`POST /v3/subscriptions` + `GET /v3/subscriptions/{id}/payments`) — `invoiceUrl` da primeira cobrança pendente.

Use `ASAAS_API_KEY` (ou `ASAAS_TOKEN`) e `ASAAS_API_URL` no `.env` do backend.
