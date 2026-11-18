# Painel reorganizado: Hoje, Leads, página do cliente, Funil, Resultados

Data: 18/11/2026. Aprovado pelo Cainan no chat ("ok seguir").

## Por quê

O Cainan achou o painel genérico e desorganizado. Pesquisa em Attio, Close, Pipedrive, Apollo, lemlist e Streak mostrou quatro padrões que faltam: caixa de entrada única de ações, página do cliente em duas colunas com linha do tempo, lista em tabela com visões salvas, e tela de resultados.

## Desenho

- **Navegação:** Hoje · Leads · Funil · Resultados · Ajustes, mais busca rápida (⌘K / Ctrl+K).
- **Hoje:** abas Agora / Próximos / Feito. Agora agrupa: Responderam (status Respondeu sem próximo passo futuro), Para aprovar (e-mails pendentes), Enviar à mão (WhatsApp/Instagram pendentes), Próximos passos (vencidos e de hoje), Com erro. Ação no próprio item. Próximos: passos dos próximos 14 dias e aprovadas esperando o robô. Feito: enviadas hoje.
- **Leads:** tabela (empresa, área, etapa, último contato, próximo passo, nota) com visões: Todos, Novos, Esperando resposta, Responderam, Fechados, Perdidos; filtro de área, busca e ordem.
- **Página do cliente** (tela inteira, rota `#lead/<id>`): coluna principal com bloco Foco (o que pede ação), linha do tempo (envios com texto completo e link do Gmail, mensagens na fila, resposta do cliente, cadastro) e "Nova mensagem"; coluna lateral com etapa, próximo passo (com "Feito"), contatos, pesquisa, frase e anotações.
- **Funil:** quadro arrastável atual, com contagem e taxa por coluna.
- **Resultados:** funil (total → contatadas → responderam → reunião → fechou), tabela por área, envios e respostas por canal do primeiro contato, motivos de perda.
- **Ajustes:** robô, token, áreas, adicionar empresa, CSV.

## Restrições

- Sem mudanças no banco. Visual areia e azul mantido. Nada publicado sem OK.
- "Feito" no próximo passo limpa `proximo`/`proximo_em` e registra nas anotações (`DD/MM: feito — <passo>`).
- A abordagem usada em cada envio não é guardada; Resultados por abordagem fica fora.
