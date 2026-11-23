# Vídeo de aprovação no Cloudflare R2 (Edição) — design

Data: 23/11/2026 · Escolhido na conversa: envio único com link assinado (1A) e limpeza diária pela Vercel (2A).

## Por quê
As casas e o vídeo final continuam no Drive, mandados pelo Cyberduck. Já os vídeos de **aprovação** (V1, V2…) só servem para a revisão. Hoje eles vão para a "06 Saída" da casa no Drive e enchem o Drive com versões descartáveis. Eles passam a ficar na plataforma, no Cloudflare R2, como no BH (`src/app/api/upload-url/route.ts` do repositório cainanconstantino23-wq/BH), e somem sozinhos 1 mês depois da aprovação.

## Objetivos
1. Em "Enviar versão" (aba Vídeo), o editor manda o vídeo **para o R2**, não para o Drive. O progresso aparece no painel de transferências (MB/s, tempo restante).
2. O player toca as versões do R2 por um link assinado temporário. O bucket é privado.
3. Excluir uma versão, ou uma tarefa, apaga os vídeos dela no R2 na hora.
4. Uma vez por dia, versões de tarefas aprovadas há mais de 30 dias perdem o vídeo no R2. A versão, a nota e os comentários continuam, e o player mostra "Vídeo removido em DD/MM (1 mês depois da aprovação)".

## Fora
- Casas, brutas e vídeo final: continuam pelo Cyberduck. O site não sobe nem baixa nada disso.
- Envio em partes (multipart) e continuação de envio interrompido: só se o envio único se mostrar lento (decisão 1A).
- Versões antigas que já estão no Drive (`drive_file_id`) continuam tocando pelo caminho de hoje (`/api/drive/video`). "Enviar para revisão" na aba Arquivos, que pega um vídeo que já está no Drive, continua existindo.
- Integração com o Cyberduck: removida a pedido.

## Anti-objetivos
- Chave do R2 no navegador. Só o servidor assina.
- Bucket público. Vídeos de cliente não ficam acessíveis por endereço fixo.
- Vídeo passando pela Vercel.
- Apagar qualquer coisa no Drive.

## Abordagens consideradas
- **Envio:**
  - **Envio único com link assinado (escolhido),** igual ao BH.
  - Multipart: fica para depois, se o MB/s medido no painel for ruim.
- **Limpeza:**
  - **Tarefa diária na Vercel (escolhida),** que registra a remoção no site.
  - Regra de validade do R2: conta a partir do envio, não da aprovação, e o site não ficaria sabendo da remoção.
- **Assinatura:**
  - **SigV4 escrita à mão em `api/_lib/r2.mjs` (decisão do Claude),** porque o site não tem dependências, enquanto o BH usa `@aws-sdk/client-s3`. A função é testada contra o vetor oficial da AWS para link assinado.

## Como funciona

### Configuração (passo do dono, uma vez)
- **Bucket R2 privado `daime-edicao`,** na conta Cloudflare.
- **Token de API do R2** com "Object Read & Write" só nesse bucket, que gera o Access Key ID e o Secret.
- **CORS do bucket:**
  - origens `https://www.daimefilmes.com.br`, `https://daimefilmes.com.br` e `http://localhost:3005`;
  - métodos `PUT`, `GET` e `HEAD`;
  - cabeçalhos permitidos `content-type`;
  - cabeçalho exposto `ETag`.
- **Variáveis** em `.env.local` e na Vercel:
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=daime-edicao`;
  - `CRON_SECRET`, um texto aleatório que a Vercel manda no cron.

### Banco (migração `supabase/migrations/20261123_versoes_r2.sql`, rodada pelo dono no SQL Editor)
- `versoes.drive_file_id` passa a aceitar nulo.
- Colunas novas em `versoes`: `r2_key text` e `video_removido_em timestamptz`.
- `check (drive_file_id is not null or r2_key is not null)`.

### Servidor
- **`api/_lib/r2.mjs`** (testado):
  - `assinarUrl({ metodo, chave, segundos, agora })`: link SigV4 *query-string* para `https://<conta>.r2.cloudflarestorage.com/<bucket>/<chave>`, região `auto`, serviço `s3`, cabeçalho assinado só `host`, `UNSIGNED-PAYLOAD`.
  - `presign(...)`: função pura com as credenciais por parâmetro, para o teste com o vetor da AWS.
  - `apagar(chave)`: DELETE assinado feito pelo servidor; 204 ou 404 contam como apagado.
  - `existe(chave)`: HEAD assinado que devolve o tamanho ou null.
- **`POST /api/r2/envio { tarefa, nome, tipo, tamanho }`** (dono ou editor):
  - A tarefa precisa existir e não estar aprovada.
  - O arquivo precisa ser vídeo (`video/*`), com tamanho entre 1 byte e 5 GB (`5 * 1024 ** 3`). O limite é o do envio único do R2.
  - Chave: `edicao/<tarefa>/<Date.now()>-<aleatório>.<ext>`.
  - Devolve `{ url, chave }`, com o link de PUT válido por 1 hora.
- **`POST /api/tarefas/versao { tarefa, r2: chave, nome, nota }`:**
  - A chave precisa começar com `edicao/<tarefa>/`, e `existe(chave)` precisa confirmar o envio, devolvendo o tamanho.
  - Grava a versão com `r2_key`, `nome` e `tamanho`.
  - Status e evento ficam como no fluxo do Drive.
  - O fluxo atual com `arquivo` (Drive) continua para "Enviar para revisão".
- **`GET /api/tarefas/versao?tarefa=`:**
  - Versão com R2 e sem `video_removido_em`: devolve `video` = link GET assinado por 6 horas.
  - Versão removida: devolve `removido: <data>`.
  - Versão do Drive: como hoje.
- **Exclusões passam pelo servidor**, para apagar no R2:
  - **`DELETE /api/tarefas/versao?tarefa=&numero=`:**
    - Lê a `r2_key`.
    - Chama a RPC `excluir_versao` **com o token do próprio usuário** (`/rest/v1/rpc/...` com a chave pública + `Authorization` do usuário), para a regra de permissão continuar no SQL.
    - Se a RPC deu certo, apaga no R2.
  - **`DELETE /api/tarefas?id=`:** a mesma coisa com `excluir_tarefa` e todas as `r2_key` da tarefa.
  - Se apagar no R2 falhar depois que a RPC passou: registra no log e segue. Fica um objeto órfão, aceitável.
- **`GET /api/cron/limpar-r2`:**
  - Exige `Authorization: Bearer ${CRON_SECRET}`.
  - Busca as versões com `r2_key`, sem `video_removido_em`, cuja tarefa está `aprovado` e cujo evento `aprovada` mais recente tem mais de 30 dias.
  - Apaga cada uma no R2 e marca `video_removido_em = now()`.
  - Responde `{ removidos: n }`.
  - O critério de seleção é uma função pura testada (`paraRemover(versoes, eventos, agora)`).
- **`vercel.json`:** `{ "crons": [{ "path": "/api/cron/limpar-r2", "schedule": "0 6 * * *" }] }`, ou seja, 03h no horário de Brasília. O plano Hobby permite 1 por dia.

### Página (`edicao.html`)
- **"Enviar versão":**
  - Pede `/api/r2/envio`.
  - Faz o PUT com `XMLHttpRequest` (progresso no painel de transferências) e `Content-Type` do arquivo.
  - Depois registra a versão com `{ r2: chave }`.
  - Se falhar: "Tentar de novo" recomeça o envio. Não há continuação de envio interrompido (decisão 1A).
  - Texto: "O vídeo fica na plataforma para a revisão (não vai para o Drive). Some 1 mês depois da aprovação."
- **Player:** versão com `removido` mostra "Vídeo removido em DD/MM (1 mês depois da aprovação)" no lugar do vídeo.
- **Excluir versão e excluir tarefa:** passam a chamar os `DELETE` acima, em vez de `SB.rpc`.

## Restrições
- Sem dependências. Node `crypto` para HMAC/SHA-256.
- Testes com `node --test tests/*.test.mjs`. A lógica pura vai em `api/_lib/` e `edicao-logica.js`.
- Testar no local (`node --watch dev.mjs`, http://localhost:3005) antes de publicar. É preferência do dono.

## Fica a critério de quem construir
- Visual da mensagem "vídeo removido" e textos dos avisos.
- Nome exato das funções internas da página.
