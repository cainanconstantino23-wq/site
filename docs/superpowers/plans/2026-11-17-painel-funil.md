# Painel: funil, próximo passo, pesquisa, resposta e resumo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao `painel.html` o funil arrastável com motivo da perda, o próximo passo com a seção "Para hoje", os botões que montam pedidos para o Claude (pesquisa e resposta) e o resumo automático de cada lead.

**Architecture:** Lógica pura nova vai para `painel-logica.js` (script clássico, sem dados, carregado pelo `painel.html`), testada com `node --test` via `vm`. A interface continua no script inline do `painel.html`, no mesmo estilo (template strings + delegação de eventos). Banco: só colunas novas em `leads` e a função `robo_resposta` ganha `p_texto` opcional.

**Tech Stack:** HTML/JS puro, Supabase (Postgres + supabase-js 2.45.4), Google Apps Script, Node 24 (`node:test`, `node:vm`) para testes.

**Spec:** `docs/superpowers/specs/2026-11-17-painel-funil-design.md`

## Global Constraints

- Custo zero; nenhum serviço novo; nenhuma chamada de IA a partir do painel.
- Banco: só `add column` / nova versão de função. Nunca renomear, apagar ou alterar dados existentes.
- Nenhum dado de lead em arquivo do repositório. `painel-logica.js` é público.
- Prompts incluem as regras: não falar de valor nem de pacote; não dizer que filma em um dia; o pedido é visitar daimefilmes.com.br.
- Motivos de perda (texto exato): `Sem orçamento`, `Já tem filmmaker`, `Não respondeu`, `Pediu para sair`, `E-mail inválido`, `Outro`.
- Link da IA: `https://claude.ai/new`.
- Trabalho no ramo `feat/painel-funil`. Merge em `main` e publicação só com OK do Cainan.

## Review Focus

- Lead sem site, sem Instagram ou sem "sobre": prompt de pesquisa não pode ter "undefined"/"null"; omite a linha.
- `proximo_em` vazio com `proximo` preenchido (e vice-versa): não aparece em "Para hoje" sem data; nunca quebra.
- Soltar o cartão na mesma coluna ou fora de coluna: nada muda, nada é gravado.
- Mudar para "Sem interesse" e cancelar o motivo: a situação não muda.
- Texto de resposta enorme ou com HTML: guardado cortado em 4000 caracteres e sempre exibido com `esc()`.

---

### Task 1: Banco — colunas novas e `robo_resposta` com texto

**Files:**
- Migration Supabase `painel_funil` (projeto `prrqshhnhvehvyafitax`)

**Interfaces:**
- Produces: `leads.motivo_perda text`, `leads.proximo text`, `leads.proximo_em date`, `leads.pesquisa text`, `leads.resposta text`; `public.robo_resposta(p_token text, p_lead text, p_tipo text, p_texto text default null)`.

- [ ] **Step 1:** Aplicar migration: `alter table public.leads add column if not exists` para as 5 colunas. Recriar `robo_resposta` (drop da assinatura de 3 args + create com 4, `p_texto default null`), mantendo o corpo atual e acrescentando no mesmo `update`: `resposta = coalesce(left(p_texto, 4000), l.resposta)` e `motivo_perda = case p_tipo when 'sair' then 'Pediu para sair' when 'invalido' then 'E-mail inválido' else l.motivo_perda end`. Manter `security definer`, `search_path ''` e os grants atuais (conferir com `\df+`/`pg_proc.proacl` antes e depois).
- [ ] **Step 2: Verificar** com SQL: as 5 colunas existem; `select count(*), status from leads group by 2` igual a antes (41 Contatado, 36 Novo, 1 Respondeu, 1 Lembrete 1, 1 Sem interesse); chamar `robo_resposta('x','y','respondeu')` dá `token inválido` (prova que a chamada antiga de 3 args ainda resolve).
- [ ] **Step 3:** Rodar `get_advisors` (security) e confirmar que nada novo apareceu.

### Task 2: `painel-logica.js` — resumo, "para hoje" e prompts

**Files:**
- Create: `painel-logica.js`
- Create: `tests/painel-logica.test.mjs`
- Modify: `painel.html:278` (carregar `<script src="painel-logica.js"></script>` logo após o supabase-js)

**Interfaces:**
- Produces (funções globais):
  - `resumoLead(lead, enviadas: {etapa:number, canal:string, enviado:string}[], hoje: string 'YYYY-MM-DD') -> string` — partes unidas por ` · `: `Contatada DD/MM por E-mail|WhatsApp|Instagram` (primeira enviada; se não houver e `lead.primeiro`, `Contatada DD/MM`), `lembrete DD/MM` para cada etapa ≥1, `respondeu` se status em Respondeu/Reunião/Fechou, `perdida: <motivo_perda>` se Sem interesse com motivo, `próximo: <proximo>` (+ ` em DD/MM` se data; `atrasado` se data < hoje). Lead Novo sem nada: `Ainda não contatada`.
  - `paraHoje(leads, hoje) -> lead[]` — leads com `proximo_em` e `proximo_em <= hoje`, status diferente de Fechou/Sem interesse, ordenados por `proximo_em` asc.
  - `promptPesquisa(lead, areaNome: string) -> string`
  - `promptResposta(lead, areaNome: string, resumo: string) -> string`
- `DD/MM` formatado de ISO sem depender de fuso do sistema para datas `YYYY-MM-DD` (fatiar a string); para timestamps usar `toLocaleDateString('pt-BR', {timeZone:'America/Bahia', day:'2-digit', month:'2-digit'})`.

- [ ] **Step 1: Testes que falham** em `tests/painel-logica.test.mjs` (carrega o arquivo com `vm.runInNewContext(src, ctx)`):
  - `resumoLead` de lead Novo sem envios → `'Ainda não contatada'`.
  - lead com envios etapa 0 (email, `2026-11-12T13:00:00Z`) e 1 (`2026-11-16T13:00:00Z`), status Respondeu, `proximo:'ligar'`, `proximo_em:'2026-11-20'`, hoje `2026-11-17` → `'Contatada 12/11 por E-mail · lembrete 16/11 · respondeu · próximo: ligar em 20/11'`.
  - mesmo lead com hoje `2026-11-21` → termina com `'em 20/11 (atrasado)'`.
  - Sem interesse com `motivo_perda:'Sem orçamento'` → contém `'perdida: Sem orçamento'`.
  - `paraHoje`: inclui `proximo_em` = hoje e ontem; exclui amanhã, sem data, e status `Fechou`; ordem crescente.
  - `promptPesquisa` de lead sem site/ig/sobre: não contém `undefined`, `null` nem a linha `Site:`; contém `daimefilmes.com.br` e `não fale de valor`.
  - `promptResposta` com `resposta:'Quanto custa?'`: contém `Quanto custa?`, o resumo e `não fale de valor`.
- [ ] **Step 2:** `node --test tests/` → FAIL (funções não definidas).
- [ ] **Step 3:** Implementar as quatro funções. Prompts em português, curtos: quem é o Cainan (Daime Filmes, filmmaker de imóveis e hospitalidade no sul da Bahia), dados do lead (só linhas preenchidas), a tarefa (pesquisa: 4–6 tópicos sobre a empresa, se já usa vídeo, e uma frase personalizada de uma linha; resposta: rascunho de e-mail curto respondendo ao que o cliente escreveu) e as regras globais.
- [ ] **Step 4:** `node --test tests/` → PASS.
- [ ] **Step 5:** Commit `feat: lógica de resumo, para hoje e pedidos para o Claude`.

### Task 3: Ficha do lead — resumo, próximo passo, pesquisa e resposta

**Files:**
- Modify: `painel.html` — `renderDrawer` (~835), handlers `click` (~930), `input` (~953), `change` (~965), CSS do drawer.

**Interfaces:**
- Consumes: Task 1 colunas; Task 2 `resumoLead`, `promptPesquisa`, `promptResposta`.

- [ ] **Step 1:** No topo do `d-body`, bloco "Resumo" com `esc(resumoLead(l, hist, hojeStr()))` (`hist` já existe no `renderDrawer`).
- [ ] **Step 2:** Bloco "Próximo passo": `<input class="field" id="dprox">` + `<input type="date" class="field" id="dproxem">`. Salvar com `debounce` como `dnotes` (`proximo`) e no `change` (`proximo_em`, vazio → `null`).
- [ ] **Step 3:** Bloco "Pesquisa": botão `data-act="pesquisar"` → `copy(promptPesquisa(l, MODELOS[l.area].nome))` e `window.open('https://claude.ai/new', '_blank', 'noopener')`, toast `Pedido copiado. Cole no Claude e traga o resultado.`; textarea `id="dpesq"` salvo com debounce em `pesquisa`.
- [ ] **Step 4:** Bloco "Resposta do cliente" só se status em Respondeu/Reunião/Fechou: textarea `id="dresp"` (salva em `resposta`) e botão `data-act="sugerir"` que copia `promptResposta(...)` e abre o Claude.
- [ ] **Step 5:** Ao escolher "Sem interesse" no `#dstatus`, abrir o seletor de motivo (Task 4 `pedirMotivo`) antes de gravar; cancelado → volta o select ao valor anterior.
- [ ] **Step 6: Verificar no navegador** (`npx serve` ou `python3 -m http.server` na raiz, login do Cainan ou usuário temporário): campos salvam e voltam após recarregar; botões copiam e abrem o Claude; Review Focus 1, 2 e 5.
- [ ] **Step 7:** Commit `feat: ficha com resumo, próximo passo, pesquisa e resposta`.

### Task 4: Funil arrastável e motivo da perda

**Files:**
- Modify: `painel.html` — `vAcompanhar` (~777), CSS `.board/.col/.card`, novos listeners `dragstart/dragover/drop`.

**Interfaces:**
- Produces: `pedirMotivo() -> Promise<string|null>` (diálogo do próprio painel, sem `confirm()`/`prompt()`; seis botões com os motivos + Cancelar); `moverLead(id: string, status: string) -> Promise<void>` (mesma regra do `change` de `#dstatus`: preenche `primeiro/ultimo` se vazio, limpa fila pendente/aprovada fora de Novo/Contatado/Lembrete 1; grava `motivo_perda` quando Sem interesse).
- Refatorar o `change` de `#dstatus` para chamar `moverLead`.

- [ ] **Step 1:** Cartões com `draggable="true" data-drag="<id>"`; colunas com `data-col="<status destino>"` (para "Lembretes enviados" o destino é `Lembrete 1`). Adicionar a coluna "Novo"? Não — o board começa em Contatado, como hoje.
- [ ] **Step 2:** `drop` numa coluna diferente da atual → `moverLead`; destino Sem interesse → `pedirMotivo()` primeiro, cancelado = nada. Mesma coluna ou fora = nada (Review Focus 3, 4).
- [ ] **Step 3:** Cartão de lead perdido mostra o motivo; cabeçalho de "Sem interesse" mostra contagem por motivo.
- [ ] **Step 4: Verificar no navegador**: arrastar entre colunas grava e persiste ao recarregar; cancelar motivo não muda nada; no celular (largura 390) o seletor da ficha continua funcionando.
- [ ] **Step 5:** Commit `feat: funil arrastável com motivo da perda`.

### Task 5: "Para hoje" na tela inicial

**Files:**
- Modify: `painel.html` — `vHoje` (~684).

**Interfaces:**
- Consumes: Task 2 `paraHoje`.

- [ ] **Step 1:** Seção `Para hoje` acima de `#queue` quando `paraHoje(LEADS, hojeStr())` não for vazio: linhas no estilo `mini` (abre a ficha), texto `<proximo> · <DD/MM>`, marcando `atrasado` em vermelho.
- [ ] **Step 2:** Novo `stat` "próximos passos para hoje".
- [ ] **Step 3: Verificar no navegador** com um lead de teste com `proximo_em` = hoje e outro = amanhã.
- [ ] **Step 4:** Commit `feat: seção Para hoje com os próximos passos`.

### Task 6: Robô guarda o texto da resposta

**Files:**
- Modify: `prospeccao-interno/robo-painel.gs` (não versionado; fica fora do git) — `conferirRespostas`, `tipoDeResposta_`.

- [ ] **Step 1:** `tipoDeResposta_` passa a devolver `{ tipo, texto }`, com `texto` = `getPlainBody()` da primeira mensagem que não é do Cainan, sem o trecho citado (cortar na primeira linha que começa com `>` ou em `Em .* escreveu:`/`On .* wrote:`), limitado a 4000.
- [ ] **Step 2:** `conferirRespostas` chama `rpc_('robo_resposta', { p_lead, p_tipo, p_texto })`.
- [ ] **Step 3: Verificar** com SQL simulando a chamada com o token real num lead de teste (criado e apagado no teste): `resposta` preenchida, `status` = Respondeu.
- [ ] **Step 4:** Atualizar a tela "Robô de e-mail" do painel com uma linha avisando para recolar o robô; commit dessa linha `feat: robô guarda o texto da resposta`.

### Task 7: Fechamento

- [ ] `node --test tests/` verde; revisão completa do ramo; atualizar `prospeccao-interno/PLANO.md` com o que mudou e o passo manual (recolar o robô).
- [ ] Pedir ao Cainan o OK para merge em `main` e publicação.
