# Espaço de Edição (Daime Filmes) — design

Data: 23/11/2026 · Aprovado na conversa (layout da prévia "Aprovação vídeos" do BH Analytics).

## Por quê
Hoje o trabalho com o editor passa por Cyberduck + WhatsApp: Cainan sobe as brutas no Drive, o editor baixa, edita no Premiere, sobe o vídeo em `06 Saída` e as alterações vão por mensagem. Falta um lugar único com as tarefas, os arquivos de cada casa, o vídeo para assistir e as alterações registradas por versão — no mesmo jeito da aprovação da Thereza no BH Analytics.

## Quem usa
- **Dono** (Cainan, conta do painel): cria tarefas, assiste, pede ajustes com o minuto do vídeo, aprova.
- **Editor** (conta própria): vê as tarefas, navega e baixa os arquivos da casa, envia o vídeo pronto, vê os ajustes pedidos.

## Objetivos
1. Login único em `painel.html`: dono → painel de prospecção (com aba **EDIÇÃO** que leva a `edicao.html`); editor → direto para `edicao.html`; outras contas → barradas como hoje.
2. Conexão com o Google Drive da conta **daimefilmes**, feita uma vez pelo dono.
3. `edicao.html` com o layout e as cores da Aprovação vídeos do BH (tema "Mar de Espelho"): linha do tempo de etapas no topo, fila com grupos recolhíveis (fechados ao entrar), detalhe à direita com abas **Vídeo · Arquivos · Linha do tempo**.
4. Navegador de arquivos ("Cyberduck") das pastas da casa: listar, abrir/baixar pelo Drive, enviar arquivos (grandes) para a pasta aberta.
5. Versões: cada vídeo enviado para revisão vira V1, V2…; o dono assiste na página e comenta com o minuto; pede ajustes ou aprova.

## Fora (agora)
- Ligação com o BH Analytics (enviar o aprovado para a Thereza) — depois.
- Vários editores com tarefas atribuídas; notificações por e-mail/WhatsApp.
- Apagar, mover ou renomear qualquer coisa no Drive (regra: o app só lista, lê e cria/envia).

## Anti-objetivos
- Vídeo bruto passando pelo servidor do site para download (lento e caro): download é sempre direto no Drive.
- Chave do Google ou chave de serviço do Supabase dentro das páginas.

## Abordagens consideradas
- **Funções de servidor na Vercel dentro do próprio repositório do site (escolhida).** Pasta `api/` com funções Node sem dependências (fetch direto para Google e Supabase). Reaproveita a lógica de Drive do BH Analytics; banda da Vercel aguenta assistir vídeos (repasse em partes).
- Supabase Edge Functions (como `prospectar`): descartada para o Drive porque o vídeo assistido passaria pela cota de tráfego do Supabase (5 GB no plano grátis).
- App Next.js novo: descartada — o site é HTML puro e o pedido é uma página no mesmo painel.

## Como funciona
### Contas e papéis (Supabase do painel, projeto daime-prospeccao)
- Tabela `editores (user_id pk → auth.users, nome, criado_em)`.
- Função `papel()` → `'dono' | 'editor' | null` (security definer, como `eh_dono`).
- `painel.html` no `boot()`: `papel()`; dono segue como hoje; editor → `location.replace('edicao.html')`; null → sai e mostra "Esta conta não tem acesso ao painel."
- `edicao.html` sem sessão → `painel.html` (o login é só lá). Dono vê "‹ Prospecção" no topo; editor vê "Sair".
- Conta do editor: criada pelo dono no Supabase (Auth → Add user) + linha em `editores`.

### Drive
- Google OAuth (escopo `drive`, `access_type=offline`), feito pelo dono em `edicao.html` → `/api/google/login` → `/api/google/callback`. Tokens em `drive_conexao` (linha única, RLS sem políticas: só a chave de serviço lê).
- **Pasta raiz**: o dono escolhe a pasta de trabalho (ex.: `BAHIA HOMES/Casas`) na primeira vez; guardada em `drive_conexao.raiz_id/raiz_nome`. Toda chamada confere que o arquivo/pasta está dentro da raiz (subindo pelos `parents`, com cache curto).
- Listagem: `/api/drive?pasta=<id>` → pastas e arquivos (nome, tipo, tamanho, data, link do Drive).
- Baixar: link direto do Drive (`drive.google.com/file/d/<id>/view` e download em `drive.usercontent.google.com/download?id=<id>&export=download`); o editor já tem as pastas compartilhadas na conta Google dele. Pasta inteira: "Abrir no Drive".
- Enviar: `/api/drive/envio` cria uma sessão de envio "resumable" do Google na pasta aberta (com o cabeçalho `Origin` do site) e devolve a URL; o navegador manda o arquivo em partes de 16 MB direto ao Google com barra de progresso e retomada. Só cria arquivos novos.
- Assistir: `/api/drive/video?id=<id>&t=<assinatura>` repassa o vídeo em partes (Range, no máx. 8 MB por resposta). A assinatura (HMAC com `ASSINATURA_SECRET`, validade 6 h) vem na resposta da tarefa, porque o `<video>` não manda cabeçalho de login.
- Variáveis na Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ASSINATURA_SECRET`. O cliente OAuth pode ser o mesmo do BH Analytics, com os endereços de retorno do site adicionados e a conta daimefilmes como usuária de teste (ou o app em produção, para o acesso não expirar a cada 7 dias).

### Tarefas, versões e ajustes (tabelas novas)
- `tarefas (id, casa_pasta_id, casa_nome, tipo, prazo, instrucoes, status 'a_fazer'|'em_edicao'|'para_revisar'|'ajustes'|'aprovado', criada_em, atualizada_em)`.
- `versoes (id, tarefa_id, numero, drive_file_id, nome, tamanho, enviada_por, enviada_em, nota)`.
- `comentarios (id, tarefa_id, versao, tempo_seg null, texto, autor, criado_em)`.
- `eventos (id, tarefa_id, tipo, versao, autor, texto, criado_em)` — linha do tempo (criada, começou, versão enviada, ajustes pedidos, aprovada).
- RLS: dono tudo; editor lê tudo e escreve só pelas funções (RPC security definer): `comecar_edicao(tarefa)`, e pelo servidor: registrar versão (confere o arquivo no Drive dentro da casa). Dono: `pedir_ajustes(tarefa, texto)`, `aprovar(tarefa)`; criar/editar tarefa direto (RLS dono).
- **Etapas na tela** (regra pura `etapaDe(status, nVersoes)`): A fazer · Em edição · Para revisar (V1) · Ajustes pedidos · Reenviado (para revisar com V2+) │ Aprovado.

### Tela `edicao.html`
- Topo: título "Edição", resumo ("8 tarefas · 2 para revisar"), botão **Nova tarefa** (dono) e conexão do Drive (dono: e-mail conectado / Conectar).
- Linha do tempo de vidro com as 6 etapas, ícone colorido, contagem; tocar abre só aquele grupo da fila.
- Fila: grupos recolhíveis fechados ao entrar; linha = miniatura/ícone, casa, tipo, versão, prazo (vermelho se passou) ou o último ajuste pedido, barrinhas do caminho.
- Detalhe:
  - **Vídeo**: player da versão (abas V1/V2…), lista de comentários com minuto (clicar pula para o minuto). Dono: campo "Comentar em 02:14" (captura o tempo atual), **Pedir ajustes** (envia os comentários novos como pedido) e **Aprovar**. Editor: **Enviar nova versão** (escolher arquivo do computador → envia para `06 Saída` e registra) ou escolher um vídeo que já está em `06 Saída` (subido pelo Cyberduck).
  - **Arquivos**: navegador da pasta da casa (caminho clicável, lista estilo Finder com ícone, nome, tamanho, data; pastas primeiro), Baixar/Abrir no Drive por arquivo, **Enviar arquivos** para a pasta aberta (vários, com progresso).
  - **Linha do tempo**: eventos com data/hora da Bahia e autor; ajustes com o texto e os minutos.
- Nova tarefa (dono): escolher a casa navegando dentro da raiz (pastas), tipo (Reels, Pílula, Tour, Carrossel, Outro), prazo, instruções.
- Tema: cores e raios do "Mar de Espelho" do BH (fundo `#eff5f7`, superfície `#fbfdfe`, tinta `#18323a`, destaque `#087a8a`, status verde/amarelo/vermelho/azul e violeta para reenviado), fonte do sistema.

## Restrições
- Site estático em HTML/JS puro; lógica pura em `edicao-logica.js` (carregada pela página e testada em `tests/` como `painel-logica.js`).
- Funções em `api/*.mjs` (assinatura Web `export async function GET(request)`), sem dependências npm. Partes puras em `api/_lib/` com testes.
- Servidor local para testar: `node dev.mjs` (serve os arquivos estáticos e as funções de `api/`), lendo `.env.local` (fora do git).
- Migração SQL em `supabase/migrations/` aplicada no projeto daime-prospeccao.
- Drive: nunca apagar, mover, renomear ou alterar arquivos existentes.

## Decisões minhas (o dono pode corrigir)
- Pasta raiz escolhida uma vez (`BAHIA HOMES/Casas`); a casa da tarefa é uma subpasta dela.
- Pasta de entrega: subpasta da casa cujo nome bate com `06 Saída` (sem acento/maiúsculas); se não existir, é criada.
- Um editor por enquanto (todos os editores veem todas as tarefas).
- Tipos de vídeo: Reels, Pílula, Tour, Carrossel, Outro.

## Fica para o construtor
Detalhes visuais seguindo o BH (VideoStages.tsx / ApprovalSectionOrange.tsx como referência), mensagens de erro, ícones.
