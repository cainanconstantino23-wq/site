# PRODUCT.md — Daime Filmes

## Product
- **Name:** Daime Filmes
- **Tagline:** Cinema com estratégia. Audiovisual para marcas e imóveis.
- **Positioning:** Produtora audiovisual completa (institucional, Reels, eventos, gastronomia, esporte) com linguagem cinematográfica e foco em resultado. Em especialização no mercado imobiliário: tours cinematográficos de imóveis, lançamentos e conteúdo para imobiliárias e corretores.
- **Core Value Proposition:** Qualidade técnica de cinema (4K, luz, cor, áudio) somada a roteiro, estratégia de posicionamento e distribuição. Vídeo pensado para gerar contatos, visitas e fechamentos, não só alcance.

## Users & Jobs
- **Primary Users/Clients:** Empresas e marcas locais (sul da Bahia / Trancoso e região) que precisam de presença audiovisual; cada vez mais imobiliárias, corretores, incorporadoras e casas de alto padrão para venda ou locação por temporada.
- **Job-to-be-done:** Fazer o negócio (ou o imóvel) parecer tão desejável quanto ele é, elevar a percepção de valor no digital e transformar atenção em contato qualificado.
- **Not the audience:** Clínicas/saúde deixaram de ser o foco (cases existentes, como o estúdio de pilates, seguem no portfólio como trabalho real).

## Scope & Surfaces
- **Landing Page Principal (`index.html`):** Posicionamento, método, carrossel de portfólio, diferenciais, processo/serviços, planos e contato.
- **Propostas comerciais (`comercial1.html`, `mario.html`, `bahiahomes.html`):** Apresentações personalizadas por cliente. `comercial1.html` ainda tem copy antiga voltada a clínicas.
- **Geração de leads:** WhatsApp e e-mail (daimefilmes@gmail.com).

## Platform
web

## Stack
- **Markup:** HTML5 / JavaScript puro, com GSAP + ScrollTrigger e Lenis locais em `vendor/`
- **Styling:** CSS puro no próprio `index.html` (sem Tailwind/CDN)
- **Typography:** Switzer (Fontshare), uma família só
- **Media:** HTML5 video, imagens locais em alta resolução
- **Icons:** SVG inline

## Key Directives & Constraints
- **Tom de voz:** Sofisticado, seguro, cinematográfico, direto. Fala de "clientes", "marca", "empreendimento", nunca de "pacientes".
- **Imobiliário:** vender pelo desejo e pela atmosfera (luz, arquitetura, estilo de vida), não por listas de metragem.
- **Estética visual:** ver DESIGN.md (areia + azul das portas de Trancoso, o nome DAIME como título de filme).

## Espaço de Edição (`edicao.html`, nov/2026)
- Um login só em `painel.html`: dono (tabela `donos`) fica no painel de prospecção, que tem a aba **Edição**; editor (tabela `editores`) vai direto para `edicao.html`. Função `papel()` no Supabase.
- Tarefas por casa (pasta do Drive dentro da pasta de trabalho), etapas A fazer · Em edição · Para revisar · Ajustes pedidos · Reenviado · Aprovado (`edicao-logica.js`, testes em `tests/`).
- Drive da conta daimefilmes conectado pelo dono (OAuth, tokens em `drive_conexao`, só o servidor lê). Funções Vercel em `api/` (sem dependências): listar pastas, envio "resumable" direto do navegador para o Google, vídeo em partes com link assinado, registrar versão. Regra: o app nunca apaga, move ou renomeia nada no Drive.
- Entrega do editor vai para a pasta `06 Saída` da casa (criada se faltar) e vira V1, V2…; o dono comenta no minuto do vídeo, pede ajustes ou aprova.
- Banco: `supabase/migrations/20261123_edicao.sql` (rodar no SQL Editor do projeto daime-prospeccao).
- Local: preencher `.env.local` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_SERVICE_ROLE_KEY, ASSINATURA_SECRET, SITE_URL) e rodar `node dev.mjs` → http://localhost:3005. Na Vercel: as mesmas variáveis (SITE_URL = https://daimefilmes.com.br).
