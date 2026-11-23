# Espaço de Edição — onde paramos (23/11/2026)

Leia também: `docs/superpowers/specs/2026-11-23-espaco-edicao-design.md` e `PRODUCT.md` (seção "Espaço de Edição").

## Feito
- Branch `feat/edicao` (ainda NÃO está na `main` nem publicado): `edicao.html`, `edicao-logica.js`, funções `api/` (Drive, envio, vídeo, versões, criar pasta), `dev.mjs` (servidor local em http://localhost:3005), testes em `tests/` (`node --test tests/*.test.mjs`).
- Banco (Supabase daime-prospeccao): migração `supabase/migrations/20261123_edicao.sql` já rodada. Editor **Rafael** (rahfahh@gmail.com) cadastrado em `editores`.
- `.env.local` preenchido (fora do git e do `.vercelignore`). Google Cloud: retorno `http://localhost:3005/api/google/callback` e `https://daimefilmes.com.br/api/google/callback` adicionados no cliente OAuth do BH; daimefilmes@gmail.com como usuário de teste.
- Drive da daimefilmes conectado pelo localhost (a conexão fica no banco, vale também online).
- "Subir casa" (pasta inteira do computador → Drive) feito; falta o Cainan testar com uma pasta pequena.

## Publicado (23/11/2026)
- `feat/edicao` juntado na `main` e publicado (Vercel ligada ao GitHub `cainanconstantino23-wq/site`: cada push na `main` publica sozinho).
- Variáveis de produção na Vercel (projeto `site`): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_SERVICE_ROLE_KEY, ASSINATURA_SECRET (valor próprio da produção) e SITE_URL=https://daimefilmes.com.br. Mudou variável? Precisa republicar (`npx vercel redeploy <url da última produção> --target production`).
- Testado online como dono: edicao.html abre, Drive conectado, a aba Arquivos lista os arquivos da casa pelo servidor.

## Falta
1. Testar online "Subir casa", "Enviar arquivos" e "Enviar para revisão" (envio direto do navegador para o Google ainda não foi testado).
2. Mandar o link para o Rafael (daimefilmes.com.br → Entrar) e ver ele entrar como editor.
3. Opcional: publicar o app no Google Cloud (Público-alvo → Publicar app) para o acesso ao Drive não expirar a cada 7 dias.

## Depois
- Painel de prospecção: criar a opção de **responder ao lead que respondeu** (pedido do Cainan).
- Ligação com o BH Analytics: vídeo aprovado na Edição → Aprovação vídeos da Thereza (combinado para depois).
