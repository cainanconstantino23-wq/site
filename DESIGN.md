---
name: Daime Filmes
description: "Sistema Visual Cinematográfico e Direção de Arte para Audiovisual Estratégico"
colors:
  primary: "#C87A2A"
  primary-dark: "#0F1412"
  amber-accent: "#E89A47"
  ember: "#B8531E"
  ink: "#110F0E"
  neutral-bg: "#F8F5F0"
  neutral-card: "#F1ECE4"
  neutral-muted: "#78716C"
typography:
  display:
    fontFamily: "Thunder-Black, Bebas Neue, sans-serif"
    fontWeight: 900
    lineHeight: "0.82"
    letterSpacing: "0.01em"
  serif:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontWeight: 500
  mono:
    fontFamily: "Space Grotesk, monospace"
    letterSpacing: "0.15em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    lineHeight: "1.6"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  xl: "32px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
---

# Design System — Daime Filmes

## Overview
O sistema visual da Daime Filmes foi desenvolvido para transmitir o prestígio de produções cinematográficas de alto nível e a precisão da estratégia de performance para o mercado médico e de saúde premium. A linguagem combina contraste marcante, tipografia editorial dramática, textura sutil de grao de filme (film grain) e acabamentos inspirados em lentes e cinema.

## Colors

### Primary & Accent Roles
- **Primary Amber (`#C87A2A` / `#E89A47`):** Representa o brilho quente das luzes de estúdio e a sofisticação. Utilizado em CTAs principais, detalhes de destaque e estado de hover de cards.
- **Ember Accent (`#B8531E`):** Utilizado para momentos de maior intensidade visual e pontos focalizadores de atração.

### Neutral Surfaces
- **Dark Ink (`#110F0E` / `#0F1412`):** A cor de autoridade e profundidade cinematográfica. Usada em fundos de seções hero, rodapés e cards escuros de alta relevância.
- **Warm Cream Background (`#F8F5F0`):** Fundo suave e tátil de inspiração editorial que substitui o branco frio padrão.
- **Warm Cream Card (`#F1ECE4`):** Superfície elevada para cards e containers claros.
- **Muted Stone (`#78716C`):** Reservado para textos secundários, legendas e rótulos de navegação.

## Typography

### **The Editorial Drama Rule**
Títulos de hero e seções principais devem combinar tipografia Display monumental em caixa alta (`Thunder-Black` / `Bebas Neue`) com serifas editoriais elegantes (`Cormorant Garamond`).

- **Display Headline:** `font-family: 'Thunder-Black', 'Bebas Neue', sans-serif`, `line-height: 0.82`, `text-transform: uppercase`. Expressão máxima de impacto nos títulos.
- **Editorial Serif:** `font-family: 'Cormorant Garamond', Georgia, serif`, usada para criar contraste poético e sofisticação médica.
- **Technical Mono:** `font-family: 'Space Grotesk', monospace`, em tamanho reduzido (10px - 12px) e caixa alta com `letter-spacing: 0.15em - 0.25em` para metadados, números de seção e labels técnicos.
- **Body UI:** `font-family: 'Inter', sans-serif`, peso 400/500 para garantida de legibilidade em blocos de texto e formulários.

## Layout

### **The Frame-in-Frame Rule**
As seções principais do site utilizam a metáfora de quadros de câmera (frames) com bordas bem demarcadas (`border-border`) e cantos suavemente arredondados (`32px` em desktop / `16px` em mobile), contidos dentro de margens internas respiráveis.

- **Grid de Destaques:** 12 colunas em desktop, migrando para layout empilhado responsivo em telas mobile.
- **Carrossel do Portfólio:** Track horizontal com `scroll-snap` e suporte a touch nativo, exibindo os cards com proporções verticais (4:5 / 9:16) inspiradas em reprodução de vídeo social e tela de cinema.

## Elevation & Depth

### **The Film Grain & Glow Rule**
Profundidade é construída via atmosfera de iluminação e textura, ao invés de sombras projetadas genéricas.

- **Film Grain Overlay:** Camada sutil em `SVG turbulence` (`opacity: 0.03 - 0.06`) com `mix-blend-mode` que adiciona textura física e orgânica de pelicula cinematográfica às superfícies.
- **Atmospheric Lighting:** Blur difuso de fundo (`blur-[140px]`) em tons ambarino (`bg-primary/5`) para simular projeção de luz de estúdio.
- **Interactive Glow:** Botões de acionamento de vídeo/play utilizam `box-shadow: 0 0 25px rgba(200, 122, 42, 0.3)` que expande no hover.

## Shapes
- **Container Cards:** Cantos arredondados generosos (`rounded-[32px]`) criando caixas de projeção.
- **Botões e Tags:** Cantos ligeiramente contidos (`rounded-sm` ou `border-radius: 4px`), garantindo precisão técnica.

## Components

### 1. Header Navigation Frame
- Barra de navegação integrada no topo do container principal, com logo em barras de equalizador audiovisual e links com tipografia mono com `letter-spacing` amplo.

### 2. Video Portfolio Cards (`.carousel-card`)
- Aspect ratio 4:5 ou vertical com preview de vídeo e overlay gradiente para garantir leitura das legendas e títulos sobrepostos.
- Botão Play centralizado com transição suave de escala e glow ambarino ao passar o mouse.

### 3. Primary CTA Button (`.btn-main`, `.btn-primary`)
- Fundo ambar/dourado com texto escuro em caixa alta e peso bold, transicionando para fundo claro no hover.

## Do's and Don'ts

### Do's
- **DO:** Manter alto contraste entre textos e fundos.
- **DO:** Utilizar letras em caixa alta para labels técnicos e títulos Display.
- **DO:** Garantir suporte fluido a gestos de scroll e touch no carrossel de vídeos em dispositivos móveis.

### Don'ts
- **DON'T:** Usar fundos brancos frios puros (`#FFFFFF`) sem textura ou intenção de superfície.
- **DON'T:** Misturar múltiplas famílias tipográficas genéricas sem papéis bem definidos (ex: Inter + Space Grotesk + Roboto simultaneamente).
- **DON'T:** Usar sombras pesadas pretas sem difusão e iluminação coerentes.
