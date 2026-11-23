# Espaço de Edição — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`) syntax.

**Goal:** `edicao.html` com tarefas, arquivos do Drive (daimefilmes), versões e ajustes, com login separado para dono e editor.

**Architecture:** Página HTML/JS pura + funções Vercel em `api/` (Node, sem dependências) que guardam os tokens do Google e falam com Drive e Supabase com a chave de serviço. Dados e login no Supabase daime-prospeccao. Lógica pura testada com `node --test`.

**Tech Stack:** HTML/CSS/JS, Supabase JS (CDN já usado no painel), Google Drive API v3, Vercel Functions, node:test.

**Spec:** `docs/superpowers/specs/2026-11-23-espaco-edicao-design.md`

## Global Constraints
- Drive: só listar, ler, criar pasta e enviar arquivo novo. Nunca apagar/mover/renomear.
- Nada de chave do Google ou `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- Funções `api/**/*.mjs` sem dependências npm; segredos por `process.env`.
- Datas na tela no fuso `America/Bahia`.
- Cores "Mar de Espelho": canvas `#eff5f7`, surface `#fbfdfe`, ink `#18323a`, ink-muted `#5b7179`, accent `#087a8a`; etapas: a fazer `#5d6f86`, em edição `#2f7fb5`, para revisar `#087a8a`, ajustes `#c27c0e`, reenviado `#7b5cd6`, aprovado `#2f9a5b`.

## Review Focus
1. Arquivo ou pasta fora da raiz pedido por id (listar, vídeo, envio) → 403, nada exposto.
2. Token do Google expirado/revogado → tela mostra "Reconectar Drive" (dono) / "Drive desconectado, avise o Cainan" (editor), sem tela branca.
3. Envio interrompido (rede cai) → barra mostra erro e "Tentar de novo" retoma do ponto (sessão resumable).
4. Editor tentando aprovar/pedir ajustes/criar tarefa direto no banco → recusado pela RLS/RPC.
5. Casa sem pasta `06 Saída` → criada na primeira entrega; nome com/sem acento reconhecido.

---

### Task 1: banco (migração)
**Files:** Create `supabase/migrations/20261123_edicao.sql`
**Produces:** tabelas `editores`, `drive_conexao`, `tarefas`, `versoes`, `comentarios`, `eventos`; funções `papel() returns text`, `comecar_edicao(p_tarefa bigint)`, `pedir_ajustes(p_tarefa bigint, p_texto text)`, `aprovar_tarefa(p_tarefa bigint)`, `comentar(p_tarefa bigint, p_versao int, p_tempo numeric, p_texto text)`; RLS: dono all em tarefas/versoes/comentarios/eventos; editor select; drive_conexao sem políticas.
- [ ] Escrever SQL (status check, triggers de `atualizada_em`, evento 'criada' por trigger no insert de tarefas).
- [ ] Aplicar no projeto daime-prospeccao; conferir com `select papel()` como serviço (null) e listar tabelas.
- [ ] Commit.

### Task 2: lógica pura (`edicao-logica.js` + `tests/edicao-logica.test.mjs`)
**Produces (globais, estilo painel-logica.js):**
- `ETAPAS` = [{id:'a_fazer',nome:'A fazer'},{id:'em_edicao',nome:'Em edição'},{id:'para_revisar',nome:'Para revisar'},{id:'ajustes',nome:'Ajustes pedidos'},{id:'reenviado',nome:'Reenviado'},{id:'aprovado',nome:'Aprovado'}]
- `etapaDe(status, nVersoes)`: para_revisar com nVersoes>1 → 'reenviado'.
- `caminhoTarefa(eventos)`: lista de etapas (criada→a_fazer, comecou→em_edicao, versao n=1→para_revisar, n>1→reenviado, ajustes→ajustes, aprovada→aprovado).
- `timecode(seg)`: 0→'00:00', 134.6→'02:14', 3725→'1:02:05'.
- `ehPastaSaida(nome)`: '06 Saída', '06 Saida', '06 SAÍDA', '6 saida' → true; '05 Projetos', 'Saída antiga' → false.
- `tamanhoLegivel(bytes)`: 0→'0 B', 1536→'1,5 KB', 734003200→'700 MB', 2147483648→'2,0 GB'.
- `prazoInfo(prazo, hoje)`: {texto:'até 25/11', atrasado:false}; passado → atrasado true.
- [ ] Testes primeiro (casos acima), ver falhar, implementar, ver passar. Commit.

### Task 3: núcleo do servidor (`api/_lib/`)
**Files:** `api/_lib/supabase.mjs`, `api/_lib/google.mjs`, `api/_lib/assinatura.mjs`, `api/_lib/raiz.mjs`, `tests/api-lib.test.mjs`
**Produces:**
- `usuarioDaRequisicao(request) → {id, papel} | null` (Bearer do Supabase → `/auth/v1/user` + `rpc/papel` com o token do usuário).
- `sb(path, init)` fetch REST com service key.
- `tokenGoogle() → access_token` (renova com refresh_token; grava em drive_conexao); erro `DriveDesconectado`.
- `drive(path, params, init)`; `driveUpload` não (sessão é feita na rota).
- `assinar(id, segundos)`, `conferirAssinatura(id, t) → boolean` (HMAC-SHA256 base64url, `id.exp.sig`).
- `dentroDaRaiz(id, raizId, getParents) → boolean` (sobe parents até 20 níveis, cache Map 10 min) — pura com `getParents` injetado.
- [ ] Testes de `assinar/conferirAssinatura` (válida, expirada, outro id, adulterada) e `dentroDaRaiz` (filho direto, neto, fora, ciclo/limite). Implementar. Commit.

### Task 4: rotas
**Files:** `api/google/login.mjs`, `api/google/callback.mjs`, `api/drive/index.mjs` (GET lista / POST raiz), `api/drive/envio.mjs` (POST sessão), `api/drive/video.mjs` (GET Range), `api/tarefas/versao.mjs` (POST registrar versão), `api/drive/estado.mjs` (GET conectado/raiz/email), `dev.mjs` (servidor local).
- login/callback: dono só; state em cookie; grava refresh_token; volta para `edicao.html?drive=ok`.
- `GET /api/drive?pasta=id` (padrão raiz): `{ pasta:{id,nome}, caminho:[{id,nome}], itens:[{id,nome,tipo:'pasta'|'video'|'imagem'|'arquivo',tamanho,modificado,link,download}] }`, pastas primeiro, ordem natural.
- `POST /api/drive` `{raiz}` dono: define a raiz.
- `POST /api/drive/envio` `{pasta, nome, tipo, tamanho}` (pasta dentro da raiz; `pasta:'saida:<casaId>'` resolve/cria 06 Saída) → `{url}` da sessão resumable (header Origin = origem da requisição).
- `GET /api/drive/video?id&t`: confere assinatura; repassa Range com teto 8 MB.
- `POST /api/tarefas/versao` `{tarefa, arquivo}`: arquivo dentro da casa da tarefa e é vídeo → insere versão (numero = max+1), status para_revisar, evento 'versao'.
- `GET /api/tarefas/detalhe?id` → versões com `assinatura` para o player.
- [ ] `node --check` em todos; rodar `node dev.mjs` e testar com curl: sem login 401; com login do dono `/api/drive/estado`. Commit.

### Task 5: login e aba EDIÇÃO no painel
**Files:** `painel.html` (boot + nav)
- [ ] `boot()`: `papel()`; editor → `location.replace('edicao.html')`; dono segue; null → sair com a mensagem atual.
- [ ] Item "EDIÇÃO" na navegação do painel (link para `edicao.html`).
- [ ] Testes existentes `node --test tests/` verdes. Commit.

### Task 6: `edicao.html`
- [ ] Estrutura: topo, linha do tempo (6 etapas), fila recolhível fechada, detalhe com abas Vídeo · Arquivos · Linha do tempo, diálogo Nova tarefa (escolher casa navegando na raiz, tipo, prazo, instruções), conexão do Drive (dono).
- [ ] Vídeo: player `/api/drive/video`, abas de versão, comentários com minuto (dono), Pedir ajustes / Aprovar (dono), Enviar nova versão (editor: arquivo do computador → envio em partes de 16 MB para `saida:<casa>` → registrar versão; ou escolher vídeo já em 06 Saída).
- [ ] Arquivos: caminho, lista, Baixar/Abrir no Drive, Enviar arquivos (fila com progresso, tentar de novo).
- [ ] Verificar no navegador (localhost via `node dev.mjs`): login dono, criar tarefa, navegar, enviar arquivo pequeno de teste, registrar versão, comentar, pedir ajustes, aprovar. Commit.

### Task 7: entrega
- [ ] `node --test tests/` verde; atualizar `PRODUCT.md` (seção Edição) e `.gitignore` (`.env.local`).
- [ ] Listar para o dono: variáveis da Vercel, endereços de retorno no Google Cloud, conta do editor.
