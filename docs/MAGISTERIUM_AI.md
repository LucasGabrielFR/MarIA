# Guia de Integração Magisterium AI - MarIA

Este documento descreve como o projeto MarIA se integra ao Magisterium AI para fornecer respostas teológicas precisas e fundamentadas no Magistério da Igreja.

## 🚀 Visão Geral das Soluções

O Magisterium AI oferece quatro formas principais de integração:

| Solução | Endpoint | Uso no MarIA | Descrição |
| :--- | :--- | :--- | :--- |
| **Chat API** | `/v1/chat/completions` | **Ativo** | Retorna respostas completas, explicativas e com citações. Ideal para a MarIA "re-processar" a resposta. |
| **Search API** | `/v1/search` | Planejado | Retorna apenas trechos de documentos (RAG). Ideal para controle total da voz da IA. |
| **A2A** | JSON-RPC | Experimental | Agent-to-Agent. Permite que IAs colaborem de forma estruturada. |
| **MCP** | `https://mcp...` | N/A | Protocolo padrão para conectar o Magisterium como ferramenta de outros modelos. |

---

## 🛠️ Configuração Atual (Chat API)

Atualmente, a MarIA utiliza a **Chat API** devido à sua capacidade de entregar respostas já contextualizadas com citações do Catecismo, Encíclicas e da Bíblia.

### Variáveis de Ambiente (`.env`)
```env
MAGISTERIUM_API_URL=https://api.magisterium.com
MAGISTERIUM_API_KEY=sua_chave_aqui
```

### Implementação Técnica
A lógica está centralizada no `MagisteriumService` (`backend/src/ai/magisterium.service.ts`).

1. **Input:** Mensagem do fiel (Ex: "O que a Igreja diz sobre o jejum?").
2. **Processamento:** O serviço chama o Magisterium AI com `temperature: 0.1` e modelo `magisterium-expert`.
3. **Output:** Texto técnico fundamentado.

---

## 🤱 Fluxo da Persona (Nossa Senhora)

O diferencial da MarIA é não apenas entregar a resposta do Magisterium, mas transformá-la através da sua persona maternal.

**Prompt de Tratamento:**
Quando a intenção é `THEOLOGY`, o `AiService` utiliza a resposta do Magisterium como contexto:
> "Você recebeu este conteúdo oficial: {magisterium_response}. Agora, responda como Nossa Senhora, com doçura e acolhimento, garantindo que as citações e a verdade da Igreja sejam mantidas."

---

## 📚 Documentação Oficial
- [Documentação Completa](https://www.magisterium.com/pt/developers/docs)
- [Referência da Chat API](https://www.magisterium.com/pt/developers/docs/chat)
- [Referência da Search API](https://www.magisterium.com/pt/developers/docs/search)

---
*Documento atualizado em: 08/05/2026*
