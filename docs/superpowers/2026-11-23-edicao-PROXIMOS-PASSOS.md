# Espaço de Edição — onde paramos (23/11/2026)

Leia também: `docs/superpowers/specs/2026-11-23-espaco-edicao-design.md` e `PRODUCT.md` (seção "Espaço de Edição").

## Feito
- Branch `feat/edicao` (ainda NÃO está na `main` nem publicado): `edicao.html`, `edicao-logica.js`, funções `api/` (Drive, envio, vídeo, versões, criar pasta), `dev.mjs` (servidor local em http://localhost:3005), testes em `tests/` (`node --test tests/*.test.mjs`).
- Banco (Supabase daime-prospeccao): migração `supabase/migrations/20261123_edicao.sql` já rodada. Editor **Rafael** (rahfahh@gmail.com) cadastrado em `editores`.
- `.env.local` preenchido (fora do git e do `.vercelignore`). Google Cloud: retorno `http://localhost:3005/api/google/callback` e `https://daimefilmes.com.br/api/google/callback` adicionados no cliente OAuth do BH; daimefilmes@gmail.com como usuário de teste.
- Drive da daimefilmes conectado pelo localhost (a conexão fica no banco, vale também online).
- "Subir casa" (pasta inteira do computador → Drive) feito; falta o Cainan testar com uma pasta pequena.

## Falta
1. Testar "Subir casa" e o envio de arquivo no localhost (o envio direto do navegador para o Google ainda não foi testado).
2. Vercel → projeto do site → Settings → Environment Variables (Production): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (iguais ao `.env.local`), `ASSINATURA_SECRET` (valor NOVO, aleatório) e `SITE_URL=https://daimefilmes.com.br`.
3. Juntar `feat/edicao` na `main`, `git push` e publicar (o site parece ser publicado pela Vercel CLI: `npx vercel --prod`; confirmar no painel da Vercel se o projeto está ligado ao GitHub).
4. Testar online e mandar o link para o Rafael (daimefilmes.com.br → Entrar).
5. Opcional: publicar o app no Google Cloud (Público-alvo → Publicar app) para o acesso ao Drive não expirar a cada 7 dias.

## Depois
- Painel de prospecção: criar a opção de **responder ao lead que respondeu** (pedido do Cainan).
- Ligação com o BH Analytics: vídeo aprovado na Edição → Aprovação vídeos da Thereza (combinado para depois).
