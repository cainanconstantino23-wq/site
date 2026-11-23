# Transferências como no Cyberduck — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Envio em um único PUT com 3 arquivos ao mesmo tempo, e download de pasta/arquivo direto para o disco do editor com a conta Google dele, sem abrir o Drive.

**Architecture:** A lógica pura (nomes no Windows, retomada, fila) fica em `edicao-logica.js` e é testada com `node --test`. O servidor (funções Vercel em `api/`) guarda a renovação do acesso Google do editor (`drive_editor`) e entrega um token curto em `/api/drive/meu-token`. O navegador (`edicao.html`) baixa de `googleapis.com` com esse token e grava com a File System Access API. O envio continua usando a sessão resumable criada por `/api/drive/envio`.

**Tech Stack:** HTML/JS puro, funções Vercel Node sem dependências, Supabase REST, Google Drive API v3, File System Access API (Chrome), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-23-transferencias-cyberduck-design.md`

## Global Constraints

- Nada novo para instalar: sem dependências npm, sem bundler.
- Nenhum arquivo passa pelo servidor do site (Vercel) em nenhuma direção.
- O navegador do editor nunca recebe o token da conta do dono. O dono recebe o próprio token.
- Escopo do editor: `openid email https://www.googleapis.com/auth/drive.readonly`. O escopo do dono não muda.
- Regra do Drive: nada é apagado, movido ou renomeado.
- `SIMULTANEOS = 3` para envio e download.
- Retentativas de envio: até 5, com espera de 1, 2, 4, 8 e 16 s.
- Arquivos `application/vnd.google-apps.*` (exceto pasta) são pulados no download.
- Sem `showDirectoryPicker` (fora do Chrome/Edge), "Baixar pasta" some e "Baixar" volta a abrir o link do Drive (`noDrive(a.download)`).
- Textos da interface em português, no tom atual da página.

## Review Focus

1. **Download de pasta que passa de 1 hora:** o token expira no meio. Cada arquivo novo deve pegar um token válido, renovado se faltar menos de 5 min, e um 401 deve renovar e tentar de novo uma vez, sem derrubar a fila. Teste: `tokenValido` na Task 1.
2. **O editor fecha a aba no meio e baixa a mesma pasta de novo:** os arquivos completos são pulados e os parciais continuam com Range. Teste: `planoRetomada` na Task 1.
3. **Dois arquivos com o mesmo nome na mesma pasta do Drive** (o Drive permite): no disco o segundo vira `nome (2).ext`, em vez de um sobrescrever o outro. Teste: `nomesUnicos` na Task 1.
4. **A rede cai no meio de um envio de 4 GB:** o envio continua do byte em que parou, não do zero. Teste: `inicioDoRange` na Task 1.
5. **Nome de pasta ou arquivo inválido no Windows** (`Casa: Vilas`, `foto?.jpg`, nome terminando em ponto): o download não pode falhar. Teste: `nomeWindows` na Task 1.

---

### Task 1: Lógica pura das transferências

**Files:**
- Modify: `edicao-logica.js` (acrescentar no fim; usar `function`/`var`, como o resto do arquivo, pois é carregado com `vm` nos testes e por `<script>` na página)
- Test: `tests/edicao-logica.test.mjs` (incluir os novos nomes na desestruturação de `ctx`)

**Interfaces:**
- Produces:
  - `nomeWindows(nome: string) -> string`: troca `< > : " / \ | ? *` e caracteres de controle por `_`, remove ponto ou espaço do fim (vira `_` se ficar vazio) e, para nomes reservados (`CON PRN AUX NUL COM1-9 LPT1-9`, com ou sem extensão), prefixa `_`.
  - `nomesUnicos(nomes: string[]) -> string[]`: aplica `nomeWindows` e, em nomes repetidos (sem diferenciar maiúsculas, como no Windows), insere ` (2)`, ` (3)`… antes da extensão.
  - `planoRetomada(tamanhoLocal: number|null, tamanhoDrive: number) -> { acao: 'pular'|'continuar'|'do_zero', inicio: number }`. `null` significa que o arquivo não existe no disco.
  - `inicioDoRange(cabecalhoRange: string|null) -> number`: `"bytes=0-999"` dá `1000`; `null` dá `0`.
  - `tokenValido(guardado: {token, expira_em}|null, agora: number) -> boolean`: verdadeiro só se faltam mais de 5 min.
  - `esperaTentativa(n: number) -> number`: ms; n=1..5 dá 1000, 2000, 4000, 8000, 16000.
  - `ehNativoGoogle(mime: string) -> boolean`.

- [ ] **Step 1: Escrever os testes que falham**

```js
test('nomeWindows troca caracteres proibidos e trata o fim e os reservados', () => {
  assert.equal(nomeWindows('Casa: Vilas'), 'Casa_ Vilas');
  assert.equal(nomeWindows('foto?.jpg'), 'foto_.jpg');
  assert.equal(nomeWindows('a<b>c"d|e*f\\g/h'), 'a_b_c_d_e_f_g_h');
  assert.equal(nomeWindows('Pasta. '), 'Pasta');
  assert.equal(nomeWindows('...'), '_');
  assert.equal(nomeWindows('CON'), '_CON');
  assert.equal(nomeWindows('nul.txt'), '_nul.txt');
  assert.equal(nomeWindows('DJI_0001.MP4'), 'DJI_0001.MP4');
});

test('nomesUnicos numera repetidos antes da extensão, sem diferenciar maiúsculas', () => {
  assert.deepEqual(Array.from(nomesUnicos(['a.mp4', 'A.MP4', 'a.mp4', 'b'])), ['a.mp4', 'A (2).MP4', 'a (3).mp4', 'b']);
  assert.deepEqual(Array.from(nomesUnicos(['x:y', 'x?y'])), ['x_y', 'x_y (2)']);
});

test('planoRetomada', () => {
  assert.deepEqual({ ...planoRetomada(null, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(500, 500) }, { acao: 'pular', inicio: 500 });
  assert.deepEqual({ ...planoRetomada(200, 500) }, { acao: 'continuar', inicio: 200 });
  assert.deepEqual({ ...planoRetomada(0, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(900, 500) }, { acao: 'do_zero', inicio: 0 });
  assert.deepEqual({ ...planoRetomada(0, 0) }, { acao: 'pular', inicio: 0 });
});

test('inicioDoRange lê o Range do Google', () => {
  assert.equal(inicioDoRange('bytes=0-999'), 1000);
  assert.equal(inicioDoRange(null), 0);
  assert.equal(inicioDoRange('lixo'), 0);
});

test('tokenValido exige mais de 5 minutos', () => {
  const agora = Date.parse('2026-11-23T12:00:00Z');
  assert.equal(tokenValido({ token: 't', expira_em: '2026-11-23T12:06:00Z' }, agora), true);
  assert.equal(tokenValido({ token: 't', expira_em: '2026-11-23T12:04:00Z' }, agora), false);
  assert.equal(tokenValido(null, agora), false);
});

test('esperaTentativa dobra a cada tentativa', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(esperaTentativa), [1000, 2000, 4000, 8000, 16000]);
});

test('ehNativoGoogle', () => {
  assert.equal(ehNativoGoogle('application/vnd.google-apps.document'), true);
  assert.equal(ehNativoGoogle('application/vnd.google-apps.folder'), false);
  assert.equal(ehNativoGoogle('video/mp4'), false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/edicao-logica.test.mjs`
Expected: FAIL (`nomeWindows is not a function` etc.)

- [ ] **Step 3: Implementar as funções em `edicao-logica.js`** com as assinaturas acima.

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test tests/`
Expected: todos PASS

- [ ] **Step 5: Commit**

```bash
git add edicao-logica.js tests/edicao-logica.test.mjs
git commit -m "feat: lógica pura das transferências (nomes no Windows, retomada, token)"
```

---

### Task 2: Conta Google do editor no servidor

**Files:**
- Create: `supabase/migrations/20261123_drive_editor.sql`
- Modify: `api/_lib/assinatura.mjs` (cookie de estado assinado)
- Modify: `api/_lib/google.mjs` (escopos por papel, token do editor)
- Modify: `api/google/login.mjs`, `api/google/callback.mjs`, `api/drive/estado.mjs`
- Create: `api/drive/meu-token.mjs`
- Test: `tests/api-lib.test.mjs`

**Interfaces:**
- Produces:
  - Tabela `public.drive_editor (user_id uuid primary key references auth.users on delete cascade, email text, refresh_token text not null, access_token text, expira_em timestamptz, atualizada_em timestamptz not null default now())`, com RLS ligado e sem políticas.
  - `cookieEstado(state: string, userId: string, agora?: number) -> string` e `lerCookieEstado(valor: string, state: string, agora?: number) -> string|null` (devolve `userId`) em `assinatura.mjs`. Formato `${userId}~${assinar(`${state}|${userId}`, 600, agora)}`.
  - `escoposDe(papel: 'dono'|'editor') -> string[]`; `urlLogin(origem, state, escopos)` (novo terceiro parâmetro).
  - `tokenDoEditor(userId: string) -> Promise<{ token, expira_em, email }>`: renova com o `refresh_token` de `drive_editor` quando faltar menos de 5 min; lança `GoogleEditorDesconectado` se não houver linha ou a renovação falhar.
  - `GET /api/drive/meu-token` → `200 { token, expira_em, email }`. O editor recebe `tokenDoEditor`; o dono recebe `tokenGoogle()` + `conexao().expira_em/email`. Se o editor estiver sem conta: `409 { erro: 'google_editor' }`.
  - `GET /api/drive/estado` ganha `google_editor: { email } | null` (para o editor; `null` para o dono).
  - `/api/google/callback?…` volta para `edicao.html?drive=ok` (dono) ou `edicao.html?google=ok|cancelado|erro` (editor).

- [ ] **Step 1: Testes que falham em `tests/api-lib.test.mjs`**

```js
const { cookieEstado, lerCookieEstado } = await import('../api/_lib/assinatura.mjs');

test('cookie de estado devolve o usuário só com o state certo e dentro do prazo', () => {
  const c = cookieEstado('estadoXYZ', 'user-123', 1_000_000);
  assert.equal(lerCookieEstado(c, 'estadoXYZ', 1_000_000 + 60_000), 'user-123');
  assert.equal(lerCookieEstado(c, 'outroState', 1_000_000), null);
  assert.equal(lerCookieEstado(c, 'estadoXYZ', 1_000_000 + 601_000), null);
  assert.equal(lerCookieEstado(c.replace('user-123', 'user-999'), 'estadoXYZ', 1_000_000), null);
  assert.equal(lerCookieEstado('', 'estadoXYZ', 1_000_000), null);
});
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `node --test tests/api-lib.test.mjs`. Expected: FAIL (`cookieEstado is not a function`).

- [ ] **Step 3: Implementar** `cookieEstado`/`lerCookieEstado`, a migração, `escoposDe`, o `urlLogin` com escopos, `tokenDoEditor` e `GoogleEditorDesconectado` (seguindo o padrão de `tokenGoogle`/`DriveDesconectado`, com `upsert` via `on_conflict=user_id`).
  - `login.mjs`: aceitar `papel` dono ou editor; o cookie passa a ser `cookieEstado(state, usuario.id)`; o editor não precisa de `appGoogle()` diferente.
  - `callback.mjs`: `userId = lerCookieEstado(cookie, state)` (nulo → erro). Se existe linha em `editores` para esse `userId`, grava em `drive_editor` e volta com `?google=`. Senão, segue o fluxo atual do dono. Se for o editor e o Google não devolver `refresh_token`, volta com `?google=erro`.
  - `meu-token.mjs` e `estado.mjs` como nas Interfaces. Em `acesso.mjs → falha`, mapear `GoogleEditorDesconectado` para `409 { erro: 'google_editor' }`.

- [ ] **Step 4: Rodar e ver passar.** Run: `node --test tests/`. Expected: todos PASS.

- [ ] **Step 5: Teste manual local.** Run: `node dev.mjs`. Logado como editor em `http://localhost:3005/edicao.html`, `fetch('/api/drive/meu-token', {headers:{Authorization:'Bearer '+token}})` antes de conectar dá `409 google_editor`. Depois de conectar (Task 4), dá `200` com `email` do editor.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261123_drive_editor.sql api tests/api-lib.test.mjs
git commit -m "feat: editor conecta a própria conta Google (somente leitura) e pega token curto"
```

---

### Task 3: Envio em um único PUT, 3 ao mesmo tempo

**Files:**
- Modify: `edicao.html` (bloco "envio em partes direto para o Google", ~linhas 513-560; handler `arq-envio` ~linha 648; `trabalhar()` em `comecarSubida` ~linha 724)

**Interfaces:**
- Consumes: `inicioDoRange`, `esperaTentativa` (Task 1).
- Produces:
  - `const SIMULTANEOS = 3;`
  - `continuarEnvio(e)`: mesma assinatura e mesmos estados (`enviando|feito|erro`), mesmo `e.aoProgredir`, `e.resultado` com o JSON do Google.
  - `async function emParalelo(itens, fn, n = SIMULTANEOS)`: roda `fn(item)` com no máximo `n` ao mesmo tempo e resolve quando todos terminam. Reusar em "Subir casa" (no lugar de `Promise.all([trabalhar(), trabalhar()])`), em "Enviar arquivos" e no download (Task 4).

- [ ] **Step 1: Trocar o laço de partes** por `putArquivo(e, inicio) -> Promise<{status, range, json}>` com `XMLHttpRequest`. `PUT e.url`, corpo `e.arquivo.slice(inicio)`, `Content-Range: bytes ${inicio}-${total-1}/${total}`; `xhr.upload.onprogress` atualiza `e.enviado = inicio + ev.loaded` e chama `renderEnvios(); e.aoProgredir?.()`.
- [ ] **Step 2: Retomada.** Em erro de rede ou 5xx: `await espera(esperaTentativa(n))`, faz `PUT` vazio com `Content-Range: bytes */${total}`. Se vier 308, `inicio = inicioDoRange(xhr.getResponseHeader('Range'))` e repete o PUT dali. Se vier 200/201, terminou. Depois de 5 falhas, erro `'A conexão caiu várias vezes. Tente de novo.'`. 404/410 mantêm o comportamento atual (sessão expirou). Sem `PARTE`: remover a constante.
- [ ] **Step 3: Paralelismo.** `arq-envio` e `comecarSubida` usam `emParalelo` com `SIMULTANEOS`.
- [ ] **Step 4: Verificar.** Run: `node --test tests/` (PASS) e o parse do script inline (o mesmo comando usado na correção do authuser: extrair o maior `<script>` e `node --check`). Manual com `node dev.mjs`: enviar 4 arquivos grandes de uma vez em Arquivos. Esperado: 3 barras andando juntas e a quarta começando quando uma termina. Na aba Network, 1 PUT por arquivo. Desligar o Wi-Fi por 10 s no meio de um arquivo: ao voltar, o mesmo arquivo continua de onde estava, sem voltar a 0%.
- [ ] **Step 5: Commit**

```bash
git add edicao.html
git commit -m "feat: envio em um único PUT com retomada e 3 arquivos ao mesmo tempo"
```

---

### Task 4: Baixar pasta e arquivo direto para o disco

**Files:**
- Modify: `edicao.html` (topo: botão/chip da conta Google do editor; aba Arquivos: "Baixar pasta" e "Baixar"; novo bloco `// ---- download direto do Google`; diálogo de progresso)

**Interfaces:**
- Consumes: `nomeWindows`, `nomesUnicos`, `planoRetomada`, `tokenValido`, `ehNativoGoogle` (Task 1); `GET /api/drive/meu-token`, `estado.google_editor`, `/api/google/login?token=` e o retorno `?google=` (Task 2); `emParalelo`, `SIMULTANEOS` (Task 3); `GET /api/drive?pasta=<id>` (existente: `{ pasta, caminho, itens:[{id,nome,tipo,mime,tamanho}] }`).
- Produces:
  - `async function tokenDownload(forcar = false) -> string`: guarda `{token, expira_em}` em memória e usa `tokenValido`. Se vier `409 google_editor`, mostra o aviso "Conecte sua conta Google para baixar." com o botão de conectar.
  - `async function baixarPara(item, dirHandle, nomeNoDisco, aoProgredir)`: um arquivo, com `planoRetomada` + `Range`, `keepExistingData` + `seek`, `acknowledgeAbuse` em `403 cannotDownloadAbusiveFile` e uma renovação de token em 401.
  - `async function baixarPasta(pastaId)` e `async function baixarArquivo(item)`.
  - Estado do diálogo `BAIXA = { fase: 'montando'|'baixando'|'feito'|'erro', total, baixado, feitos, pulados, nativos, falhas: [], atuais: Map }`.

- [ ] **Step 1: Conta Google do editor no topo.** Em `renderTopo` (editor): se `DRIVE.google_editor` existe, mostrar um chip com o e-mail. Se não, o botão "Conectar minha conta Google" leva a `/api/google/login?token=<sessão>`. Tratar `?google=ok|cancelado|erro` em `iniciar()` com `aviso` e `history.replaceState`, como já é feito com `?drive=`.
- [ ] **Step 2: Download de arquivo.** "Baixar" (quando `'showSaveFilePicker' in window`) vira um botão `data-baixar="<id>"` que chama `baixarArquivo`. Sem a API, continua o link `noDrive(a.download)`. O `fetch` é `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true` com `Authorization: Bearer`, e o `response.body` passa por um `TransformStream` que conta bytes antes do `pipeTo(writable)`.
- [ ] **Step 3: Download de pasta.** Botão "Baixar pasta" na `arq-barra` (só com `'showDirectoryPicker' in window`). Fluxo: `showDirectoryPicker({ mode: 'readwrite', id: 'daime-baixar' })` → fase `montando`, percorrendo a árvore pela API existente e montando `[{item, caminho: [nomes no disco], nomeNoDisco}]` com `nomesUnicos` por pasta → cria a pasta raiz com `nomeWindows(pasta.nome)` e as subpastas (`getDirectoryHandle(n, {create:true})`) → `emParalelo(arquivos, baixarPara)`. Os nativos do Google são contados em `nativos` e não baixados. `beforeunload` fica ligado enquanto `baixando`.
- [ ] **Step 4: Diálogo de progresso.** `<dialog id="dlg-baixar">`, no mesmo estilo de `renderSubir`: "X GB de Y GB · N de M arquivos", os arquivos em andamento com barra, pulados ("já estavam no computador"), "N arquivos do Google Docs não foram baixados", falhas com "Tentar de novo", que roda de novo só as falhas e, graças a `planoRetomada`, continua as parciais.
- [ ] **Step 5: Verificar.** Run: `node --test tests/` (PASS) e `node --check` do script inline. Manual no Chrome com `node dev.mjs`, logado como editor, conta Google conectada:
  - (a) Baixar pasta de uma casa: aparecem a pasta com o nome da casa e as subpastas iguais ao Drive, com tamanhos iguais aos da lista.
  - (b) Repetir na mesma pasta do disco: tudo "já estava no computador" e quase nada baixado.
  - (c) Fechar a aba no meio de um vídeo grande e baixar de novo: o vídeo continua (Network mostra `Range: bytes=N-` e status 206).
  - (d) "Baixar" num arquivo pede onde salvar e salva sem abrir o Drive.
  - (e) Nenhuma requisição grande para `/api/`, só para `googleapis.com`.
- [ ] **Step 6: Commit**

```bash
git add edicao.html
git commit -m "feat: baixar pasta e arquivo direto para o computador com a conta Google do editor"
```

---

### Task 5: Publicar e passos manuais

**Files:**
- Modify: `docs/superpowers/plans/2026-11-23-espaco-edicao.md` (próximos passos: marcar as transferências e listar os passos manuais)

- [ ] **Step 1: Migração.** Com o OK do dono, aplicar `supabase/migrations/20261123_drive_editor.sql` no projeto daime-prospeccao. Verificar com `select count(*) from public.drive_editor;` → `0`.
- [ ] **Step 2: Passo do dono no Google Cloud.** Listar para o dono: adicionar o e-mail Google do Rafael em "Público-alvo → Usuários de teste" na tela de permissão OAuth. Nenhuma URL de retorno nova (o callback é o mesmo).
- [ ] **Step 3: Push** (com o OK do dono). `git push origin main`. Esperado: status `Vercel – site` = success no commit.
- [ ] **Step 4: Teste em produção** dos itens (a), (d) e (e) da Task 4 e de um envio de 4 arquivos (Task 3).
- [ ] **Step 5: Commit da documentação.**

```bash
git add docs/superpowers/plans/2026-11-23-espaco-edicao.md
git commit -m "docs: transferências como no Cyberduck publicadas; passos manuais"
```
