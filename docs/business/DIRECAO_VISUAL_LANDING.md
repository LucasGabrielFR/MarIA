# MarIA — Direção de arte da Landing

## Revisão visual de 23 de outubro de 2026

A primeira implementação visual da versão 1.51.0 foi rejeitada pelo responsável: os prints ficaram com aparência de anexos, o destaque inicial vazava e as referências não se traduziam em uma apresentação de produto atraente. A revisão 1.51.1 preserva a narrativa institucional e refaz a apresentação de ponta a ponta.

## Como as referências foram aplicadas

| Referência | Aplicação na MarIA |
| --- | --- |
| [Prisma Creative Studio](https://motionsites.ai/?prompt=prisma-landing) | Escala tipográfica, fotografia com atmosfera e contraste de ritmo entre abertura, narrativa e apresentação dos recursos. A referência foi reconsultada visualmente no navegador. |
| Digital Experiences, selecionada na [biblioteca Motion Sites](https://motionsites.ai/) | Apresentar funcionalidades como cenas de produto com profundidade e recortes legíveis, em vez de telas completas pequenas. |
| Modern Agency, selecionada na [biblioteca Motion Sites](https://motionsites.ai/) | Composição arejada, hierarquia clara e uma linguagem consistente também em planos, FAQ e rodapé. |
| Glow Features, na [biblioteca Motion Sites](https://motionsites.ai/) | Vitrine de recursos com uma composição própria para cada função; seleção manual entre Liturgia, Terço e Novenas. |

As referências orientam composição e movimento. Textos, marca, fotos e layouts não foram copiados dos modelos. A MarIA mantém identidade mariana: azul profundo, marfim, ouro discreto e referência arquitetônica católica, sem estética cósmica.

## Sistema visual

- **Tipografia:** Cormorant Garamond para títulos e acentos editoriais; Plus Jakarta Sans para navegação, leitura e interface. Fontes servidas pelo próprio build Next.js.
- **Bases:** marfim `#F8F7F3`, azul profundo `#071D37`, azul mariano `#0047AB`; ouro `#B18C40` como detalhe. Os tons de texto consideram contraste contra a superfície.
- **Composições:** cenas de conversa, agenda e entrega WhatsApp recriadas em HTML/CSS, a partir de recursos e conteúdo dos prints enviados. Elas são ilustrações promocionais do produto, não telas operacionais ou controles conectados à conta do visitante.
- **Fotografia:** fundo arquitetônico sacro gerado para a marca, sem representar uma igreja ou local real específico. Atua como atmosfera decorativa.
- **Movimento:** entrada suave por rolagem, pequenas mudanças de perspectiva em hover e transição ao selecionar uma prática devocional. Sem troca automática de texto ou carrossel. Movimento reduzido desativa as animações.
- **Mobile:** composições reorganizadas em uma coluna, menu expansível, áreas de toque e títulos redimensionados. A etiqueta de horário do Plano de Vida recebe espaço próprio para não ocultar a última prática.

## Base das artes de produto

Os prints enviados pelo responsável continuam preservados em `landing/public/art/`. Conversa, rotina e entrega usam composições nativas. Após aprovação da direção visual geral, os detalhes de Liturgia, Terço e Novenas passaram a usar as imagens originais em janelas de recurso, mantendo o desenho real do app. Não há galeria de prints inteiros nem legenda “captura real”.

- Conversa: pergunta e resposta sobre perdão sincero presentes na captura do chat mobile.
- Rotina: Oferecimento da Manhã, Liturgia & Evangelho, Angelus e Santo Terço, com horários e opções de lembrete presentes no Plano de Vida.
- Palavra: recorte da tela de Liturgia, com abas e início do Evangelho de Lc 12,54–59.
- Terço: recorte original do primeiro Mistério Doloroso, sexta Ave-Maria, contas e oração; sem substituir as contas horizontais por um círculo decorativo.
- Novena: cartão original de São Judas Tadeu na Home, com datas e opção Iniciar Novena; sem inventar uma tela de acompanhamento ou progresso.
- WhatsApp: entrega do lembrete do Terço, como na captura enviada, sem dados pessoais e com gestão apresentada no aplicativo.

## Lojas e disponibilidade

O aplicativo ainda não foi publicado. Os espaços das lojas exibem “Em breve”, sem link de download, até que o responsável forneça as URLs reais. Configuração: `landing/src/app/store-links.ts`. Não usar URLs genéricas de lojas nem `#` como destino. Após cadastrar uma URL e reconstruir o Docker, apenas aquela loja passa a indicar disponibilidade.

Artes oficiais, sem redesenho de marcas:

- Apple: [Marketing Resources and Identity Guidelines](https://developer.apple.com/app-store/marketing/guidelines/), asset `https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg`.
- Google: [Partner Marketing Hub](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/), badge pt-BR em `https://play.google.com/intl/en_us/badges/static/images/badges/pt-br_badge_web_generic.png`.

Revisar a elegibilidade e as diretrizes de uso dos badges na publicação. Não anunciar disponibilidade ou pré-venda antes de a listagem correspondente estar ativa.

## Arte gerada

- **Ferramenta:** geração de imagem integrada (`image_gen`), sem CLI ou chave API externa.
- **Arquivo do projeto:** `landing/public/art/sanctuary-arch.webp`.
- **Formato:** 1536 × 1024 px, WebP otimizado, aproximadamente 151 KiB.
- **Uso:** fundo decorativo da cena inicial; composição final com texto e recursos é feita no HTML/CSS.

### Prompt final

```text
Use case: photorealistic-natural. Asset type: atmospheric hero backdrop for MarIA, a Catholic spiritual companion website. Create a sophisticated editorial architectural photograph, wide landscape 3:2 composition: a serene limestone cloister with a tall softly pointed sacred arch centered toward the right, layered stone arch recesses with fine carved edges, a glimpse of deep Marian-blue painted wall inside the recess, gentle morning sunlight entering from upper left and grazing ivory limestone, subtle warm brass tones only in light. Tactile limestone, authentic monastery atmosphere, timeless Catholic sacred architecture, contemporary luxury art direction, quiet, luminous, reverent. Left third has calm darker-blue architectural shadow and low detail so HTML product illustrations can be composed over it; right arch remains beautifully visible. Restrained palette ivory, warm stone, deep Marian navy #001B44, antique gold. No people, no statues, no apparitions, no text, no lettering, no logos, no phones, no interface, no stars or cosmic motifs, no fantasy, no neon, no glossy plastic. Natural photographic realism with rich material detail and clear depth, not a 3D UI mockup.
```

## Verificação

Verificar a página servida pelo Docker no gateway `http://localhost:8081/`, incluindo larguras de 320, 390, 768, 1024 e 1440 px. Conferir ausência de rolagem horizontal, limites da cena inicial, imagens carregadas, vitrine interativa, menu, FAQ, ciclos dos planos e foco do modal. Testes de checkout devem interceptar a requisição para não criar uma cobrança real. O relatório e as capturas da sessão ficam na pasta de artefatos local do Codex.
