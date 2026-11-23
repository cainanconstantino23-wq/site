# Transferências como no Cyberduck (Edição) — design

Data: 23/11/2026 · Escolhido na conversa: opção 1 (o editor conecta a própria conta Google).

## Por quê
No espaço de Edição o envio é bem mais lento que no Cyberduck. O botão "Baixar" leva o Rafael (editor) para a página do Google Drive, onde ainda acontece o erro 403 quando há várias contas Google no navegador. A ideia é que enviar e baixar funcionem dentro do site, na velocidade do Cyberduck, sem passar pela página do Drive.

## O que o Cyberduck faz (lido no código aberto, `iterate-ch/cyberduck/googledrive`)
- **Envio** (`DriveWriteFeature`): abre uma sessão "resumable" (`POST upload/drive/v3/files?uploadType=resumable`) e manda **o arquivo inteiro num único PUT contínuo** no endereço devolvido em `Location`. Envia vários arquivos ao mesmo tempo.
- **Download** (`DriveReadFeature`): `GET files/<id>?alt=media` com o token da conta logada, gravando direto no disco. Usa `Range: bytes=<início>-` para continuar um download interrompido. Se o Google bloqueia por suspeita de abuso, repete com `acknowledgeAbuse=true`.
- **O site hoje:** a sessão de envio já é a mesma, mas o arquivo vai em partes de 16 MB, cada uma esperando a resposta da anterior (cerca de 250 paradas num vídeo de 4 GB). "Enviar arquivos" manda 1 arquivo por vez e "Subir casa" manda 2. O download é só um link para o Drive.

## Objetivos
1. Envio na velocidade do Cyberduck: um PUT por arquivo, com progresso, retomada se cair e 3 arquivos ao mesmo tempo, em "Enviar arquivos", "Subir casa" e "Enviar versão".
2. O Rafael baixa **a pasta inteira de uma casa**, ou qualquer subpasta, para uma pasta do Windows que ele escolhe, com subpastas, progresso, 3 arquivos ao mesmo tempo e retomada.
3. "Baixar" num arquivo só salva direto no computador, sem abrir o Drive.
4. O Rafael conecta a conta Google dele **uma vez**. O site renova o acesso sozinho.

## Fora
- Safari e Firefox: o editor usa Chrome no Windows. Fora do Chrome/Edge, o botão "Baixar pasta" fica escondido e "Baixar" continua abrindo o Drive, como hoje.
- Baixar arquivos nativos do Google (Docs, Planilhas): são pulados e listados como "não baixados".
- Sincronizar ou apagar no disco: só cria e completa arquivos.
- Mudar a conta do dono ou o jeito como ela é conectada.

## Anti-objetivos
- Arquivo passando pelo servidor do site (Vercel), em qualquer direção.
- O navegador do editor recebendo o acesso da conta **do dono**.
- Sobrescrever um arquivo que o editor já tem no disco com conteúdo diferente sem avisar.

## Abordagens consideradas
- **O editor conecta a conta Google dele (escolhida).** O servidor guarda a renovação do acesso dele, só com permissão de leitura, e entrega ao navegador um acesso curto (1 hora) da conta dele. O navegador baixa direto do Google. Custo: adicionar o e-mail do Rafael uma vez como usuário de teste no Google Cloud.
- Emprestar ao editor o acesso da conta do dono: ele não precisaria conectar nada, mas o navegador dele teria acesso ao Drive inteiro do dono por 1 hora. Descartada.
- Download passando pela Vercel: lento e caro. Já estava descartada no design do espaço de Edição.
- Login do Google só no navegador (Google Identity Services): pede reconexão a cada hora. Descartada em favor da renovação no servidor, que reaproveita o login do dono que já existe (decisão do Claude).

## Como funciona

### 1. Conta Google do editor
- Nova tabela `drive_editor (user_id pk → auth.users, email, refresh_token, access_token, expira_em, atualizada_em)`, com RLS ligado e sem políticas: só a chave de serviço lê, igual a `drive_conexao`.
- `GET /api/google/login?token=…` passa a aceitar o editor. Para o editor, o escopo é `openid email https://www.googleapis.com/auth/drive.readonly`; para o dono, continua o escopo atual. O `state` vai ligado ao usuário: o cookie guarda `state` + `user_id` assinados com `ASSINATURA_SECRET` (`api/_lib/assinatura.mjs`).
- `GET /api/google/callback`: se o usuário do state é editor, grava em `drive_editor` e volta para `edicao.html?drive=ok`. O caminho do dono não muda.
- `GET /api/drive/meu-token` (somente editor): devolve `{ token, expira_em, email }`, renovando quando faltar menos de 5 minutos. Se a renovação falhar, responde `409 { erro: 'google_editor' }`. Isso acontece quando o Rafael revoga o acesso ou quando passam 7 dias com o app em "modo de teste" no Google, e o site mostra "Conectar minha conta Google".
- O dono baixa com o próprio acesso: `meu-token` devolve o token de `drive_conexao` para o dono. Ele já é o dono desse acesso, então não há vazamento.
- No topo de `edicao.html`, para o editor: chip com o e-mail Google conectado, ou o botão "Conectar minha conta Google".

### 2. Download
- **Pasta:** botão "Baixar pasta" na barra da aba Arquivos, para a pasta aberta.
  1. `showDirectoryPicker({ mode: 'readwrite', id: 'daime-baixar' })`. O Chrome lembra a última pasta escolhida.
  2. Monta a árvore chamando a API que já existe, `GET /api/drive?pasta=<id>`, pasta por pasta. Ela já respeita a pasta de trabalho e resolve os atalhos.
  3. Cria no disco uma pasta com o nome da pasta do Drive e, dentro dela, as subpastas.
  4. Fila com 3 trabalhadores. Para cada arquivo:
     - Se já existe no disco com o mesmo tamanho, pula.
     - Se existe menor, continua com `Range: bytes=<tamanho>-` e `createWritable({ keepExistingData: true })` + `seek`.
     - Se existe maior, ou se a resposta não for 206, regrava do zero.
     - Faz `fetch('https://www.googleapis.com/drive/v3/files/<id>?alt=media&supportsAllDrives=true', { headers: { Authorization: 'Bearer ' + token } })` e passa `response.body` com `pipeTo` para o arquivo, contando os bytes para o progresso.
     - Se der 403 com `cannotDownloadAbusiveFile`, repete com `&acknowledgeAbuse=true`.
     - Se der 401, pede um token novo uma vez e tenta de novo.
  5. Arquivos nativos do Google (`application/vnd.google-apps.*`, exceto pastas) são pulados e contados.
- **Arquivo:** "Baixar" usa `showSaveFilePicker({ suggestedName })` e o mesmo download com progresso.
- **Painel de progresso:** reaproveita o diálogo de "Subir casa": total em GB, arquivos feitos, pulados e com falha, os arquivos em andamento, "Tentar de novo" para as falhas e aviso ao fechar a aba durante o download (`beforeunload`).
- **Nomes inválidos no Windows** (`< > : " / \ | ? *`, ponto ou espaço no fim): os caracteres são trocados por `_` no disco. Função pura, testada.

### 3. Envio
- Troca o laço de partes de 16 MB em `continuarEnvio` por **um único PUT do arquivo inteiro**, via `XMLHttpRequest`, porque o `fetch` não informa o progresso do envio. O progresso vem de `xhr.upload.onprogress`.
- Se cair (erro de rede ou 5xx): pergunta onde parou com `PUT` vazio e `Content-Range: bytes */<total>`. O Google responde 308 com `Range: bytes=0-N`, e o envio continua com `arquivo.slice(N+1)` e `Content-Range: bytes N+1-<total-1>/<total>`. São até 5 tentativas, com espera crescente (1, 2, 4, 8, 16 s). Se der 404 ou 410, a sessão expirou: o envio recomeça do zero e o usuário é avisado.
- **3 arquivos ao mesmo tempo:** em "Enviar arquivos" (hoje é 1) e em "Subir casa" (hoje é 2). Um só limite (`SIMULTANEOS = 3`) para os dois.
- A sessão de envio continua sendo criada pelo servidor com a conta do dono (`/api/drive/envio`), sem mudança. O editor não precisa de permissão de escrita.

## Restrições
- Página HTML pura e funções Vercel sem dependências, como o resto. Nada novo para instalar.
- O código de lógica pura (fila, nomes do Windows, cálculo de retomada) vai para `edicao-logica.js`, com testes em `tests/edicao-logica.test.mjs` (`node --test`).
- A regra do Drive não muda: nada é apagado, movido ou renomeado.
- Passos manuais do dono, que vão listados no final da implementação:
  1. Rodar a migração da tabela `drive_editor` no Supabase daime-prospeccao.
  2. Adicionar o e-mail Google do Rafael em "Usuários de teste" na tela de permissão OAuth do Google Cloud.
- O download pelo navegador chama `googleapis.com` direto. A API do Drive aceita isso (CORS) só com o token, sem configuração extra.
- Para o editor, `/api/google/login` e `/api/google/callback` hoje recusam quem não é dono. Os dois passam a aceitar o editor, mas só para gravar em `drive_editor`. A conexão do dono (`drive_conexao`) continua sendo alterada apenas pelo dono.

## Fica a critério de quem construir
- Layout exato do botão "Baixar pasta" e dos textos do painel de progresso, seguindo o visual atual da Edição.
- Como mostrar a velocidade (MB/s) e o tempo restante, se couber sem poluir.
- Organização interna das funções em `edicao.html` e `edicao-logica.js`.
