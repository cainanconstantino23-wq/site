# Painel de prospecção: funil, próximo passo, pesquisa, resposta e resumo

Data: 17/11/2026. Aprovado pelo Cainan no chat.

## Por quê

Ideias tiradas da varredura do folk CRM (e do RD Station), aplicadas ao `painel.html` sem custo nenhum. O Cainan prospecta de forma ativa (vai atrás da empresa); o painel precisa mostrar em que pé está cada lead, o que fazer hoje e ajudar a escrever pesquisa e respostas.

## Restrições

- Custo zero: nenhuma API paga, nenhum serviço novo.
- Dados de cliente não vão para serviços novos.
- O funil está em uso (41 contatados, 1 respondeu, 1 lembrete, 1 sem interesse): no banco, só **adicionar** colunas. Nada é renomeado ou apagado.
- Regras de texto do Cainan valem nos pedidos para a IA: não falar de valor nem de pacote, não dizer que filma em um dia; o pedido é visitar o site.
- `painel.html` é público no repositório: nenhum dado de lead no código; tudo vem do Supabase depois do login.

## Abordagens consideradas

- **A. Botão que monta o pedido para o Claude** (copia o prompt e abre claude.ai; o Cainan cola o resultado de volta). Grátis, melhor qualidade, manual.
- **B. Gemini gratuito no Apps Script.** Automático, mas exige chave, tem limite e o plano grátis pode usar os dados.
- **C. Regras sem IA.** Automático e grátis, não "pensa".

**Escolhida: A + C.** Resumo por regras (C); pesquisa e sugestão de resposta pelo botão do Claude (A).

## Desenho

1. **Funil em colunas** — tela Acompanhamento: arrastar cartão entre colunas (desktop); no celular continua o seletor. Ao ir para "Sem interesse", pedir o motivo: sem orçamento, já tem filmmaker, não respondeu, outro. Coluna nova `leads.motivo_perda text`.
2. **Próximo passo** — na ficha: texto + data (`leads.proximo text`, `leads.proximo_em date`). Tela inicial ganha a seção **Para hoje** (vencidos e de hoje) acima da fila.
3. **Pesquisar empresa** — botão na ficha monta o prompt (empresa, área, cidade, site, Instagram, "sobre", observação, regras), copia e abre `https://claude.ai/new`. Campo **Pesquisa** (`leads.pesquisa text`) recebe o resultado colado.
4. **Sugerir resposta** — aparece com situação Respondeu ou Reunião. Prompt inclui histórico, anotações, pesquisa e o texto que o cliente mandou (`leads.resposta text`). O robô (`robo-painel.gs`) passa a gravar o texto da última resposta quando detecta uma; o Cainan também pode colar à mão. Exige recolar o robô no Apps Script uma vez.
5. **Resumo** — linha no topo da ficha, gerada do histórico (primeiro contato, lembretes enviados, resposta, próximo passo).

## Fora do escopo

- Valor do negócio (ele não fala de valor).
- Qualquer IA automática ou paga.
- Rastreamento de visita ao site (fica para depois).

## Para o construtor decidir

Visual dos novos campos seguindo o estilo existente do painel; texto exato dos prompts; como o drag-and-drop é feito (HTML5 nativo, sem biblioteca).
