---
name: Daime Filmes
description: "O nome como monumento: areia de praia, o azul das portas de Trancoso e o nome DAIME FILMES como título de filme"
colors:
  ground: "#ECE3D3"
  surface: "#E0D3BC"
  surface-2: "#D3C4A9"
  ink: "#123C8C"
  ink-deep: "#0C2C6B"
  ink-mid: "#34549F"
  muted: "#3D5D9C"
  paper: "#F3EDE2"
typography:
  display:
    fontFamily: "Switzer, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: "0.76"
    letterSpacing: "-0.06em"
  heading:
    fontFamily: "Switzer, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: "0.98"
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Switzer, system-ui, sans-serif"
    fontSize: "19px"
    lineHeight: "1.5"
rounded:
  pill: "999px"
  md: "clamp(20px, 2.2vw, 32px)"
  lg: "clamp(28px, 3.4vw, 52px)"
spacing:
  margin: "clamp(16px, 2.4vw, 32px)"
  section: "clamp(120px, 15vw, 220px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "15px 24px"
  button-on-photo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "15px 24px"
---

# Design System — Daime Filmes

## Overview
Direção "O nome como monumento" (Taste Skill, seed 1407257202), escolhida pelo cliente em 2026-11-10 entre três amostras (ver `_direcoes/`). O nome é a manchete: "DAIME FILMES" fica na base do hero, à esquerda, com "Produtora audiovisual" logo abaixo (os dois dentro do `h1`), e volta cortado no rodapé. Depois do hero a página é calma e tipográfica, para o contraste com o monumento se manter.

A ideia vem do lugar: areia de praia como fundo e o azul das portas e janelas de Trancoso como única tinta. Serve tanto à produtora geral quanto ao foco em imóveis.

## Colors
- **Ground `#ECE3D3` (areia):** fundo de toda a página. Escolha deliberada, tirada do tema; não trocar por off-white genérico.
- **Ink `#123C8C` (azul de porta):** todo o texto, os botões e o rodapé. Não há preto nem segunda cor de destaque.
- **Surface `#E0D3BC` / `#D3C4A9`:** degraus de tom para separar superfícies (quadro do vídeo, linhas do contato, plano Essencial). Nunca linhas finas nem sombras.
- **Ink-mid `#34549F` / Ink-deep `#0C2C6B`:** só nos blocos de planos e em hovers.
- **Muted `#3D5D9C`:** texto secundário (5,2:1 sobre a areia).
- **Paper `#F3EDE2`:** texto e botão sobre foto e sobre azul.

## Typography
Uma família só: **Switzer** (Fontshare), pesos 400, 500 e 600. Cinco tamanhos na página inteira:
- **Nome:** "DAIME FILMES" a `clamp(52px, 10.4vw, 210px)` no hero (13.6vw no celular) e 14.6vw, cortado, no rodapé; 600, tracking -0.055em. O cliente achou o "DAIME" de ponta a ponta (33vw) exagerado em 2026-11-10: não voltar a esse tamanho.
- **Título:** `clamp(2rem, 1.3rem + 3.2vw, 4rem)`, 600, tracking -0.04em. Títulos de seção, nomes dos trabalhos, etapas, linhas de contato.
- **Lead:** `clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)`.
- **Corpo:** `clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)`, leading 1.5.
- **Pequeno:** 15px.

Sem maiúsculas espaçadas, sem itálico de destaque, sem monoespaçada. Títulos em até duas linhas em qualquer largura.

## Layout
- Uma margem externa igual dos dois lados (`--m`); seções separadas por 120–220px.
- Cada seção tem composição própria: o filme institucional largo em cima e, abaixo, uma faixa de seis vídeos que se abre ao passar o mouse (flex-grow de 1 para 1.85, só transform/flex) — no celular, duas colunas em 9:16 (trabalhos), foto 4:5 + texto (sobre), segunda grade de arcos com seis vídeos de casas, com o desencontro invertido (imóveis), linhas em escada (método), blocos que sobem como gráfico (planos), linhas em tamanho de título (contato).
- Sem cartões com ícone, sem numeração 01/02/03, sem rótulos acima dos títulos.

## Shape
Formas arredondadas e orgânicas (pedido do cliente em 2026-11-10, no lugar dos cantos retos):
- **Arco** (`--arch`: topo em semicírculo, base com raio médio): a forma-assinatura, tirada das portas e janelas coloniais. Usado só nos vídeos de casas e na foto da seção Sobre. Os trabalhos NÃO usam arco: retângulos de cantos largos (o cliente pediu, em 2026-11-11, uma forma diferente da seção de casas).
- **Pílula** (`999px`): botões, menu fixo, linhas do contato, botão Fechar.
- **Raio médio / grande** (`--r`, `--r-lg`): painéis de vidro, fotos, blocos de planos, base do hero, topo do rodapé.

## Texture
Textura de TV antiga sobre a página inteira (`html::before`, fixa, sem cliques, estática): grade de pontos claros de 1,5px a cada 3px, com os vãos levemente escuros — `radial-gradient(at 20% 80%, rgba(255,255,255,.07) 1.5px, rgba(0,0,0,.049) 0) 0 0/3px 3px`. Inspirada em timeset.com.br, mas mais forte: a receita deles (`plus-lighter` a 4%) só clareia e some sobre a areia. Força reduzida em 30% a pedido do cliente (era .10/.07). A camada escurece a areia em cerca de 3%; para ajustar, mude os dois valores juntos.

## Glass
Vidro (fundo translúcido + `backdrop-filter`) é permitido, a pedido do cliente, em quatro lugares e só neles:
- Menu fixo: transparente no topo; ao rolar, areia a 80% com desfoque de 18px.
- Frase do hero e legendas dos vídeos: azul-noite a 42–50% com desfoque, texto em `paper`.
- Fundo do player: azul-noite a 88% com desfoque.
No celular as legendas dos vídeos não usam desfoque (fundo a 72%), para ficar leve. O texto sobre vidro precisa passar em contraste AA.

## Imagery
- Só material próprio. As fotos de varanda, porta, mesa e coco NÃO são do cliente e saíram do site em 2026-11-10 (os arquivos continuam em `img/`, sem uso): não reutilizar. Falta confirmar se a foto do hero (`p1raia`) e a da correção de cor (`9682`) são dele.
- Vídeos de casas: versões leves para web em `videos/` (720×1280, H.264, 6–17 MB), geradas a partir dos originais em `comercial/videos/`; capas em `img/capas/`.
- **Cada vídeo aparece no formato em que foi filmado:** a miniatura e o player assumem a proporção de `--ar` / `data-ar` (9:16 = 0.5625; scope ≈ 2.1). Vídeo novo: copiar um `<li class="tile">` em `#grid` (tira dos trabalhos) ou `#grid-casas` e trocar `data-src`, `data-t` (segundo inicial da prévia), `--ar`, `data-ar` e a capa em `img/capas/`.
- Véu escuro neutro permitido apenas sob texto em cima de foto (hero).

## Motion
Bibliotecas locais em `vendor/`: GSAP 3.12.5 + ScrollTrigger e Lenis 1.1.14. Só `transform` e `opacity`.
- **Entrada (uma sequência):** a foto assenta de 1.12 para 1, o nome sobe por trás da máscara (CSS, já no primeiro quadro), depois frase, botão e menu.
- **Rolagem:** Lenis só no computador; revelação em cascata (`.rv`, 80ms entre itens, uma vez); parallax leve no hero, na foto da seção Sobre (`data-parallax`) e no nome do rodapé (só no computador); barra de progresso no topo.
- **Menu:** vidro ao sair do topo, some ao descer e volta ao subir.
- **Vídeos:** capa em imagem, `preload="none"`, o arquivo só é baixado na primeira prévia. Prévia sem som ao passar o mouse (computador) ou no vídeo mais central da tela (celular), uma por vez. O player cresce a partir da miniatura e volta para ela.
- **Microinterações:** botões sobem 3px e afundam no clique; links com sublinhado que desliza; legendas e setas respondem ao mouse.
- **Curva:** `cubic-bezier(.16,1,.3,1)` / `expo.out`.
- **`prefers-reduced-motion`:** site estático, sem Lenis, sem prévias. Sem JavaScript o conteúdo também aparece inteiro.
- Nada se move em volta de um vídeo que está tocando.

## Do / Don't
- **Do:** preencher espaço com escala, conteúdo real e fotos próprias.
- **Don't:** gradientes decorativos, sombras em repouso, vidro fora dos quatro usos acima, bordas finas, cantos retos, segunda cor de destaque, âmbar/terracota (identidade anterior, guardada em `_direcoes/index-anterior.html`).
