# Vídeo de aprovação no R2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** As versões de aprovação vão para um bucket R2 privado (envio único com link assinado), tocam por link temporário, são apagadas ao excluir e somem 30 dias depois da aprovação.

**Architecture:** `api/_lib/r2.mjs` assina links SigV4 sem dependências. As rotas `api/r2/envio`, `api/tarefas/versao` (POST/GET/DELETE), `api/tarefas/index` (DELETE) e `api/cron/limpar-r2` usam essa assinatura. A página usa XHR com progresso no painel de transferências.

**Tech Stack:** Node `crypto`, funções Vercel, Supabase REST/RPC, Cloudflare R2 (API S3), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-23-aprovacao-r2-design.md`

## Global Constraints
- Sem dependências npm.
- Bucket privado. A chave do R2 fica só no servidor. Nenhum vídeo passa pela Vercel. Nada é apagado no Drive.
- Variáveis: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (`daime-edicao`), `CRON_SECRET`.
- Chave do objeto: `edicao/<tarefa>/<Date.now()>-<aleatório>.<ext>`. Tamanho máximo: `5 * 1024 ** 3`.
- Validade dos links: PUT 3600 s, GET 21600 s. A limpeza remove versões com aprovação há mais de 30 dias. Cron: `0 6 * * *`.
- Testes: `node --test tests/*.test.mjs`. Testar no local antes de publicar.

## Review Focus
1. **Envio que termina, mas o registro da versão falha** (rede caiu entre o PUT e o POST): o vídeo fica no R2 sem versão. Esperado: "Tentar de novo" registra de novo com a mesma chave, sem reenviar. Teste: `chaveDaTarefa` aceita a chave e `existe` é consultado (Task 2).
2. **Tarefa aprovada, depois reaberta com ajustes e aprovada de novo:** conta a aprovação **mais recente**. Teste: `paraRemover` (Task 3).
3. **Chave forjada** (`edicao/OUTRA_TAREFA/...` ou `../`): o registro recusa. Teste: `chaveDaTarefa` (Task 2).
4. **Versão do Drive antiga junto com versões R2:** a limpeza ignora versões sem `r2_key`. Teste: `paraRemover` (Task 3).
5. **Nome de arquivo com espaços e acentos** (`Casa Laura V2 final.mov`): a chave usa só a extensão saneada. Teste: `chaveNova` (Task 2).

---

### Task 1: Assinatura SigV4

**Files:** Create `api/_lib/r2.mjs` · Test `tests/api-lib.test.mjs`

**Interfaces — Produces:**
- `presign({ metodo, host, caminho, regiao, servico, acesso, segredo, agora: Date, segundos }) -> string` (URL completa, `X-Amz-*` na query, `X-Amz-SignedHeaders=host`, payload `UNSIGNED-PAYLOAD`).
- `assinarUrl({ metodo, chave, segundos, agora? }) -> string`: host `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, caminho `/${R2_BUCKET}/${chave}` (cada segmento com `encodeURIComponent`), região `auto`, serviço `s3`.
- `r2Configurado() -> boolean`.
- `apagar(chave) -> Promise<boolean>` (204/404 = true); `existe(chave) -> Promise<number|null>` (HEAD → content-length).

- [ ] **Step 1: Teste do vetor oficial da AWS** (o exemplo de URL assinada de GET da documentação, que usa `UNSIGNED-PAYLOAD`):

```js
test('presign reproduz o exemplo oficial da AWS', () => {
  const url = presign({ metodo: 'GET', host: 'examplebucket.s3.amazonaws.com', caminho: '/test.txt', regiao: 'us-east-1', servico: 's3',
    acesso: 'AKIAIOSFODNN7EXAMPLE', segredo: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', agora: new Date('2013-05-24T00:00:00Z'), segundos: 86400 });
  assert.match(url, /X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404$/);
  assert.match(url, /^https:\/\/examplebucket\.s3\.amazonaws\.com\/test\.txt\?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=/);
});
```

- [ ] **Step 2:** `node --test tests/api-lib.test.mjs`. Esperado: FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `api/_lib/r2.mjs` com as assinaturas acima. Na query canônica, os parâmetros vão em ordem e codificados (RFC 3986).
- [ ] **Step 4:** `node --test tests/*.test.mjs`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: assinatura SigV4 para o R2 (sem dependências)`.

### Task 2: Envio e registro da versão no R2

**Files:** Create `api/r2/envio.mjs`, `supabase/migrations/20261123_versoes_r2.sql` · Modify `api/tarefas/versao.mjs`, `api/_lib/r2.mjs` · Test `tests/api-lib.test.mjs`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `chaveNova(tarefaId, nomeArquivo, agora=Date.now(), aleatorio) -> string`;
  - `chaveDaTarefa(chave, tarefaId) -> boolean` (regex `^edicao/<id>/[0-9]+-[a-z0-9]+\.[a-z0-9]{1,5}$`);
  - `POST /api/r2/envio { tarefa, nome, tipo, tamanho } -> { url, chave }`, com erros `tarefa_nao_encontrada` 404, `ja_aprovada` 409, `nao_e_video` 400, `tamanho_invalido` 400 e `r2_nao_configurado` 503;
  - `POST /api/tarefas/versao { tarefa, r2, nome, nota }`, com `r2_nao_chegou` 409;
  - `GET` devolve `{ numero, video }` ou `{ numero, removido }`.

- [ ] **Step 1: Testes**

```js
test('chaveNova usa só a extensão saneada', () => {
  assert.equal(chaveNova(12, 'Casa Laura V2 final.MOV', 1000, 'abc123'), 'edicao/12/1000-abc123.mov');
  assert.equal(chaveNova(12, 'sem extensao', 1000, 'abc123'), 'edicao/12/1000-abc123.mp4');
});
test('chaveDaTarefa recusa outra tarefa e caminhos forjados', () => {
  assert.equal(chaveDaTarefa('edicao/12/1000-abc123.mov', 12), true);
  assert.equal(chaveDaTarefa('edicao/13/1000-abc123.mov', 12), false);
  assert.equal(chaveDaTarefa('edicao/12/../13/x.mov', 12), false);
  assert.equal(chaveDaTarefa(undefined, 12), false);
});
```

- [ ] **Step 2:** Rodar. Esperado: FAIL.
- [ ] **Step 3:** Implementar as funções em `r2.mjs`, a migração (spec, seção "Banco"), `api/r2/envio.mjs` e os ramos R2 em `versao.mjs` (`GET` com `video_removido_em`, `POST` com `r2`). No POST, versão R2 grava `drive_file_id: null`.
- [ ] **Step 4:** `node --test tests/*.test.mjs` PASS; `node --check` nas rotas.
- [ ] **Step 5:** Commit `feat: envio da versão de aprovação para o R2`.

### Task 3: Exclusão pelo servidor e limpeza diária

**Files:** Create `api/_lib/limpeza.mjs`, `api/tarefas/index.mjs`, `api/cron/limpar-r2.mjs`, `vercel.json` · Modify `api/tarefas/versao.mjs`, `api/_lib/supabase.mjs` · Test `tests/api-lib.test.mjs`

**Interfaces:**
- Produces:
  - `rpcComoUsuario(request, nome, args) -> Promise<{ ok, erro }>` em `supabase.mjs`, que usa `apikey` pública + `Authorization` do pedido;
  - `paraRemover(versoes, eventos, agora) -> versao[]` em `api/_lib/limpeza.mjs`;
  - `DELETE /api/tarefas/versao?tarefa=&numero=`;
  - `DELETE /api/tarefas?id=`;
  - `GET /api/cron/limpar-r2 -> { removidos }`.

- [ ] **Step 1: Teste**

```js
test('paraRemover: aprovação mais recente há mais de 30 dias, só R2 e ainda não removido', () => {
  const agora = Date.parse('2026-12-31T00:00:00Z');
  const versoes = [
    { id: 1, tarefa_id: 1, r2_key: 'a', video_removido_em: null, status: 'aprovado' },
    { id: 2, tarefa_id: 1, r2_key: null, video_removido_em: null, status: 'aprovado' },
    { id: 3, tarefa_id: 2, r2_key: 'b', video_removido_em: null, status: 'aprovado' },
    { id: 4, tarefa_id: 3, r2_key: 'c', video_removido_em: null, status: 'ajustes' },
    { id: 5, tarefa_id: 1, r2_key: 'd', video_removido_em: '2026-12-01T00:00:00Z', status: 'aprovado' },
  ];
  const eventos = [
    { tarefa_id: 1, tipo: 'aprovada', criado_em: '2026-11-20T00:00:00Z' },
    { tarefa_id: 2, tipo: 'aprovada', criado_em: '2026-11-01T00:00:00Z' },
    { tarefa_id: 2, tipo: 'aprovada', criado_em: '2026-12-20T00:00:00Z' }, // reaprovada: conta a mais recente
    { tarefa_id: 3, tipo: 'aprovada', criado_em: '2026-10-01T00:00:00Z' },
  ];
  assert.deepEqual(Array.from(paraRemover(versoes, eventos, agora), v => v.id), [1]);
});
```

- [ ] **Step 2:** Rodar. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
  - **`DELETE` de versão:** lê `r2_key` → `rpcComoUsuario('excluir_versao', …)` → se deu certo, `apagar` (falha só registra no log).
  - **`DELETE` de tarefa:** o mesmo com `excluir_tarefa` e todas as chaves.
  - **cron:** conferir `Authorization: Bearer ${CRON_SECRET}` (401 se não bater); buscar `versoes?r2_key=not.is.null&video_removido_em=is.null&select=id,tarefa_id,r2_key,tarefas(status)` e os eventos `aprovada`; usar `paraRemover`; para cada uma, `apagar` e depois PATCH `video_removido_em`.
  - **`vercel.json`:** como na spec. A função `paraRemover` também precisa ser importável pelo cron: `edicao-logica.js` é carregado com `vm` nos testes e não exporta nada. Por isso ela vai **também** para `api/_lib/limpeza.mjs`, com o mesmo teste importando de lá. O teste fica em `tests/api-lib.test.mjs`.
- [ ] **Step 4:** PASS; `node --check`.
- [ ] **Step 5:** Commit `feat: excluir apaga no R2 e limpeza diária 30 dias depois da aprovação`.

### Task 4: Página

**Files:** Modify `edicao.html`

**Interfaces:**
- Consumes: as rotas das Tasks 2 e 3.
- Produces: `enviarVersaoR2(t, arquivo, nota)`.

- [ ] **Step 1: "Enviar versão"** (`arq-versao`) chama `enviarVersaoR2`:
  - `POST /api/r2/envio`;
  - entrada em `ENVIOS` com `e.r2 = { chave }` e PUT por XHR (`Content-Type` = tipo do arquivo, progresso atualiza `e.enviado` e o painel);
  - depois `POST /api/tarefas/versao { tarefa, r2: chave, nome, nota }`.
  - "Tentar de novo" (`data-retomar`), para uma entrada com `e.r2`:
    - se o PUT já terminou (`e.r2.enviado`), registra de novo;
    - se não, refaz o PUT do zero com um novo link.
  - Texto da caixa: "O vídeo fica na plataforma para a revisão (não vai para o Drive). Some 1 mês depois da aprovação."
- [ ] **Step 2: Player.** Com `removido`, mostrar `<p class="sem">Vídeo removido em DD/MM (1 mês depois da aprovação).</p>`. A função `assinaturas()` guarda `players[t.id][numero] = { video }` ou `{ removido }`.
- [ ] **Step 3: Excluir versão/tarefa.** `fetch(DELETE …)` com o token, em vez de `rpc(...)`. Sucesso → aviso + `recarregar()`; erro → aviso.
- [ ] **Step 4: Verificar.**
  - Rodar `node --test tests/*.test.mjs` e `node --check` no script da página.
  - **No local, sem chaves do R2:** "Enviar versão" mostra o aviso de `r2_nao_configurado` ("O armazenamento de vídeos ainda não foi configurado.").
  - **Com chaves:** envio, player, exclusão e cron (`curl -H "Authorization: Bearer $CRON_SECRET" localhost:3005/api/cron/limpar-r2` → `{removidos:0}`).
- [ ] **Step 5:** Commit `feat: Enviar versão manda o vídeo para o R2; player e exclusões`.

### Task 5: Passos do dono e publicação (com o dono presente)
- [ ] O dono roda no SQL Editor: `20261123_excluir_editor.sql` e `20261123_versoes_r2.sql`.
- [ ] O dono cria o bucket, o token e o CORS (texto pronto no relatório final) e põe as variáveis no `.env.local` e na Vercel.
- [ ] Teste local completo com um vídeo real pequeno, e só depois o push.
