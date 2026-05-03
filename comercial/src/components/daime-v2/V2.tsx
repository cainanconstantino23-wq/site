import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import hero from "@/assets/v2-hero.jpg";
import clinic from "@/assets/v2-clinic.jpg";
import portrait from "@/assets/v2-portrait.jpg";
import bts from "@/assets/v2-bts.jpg";
import spa from "@/assets/v2-spa.jpg";

/* ------------ tokens (escopados ao wrapper .v2) ------------ */
// Paleta:
//   bone   #F4F0E8  (bg principal)
//   paper  #FAF7F1  (bg secundário)
//   ink    #161616  (texto / acento)
//   line   #1616161A (linhas)
//   moss   #4A5D3A  (acento sutil — verde-oliva)

const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Mono = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span
    className={`font-mono text-[10px] uppercase tracking-[0.2em] ${className}`}
    style={{ fontFamily: "'JetBrains Mono', monospace" }}
  >
    {children}
  </span>
);

const SectionHead = ({ num, label }: { num: string; label: string }) => (
  <div className="flex items-center gap-4 pb-3 border-b border-ink/10">
    <Mono className="text-ink/40">[{num}]</Mono>
    <Mono className="text-ink/60">{label}</Mono>
  </div>
);

/* ------------ Nav ------------ */

const sections = [
  { id: "v2-sobre", label: "Produtora" },
  { id: "v2-cenario", label: "Cenário" },
  { id: "v2-metodo", label: "Método" },
  { id: "v2-processo", label: "Processo" },
  { id: "v2-servicos", label: "Serviços" },
  { id: "v2-portfolio", label: "Trabalhos" },
  { id: "v2-planos", label: "Planos" },
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#F4F0E8]/85 backdrop-blur-md border-b border-ink/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1320px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a
          href="#v2-top"
          className="flex items-baseline gap-2"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          <span className="text-xl md:text-2xl font-light text-ink tracking-tight">
            Daime
          </span>
          <span className="text-xl md:text-2xl font-light italic text-ink/50">
            Filmes
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs text-ink/60 hover:text-ink transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <a
          href="#v2-contato"
          className="group inline-flex items-center gap-2 text-xs text-ink hover:gap-3 transition-all"
        >
          <span className="border-b border-ink pb-0.5">Conversar</span>
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </a>
      </div>
    </header>
  );
};

/* ------------ Hero ------------ */

const Hero = () => (
  <section
    id="v2-top"
    className="relative min-h-screen flex flex-col justify-between pt-28 md:pt-32 pb-10"
  >
    <div className="max-w-[1320px] mx-auto px-6 md:px-10 w-full grid md:grid-cols-12 gap-10 md:gap-16">
      <div className="md:col-span-7 flex flex-col justify-between">
        <div>
          <Reveal>
            <Mono className="text-ink/50">
              Proposta comercial · 2026 / Daime Filmes
            </Mono>
          </Reveal>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 md:mt-16 text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.02] tracking-[-0.03em] text-ink"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            Audiovisual <br />
            <span className="italic font-light text-ink/70">discreto.</span>{" "}
            Resultado <br />
            inegável.
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-12 md:mt-20 grid grid-cols-2 gap-8 max-w-md"
        >
          <div>
            <Mono className="text-ink/40">Para</Mono>
            <p
              className="mt-2 text-base text-ink/80"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Clínicas, estética <br />e bem-estar
            </p>
          </div>
          <div>
            <Mono className="text-ink/40">Modo</Mono>
            <p
              className="mt-2 text-base text-ink/80"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Cinema com <br />estratégia
            </p>
          </div>
        </motion.div>
      </div>

      <div className="md:col-span-5 relative">
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-ink/5"
        >
          <img
            src={hero}
            alt="Lente cinematográfica em fundo claro"
            className="w-full h-full object-cover"
            width={1920}
            height={1280}
          />
        </motion.div>
        <Mono className="absolute -bottom-6 right-0 text-ink/40">
          Fig. 01 — Daime Filmes
        </Mono>
      </div>
    </div>

    <div className="max-w-[1320px] mx-auto px-6 md:px-10 w-full mt-16 md:mt-24 flex items-end justify-between border-t border-ink/10 pt-6">
      <Mono className="text-ink/50">role para ler ↓</Mono>
      <Mono className="text-ink/50">SP / BR</Mono>
    </div>
  </section>
);

/* ------------ Sobre ------------ */

const About = () => (
  <section id="v2-sobre" className="py-32 md:py-44">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 md:gap-16">
      <div className="md:col-span-5">
        <Reveal>
          <SectionHead num="01" label="A Produtora" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="mt-10 text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            Cinema com{" "}
            <span className="italic text-ink/60">propósito</span> de venda.
          </h2>
        </Reveal>
      </div>

      <div className="md:col-span-6 md:col-start-7 space-y-8">
        <Reveal delay={0.15}>
          <p
            className="text-xl md:text-2xl leading-[1.4] text-ink/80"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            A Daime Filmes nasce da fusão entre linguagem cinematográfica e
            estratégia de performance. Cada frame é pensado para construir
            autoridade — e cada vídeo, para gerar resultado.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="text-base text-ink/60 leading-relaxed max-w-xl">
            Nosso trabalho começa muito antes da câmera ligar. Mergulhamos no
            modelo de negócio do cliente, estudamos a concorrência e desenhamos
            um posicionamento único — para que cada peça produzida atraia o
            paciente certo, com real potencial de fechamento.
          </p>
        </Reveal>

        <Reveal delay={0.35}>
          <div className="grid grid-cols-3 gap-6 pt-12 mt-12 border-t border-ink/10">
            {[
              { n: "+30", l: "Projetos entregues" },
              { n: "100%", l: "Foco em conversão" },
              { n: "4K", l: "Padrão cinematográfico" },
            ].map((s) => (
              <div key={s.n}>
                <div
                  className="text-4xl md:text-5xl text-ink"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                >
                  {s.n}
                </div>
                <Mono className="block mt-3 text-ink/50">{s.l}</Mono>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ------------ Cenário (Problema) ------------ */

const Scenario = () => (
  <section id="v2-cenario" className="py-32 md:py-44 bg-[#FAF7F1]">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionHead num="02" label="O Cenário" />
      </Reveal>

      <div className="grid md:grid-cols-12 gap-10 mt-12">
        <div className="md:col-span-7">
          <Reveal delay={0.1}>
            <h2
              className="text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
            >
              Em 2026, quem não é visto com{" "}
              <span className="italic text-ink/60">excelência</span> é
              esquecido.
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-5 md:pt-3">
          <Reveal delay={0.2}>
            <p className="text-base text-ink/70 leading-relaxed">
              A falta de constância e de vídeos de alta qualidade cria um vácuo
              de autoridade que a concorrência rapidamente preenche. O silêncio
              digital ou postagens amadoras são lidos pelo paciente como falta
              de atualização técnica.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p
              className="mt-8 pl-6 border-l border-ink/30 italic text-ink/80 text-lg"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Sem presença audiovisual profissional, a clínica não apenas deixa
              de atrair novos pacientes — perde a credibilidade que construiu.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="mt-24 grid md:grid-cols-4 border-t border-ink/10">
        {[
          { n: "01", t: "Sem foco em resultado", d: "Trabalham sem métricas claras e sem conexão com conversão." },
          { n: "02", t: "Entregam só o vídeo", d: "O conteúdo chega pronto, mas sem estratégia por trás." },
          { n: "03", t: "Sem acompanhamento", d: "Falta alinhamento e o resultado se distancia da real necessidade." },
          { n: "04", t: "Briefing genérico", d: "Sem clareza, o material perde precisão e força comercial." },
        ].map((it, i) => (
          <Reveal key={it.n} delay={i * 0.06}>
            <div className="py-10 md:py-12 px-6 md:px-8 md:border-r border-ink/10 last:border-r-0 h-full">
              <Mono className="text-ink/40">{it.n}</Mono>
              <h3
                className="mt-6 text-xl md:text-2xl text-ink leading-snug tracking-tight"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
              >
                {it.t}
              </h3>
              <p className="mt-3 text-sm text-ink/60 leading-relaxed">{it.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ------------ Método ------------ */

const Method = () => (
  <section id="v2-metodo" className="py-32 md:py-44">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionHead num="03" label="Método" />
      </Reveal>

      <div className="grid md:grid-cols-12 gap-10 md:gap-16 mt-12 items-start">
        <div className="md:col-span-5 order-2 md:order-1">
          <Reveal>
            <div className="aspect-[4/5] overflow-hidden bg-ink/5">
              <img
                src={portrait}
                alt="Atmosfera serena de bem-estar"
                className="w-full h-full object-cover"
                loading="lazy"
                width={1080}
                height={1600}
              />
            </div>
          </Reveal>
          <Mono className="block mt-4 text-ink/40">Fig. 02 — Estética da marca</Mono>
        </div>

        <div className="md:col-span-7 order-1 md:order-2">
          <Reveal delay={0.1}>
            <h2
              className="text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
            >
              Estratégia primeiro. <br />
              <span className="italic text-ink/60">Câmera depois.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-ink/70 leading-relaxed max-w-xl">
              Unimos audiovisual e performance para transformar a identidade da
              sua clínica em um ativo que gera lucro.
            </p>
          </Reveal>

          <div className="mt-14 space-y-px bg-ink/10">
            {[
              {
                n: "I.",
                t: "Imersão estratégica",
                d: "Análise profunda do modelo de negócio e dos concorrentes para desenhar um posicionamento único e inquestionável.",
              },
              {
                n: "II.",
                t: "Conteúdo com intenção",
                d: "Roteiro estratégico e entrega final focada em autoridade — atraindo pacientes com real potencial de fechamento.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={0.3 + i * 0.1}>
                <div className="bg-[#F4F0E8] p-8 md:p-10 flex gap-6">
                  <span
                    className="text-2xl text-ink/30 mt-1"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3
                      className="text-2xl md:text-3xl text-ink leading-tight tracking-tight"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                    >
                      {s.t}
                    </h3>
                    <p className="mt-3 text-ink/65 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ------------ Diferenciais ------------ */

const Differentials = () => (
  <section className="py-32 md:py-44 bg-[#FAF7F1]">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionHead num="04" label="Diferenciais" />
      </Reveal>
      <Reveal delay={0.1}>
        <h2
          className="mt-12 max-w-3xl text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          O que faz a Daime ser{" "}
          <span className="italic text-ink/60">diferente.</span>
        </h2>
      </Reveal>

      <div className="mt-20 grid md:grid-cols-2 gap-x-16 gap-y-px">
        {[
          { n: "01", t: "Acompanhamento integral", d: "Da produção à análise de resultados, presença contínua ao seu lado em cada etapa do processo." },
          { n: "02", t: "Entrega de resultados", d: "Cada peça audiovisual tem objetivo claro: atrair, converter e fidelizar novos pacientes." },
          { n: "03", t: "Conteúdo orientado a conversão", d: "Cada vídeo é pensado para gerar agendamentos e fechamentos — não apenas curtidas." },
          { n: "04", t: "Plataforma própria de aprovação", d: "Todos os meses entregamos relatórios detalhados de progresso em um app exclusivo para você." },
        ].map((it, i) => (
          <Reveal key={it.n} delay={i * 0.08}>
            <div className="py-10 border-t border-ink/15 flex gap-6 group">
              <Mono className="text-ink/40 pt-2 shrink-0">{it.n}</Mono>
              <div className="flex-1">
                <h3
                  className="text-2xl md:text-3xl text-ink leading-tight tracking-tight"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                >
                  {it.t}
                </h3>
                <p className="mt-3 text-ink/65 leading-relaxed max-w-lg">
                  {it.d}
                </p>
              </div>
              <Plus
                size={18}
                strokeWidth={1}
                className="text-ink/30 group-hover:rotate-45 transition-transform duration-500 shrink-0 mt-2"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ------------ Processo ------------ */

const Process = () => (
  <section id="v2-processo" className="py-32 md:py-44">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionHead num="05" label="Processo" />
      </Reveal>

      <div className="grid md:grid-cols-12 gap-10 mt-12">
        <div className="md:col-span-7">
          <Reveal delay={0.1}>
            <h2
              className="text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
            >
              Do briefing ao vídeo{" "}
              <span className="italic text-ink/60">finalizado.</span>
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-5 md:pt-3">
          <Reveal delay={0.2}>
            <p className="text-base text-ink/70 leading-relaxed">
              Cada etapa foi desenhada para garantir máxima qualidade,
              alinhamento estratégico e resultados mensuráveis — do primeiro
              briefing à análise final de desempenho.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="mt-20 border-t border-ink/15">
        {[
          { n: "01", l: "Imersão", t: "Briefing & Storyboard", d: "Entendemos o seu negócio, definimos a ideia central, escrevemos o roteiro e visualizamos cada cena." },
          { n: "02", l: "Pré-produção", t: "Roteiro final & Cronograma", d: "Aprovação do roteiro, locação, equipe, equipamentos e cronograma detalhado de gravação." },
          { n: "03", l: "Produção", t: "Dia do set", d: "Equipamento profissional, direção criativa e captação cinematográfica para garantir o padrão Daime." },
          { n: "04", l: "Pós-produção", t: "Edição & Coloração", d: "Edição estratégica, coloração cinematográfica, sound design e revisão até a aprovação final." },
        ].map((p, i) => (
          <Reveal key={p.n} delay={i * 0.06}>
            <div className="py-10 md:py-14 border-b border-ink/15 grid md:grid-cols-12 gap-6 items-start group">
              <div className="md:col-span-2 flex md:flex-col gap-4 md:gap-2 items-baseline">
                <span
                  className="text-5xl md:text-6xl text-ink/30 group-hover:text-ink transition-colors duration-500"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                >
                  {p.n}
                </span>
                <Mono className="text-ink/50">{p.l}</Mono>
              </div>
              <div className="md:col-span-5">
                <h3
                  className="text-2xl md:text-4xl text-ink leading-tight tracking-tight"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                >
                  {p.t}
                </h3>
              </div>
              <div className="md:col-span-5">
                <p className="text-ink/65 leading-relaxed">{p.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ------------ Serviços ------------ */

const Services = () => (
  <section id="v2-servicos" className="py-32 md:py-44 bg-[#FAF7F1]">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionHead num="06" label="O que fazemos por você" />
      </Reveal>

      <Reveal delay={0.1}>
        <h2
          className="mt-12 max-w-3xl text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Um ecossistema completo de{" "}
          <span className="italic text-ink/60">aquisição.</span>
        </h2>
      </Reveal>

      <div className="mt-20 grid md:grid-cols-4 border-t border-ink/15">
        {[
          { tag: "Briefing & Story", t: "Estratégia", d: "Planejamento, briefing criativo e análise aprofundada de concorrentes para posicionar a sua marca." },
          { tag: "Conteúdo Visual", t: "Captação & Edição", d: "Produção audiovisual de alta qualidade para contar a história do seu negócio de forma impactante." },
          { tag: "Conversão", t: "Landing Page", d: "Páginas de destino otimizadas, focadas em converter visitantes em clientes reais." },
          { tag: "Crescimento", t: "Tráfego Pago", d: "Distribuição inteligente do conteúdo para atingir o público certo no momento ideal." },
        ].map((s, i) => (
          <Reveal key={s.t} delay={i * 0.06}>
            <div className="py-10 md:py-12 px-2 md:px-6 md:border-r border-ink/15 last:border-r-0 h-full">
              <Mono className="text-ink/45">{s.tag}</Mono>
              <h3
                className="mt-8 text-2xl md:text-3xl text-ink leading-tight tracking-tight"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
              >
                {s.t}
              </h3>
              <p className="mt-4 text-sm text-ink/65 leading-relaxed">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ------------ Portfolio ------------ */

const Portfolio = () => {
  const items = [
    { src: clinic, label: "Clínica Médica", category: "Vídeo institucional" },
    { src: spa, label: "Estética Avançada", category: "Reels & Shorts" },
    { src: bts, label: "Bastidores", category: "Behind the scenes" },
    { src: portrait, label: "Bem-estar & Spa", category: "Branded content" },
  ];
  return (
    <section id="v2-portfolio" className="py-32 md:py-44">
      <div className="max-w-[1320px] mx-auto px-6 md:px-10">
        <Reveal>
          <SectionHead num="07" label="Trabalhos selecionados" />
        </Reveal>
        <div className="grid md:grid-cols-12 gap-10 mt-12">
          <div className="md:col-span-7">
            <Reveal delay={0.1}>
              <h2
                className="text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                Estética cinematográfica para{" "}
                <span className="italic text-ink/60">marcas que cuidam.</span>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:pt-3">
            <Reveal delay={0.2}>
              <p className="text-base text-ink/70 leading-relaxed">
                Selecionamos alguns dos nossos trabalhos para mostrar o padrão
                Daime — clínicas médicas, estética avançada e espaços de
                bem-estar.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 space-y-px bg-ink/10">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 0.05}>
              <div className="bg-[#F4F0E8] py-6 group cursor-pointer">
                <div className="grid md:grid-cols-12 gap-6 items-center px-2">
                  <Mono className="md:col-span-1 text-ink/40">
                    0{i + 1}
                  </Mono>
                  <div className="md:col-span-4">
                    <h3
                      className="text-2xl md:text-4xl text-ink tracking-tight leading-none"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
                    >
                      {it.label}
                    </h3>
                  </div>
                  <div className="md:col-span-3">
                    <Mono className="text-ink/55">{it.category}</Mono>
                  </div>
                  <div className="md:col-span-3">
                    <div className="aspect-[16/10] overflow-hidden bg-ink/5">
                      <img
                        src={it.src}
                        alt={it.label}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <ArrowUpRight
                      size={20}
                      strokeWidth={1}
                      className="text-ink/40 group-hover:text-ink group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-12 text-sm text-ink/55 italic">
            Portfólio completo em vídeo — solicite um envio personalizado.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

/* ------------ Planos ------------ */

const Plans = () => {
  const plans = [
    {
      name: "Essencial",
      tagline: "Para clínicas iniciando a presença audiovisual",
      items: [
        "Briefing estratégico inicial",
        "4 vídeos curtos por mês (Reels/Shorts)",
        "Roteiro e direção",
        "Captação em meio período mensal",
        "Edição com identidade visual",
        "Relatório mensal simplificado",
      ],
    },
    {
      name: "Autoridade",
      tagline: "Para quem quer dominar o nicho local",
      featured: true,
      items: [
        "Análise profunda de concorrência",
        "8 vídeos mensais (mix Reels + institucionais)",
        "1 vídeo institucional trimestral",
        "Captação em dia inteiro mensal",
        "Coloração cinematográfica",
        "Acesso à plataforma de aprovação",
        "Relatório estratégico mensal",
        "Acompanhamento de performance",
      ],
    },
    {
      name: "Performance",
      tagline: "Audiovisual + tráfego pago + conversão",
      items: [
        "Tudo do plano Autoridade",
        "12+ vídeos mensais",
        "Landing page otimizada inclusa",
        "Gestão de tráfego pago (Meta Ads)",
        "Estratégia de funil de aquisição",
        "Reuniões quinzenais de performance",
        "Relatório completo com ROAS",
        "Suporte prioritário",
      ],
    },
  ];

  return (
    <section id="v2-planos" className="py-32 md:py-44 bg-[#FAF7F1]">
      <div className="max-w-[1320px] mx-auto px-6 md:px-10">
        <Reveal>
          <SectionHead num="08" label="Investimento" />
        </Reveal>

        <div className="grid md:grid-cols-12 gap-10 mt-12">
          <div className="md:col-span-7">
            <Reveal delay={0.1}>
              <h2
                className="text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em] text-ink"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
              >
                Escolha o ritmo da sua{" "}
                <span className="italic text-ink/60">presença.</span>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-5 md:pt-3">
            <Reveal delay={0.2}>
              <p className="text-base text-ink/70 leading-relaxed">
                Três níveis de parceria pensados para diferentes momentos de
                marca. O investimento é apresentado na nossa reunião de
                diagnóstico, após entendermos o seu cenário.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-px bg-ink/15">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div
                className={`h-full p-8 md:p-10 flex flex-col ${
                  p.featured ? "bg-ink text-[#F4F0E8]" : "bg-[#F4F0E8] text-ink"
                }`}
              >
                {p.featured && (
                  <Mono className="text-[#F4F0E8]/60 mb-6">★ Mais escolhido</Mono>
                )}
                <h3
                  className="text-4xl md:text-5xl tracking-[-0.03em] leading-none"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                >
                  {p.name}
                </h3>
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    p.featured ? "text-[#F4F0E8]/70" : "text-ink/60"
                  }`}
                >
                  {p.tagline}
                </p>

                <div
                  className={`mt-10 pt-8 border-t ${
                    p.featured ? "border-[#F4F0E8]/20" : "border-ink/15"
                  }`}
                >
                  <Mono className={p.featured ? "text-[#F4F0E8]/50" : "text-ink/45"}>
                    O que está incluso
                  </Mono>
                  <ul className="mt-6 space-y-3">
                    {p.items.map((it) => (
                      <li
                        key={it}
                        className={`flex gap-3 text-sm leading-relaxed ${
                          p.featured ? "text-[#F4F0E8]/85" : "text-ink/75"
                        }`}
                      >
                        <span
                          className={
                            p.featured ? "text-[#F4F0E8]/40" : "text-ink/30"
                          }
                        >
                          —
                        </span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#v2-contato"
                  className={`mt-10 inline-flex items-center gap-2 text-xs group ${
                    p.featured ? "text-[#F4F0E8]" : "text-ink"
                  }`}
                >
                  <span
                    className={`border-b pb-0.5 ${
                      p.featured ? "border-[#F4F0E8]" : "border-ink"
                    }`}
                  >
                    Quero este plano
                  </span>
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-12 text-sm text-ink/55 italic max-w-2xl">
            Todos os planos incluem mínimo de 3 meses de contrato — tempo
            necessário para construir consistência e resultado mensurável.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

/* ------------ Contato ------------ */

const Contact = () => (
  <section id="v2-contato" className="py-32 md:py-48">
    <div className="max-w-[1320px] mx-auto px-6 md:px-10">
      <Reveal>
        <Mono className="text-ink/50">[09] · Vamos trabalhar juntos</Mono>
      </Reveal>

      <Reveal delay={0.1}>
        <h2
          className="mt-10 text-5xl sm:text-6xl md:text-8xl lg:text-[120px] leading-[0.95] tracking-[-0.04em] text-ink max-w-5xl"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Sua marca merece ser{" "}
          <span className="italic text-ink/55">vista com excelência.</span>
        </h2>
      </Reveal>

      <Reveal delay={0.2}>
        <p
          className="mt-12 text-xl md:text-2xl text-ink/70 leading-[1.4] max-w-2xl"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Transforme a identidade da sua clínica em um ativo que gera lucro.
          Estamos prontos para criar a sua narrativa visual com estratégia,
          cinema e resultado.
        </p>
      </Reveal>

      <Reveal delay={0.3}>
        <a
          href="https://wa.me/5500000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-14 inline-flex items-center gap-4 text-ink"
        >
          <span
            className="text-3xl md:text-4xl border-b border-ink pb-2"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
          >
            Agendar diagnóstico gratuito
          </span>
          <ArrowUpRight
            size={32}
            strokeWidth={1}
            className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
          />
        </a>
      </Reveal>

      <div className="mt-32 pt-10 border-t border-ink/15 grid md:grid-cols-4 gap-8">
        {[
          { l: "Instagram", v: "@daimefilmes", h: "https://instagram.com/daimefilmes" },
          { l: "Site", v: "daimefilmes.com.br", h: "https://www.daimefilmes.com.br" },
          { l: "E-mail", v: "contato@daimefilmes.com.br", h: "mailto:contato@daimefilmes.com.br" },
          { l: "Local", v: "São Paulo · BR", h: "" },
        ].map((c) => (
          <div key={c.l}>
            <Mono className="text-ink/45">{c.l}</Mono>
            {c.h ? (
              <a
                href={c.h}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 text-base text-ink hover:text-ink/60 transition-colors"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {c.v}
              </a>
            ) : (
              <p
                className="mt-3 text-base text-ink"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {c.v}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-20 flex items-end justify-between">
        <div
          className="text-3xl md:text-4xl text-ink"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
        >
          Daime <span className="italic text-ink/50">Filmes</span>
        </div>
        <Mono className="text-ink/40">© 2026 — Todos os direitos reservados</Mono>
      </div>
    </div>
  </section>
);

/* ------------ Page ------------ */

export const V2 = () => {
  useEffect(() => {
    document.title = "Daime Filmes — Versão 2 (Editorial Minimal)";
  }, []);
  return (
    <main
      className="min-h-screen"
      style={{
        background: "#F4F0E8",
        color: "#161616",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* tokens locais via CSS vars para classes utilitárias */}
      <style>{`
        .v2-scope .text-ink { color: #161616; }
        .v2-scope .border-ink\\/10 { border-color: rgba(22,22,22,.10); }
        .v2-scope .border-ink\\/15 { border-color: rgba(22,22,22,.15); }
        .v2-scope .border-ink\\/30 { border-color: rgba(22,22,22,.30); }
        .v2-scope .border-ink { border-color: #161616; }
        .v2-scope .bg-ink { background-color: #161616; }
        .v2-scope .bg-ink\\/5 { background-color: rgba(22,22,22,.05); }
        .v2-scope .bg-ink\\/10 { background-color: rgba(22,22,22,.10); }
        .v2-scope .bg-ink\\/15 { background-color: rgba(22,22,22,.15); }
        .v2-scope .text-ink\\/30 { color: rgba(22,22,22,.30); }
        .v2-scope .text-ink\\/40 { color: rgba(22,22,22,.40); }
        .v2-scope .text-ink\\/45 { color: rgba(22,22,22,.45); }
        .v2-scope .text-ink\\/50 { color: rgba(22,22,22,.50); }
        .v2-scope .text-ink\\/55 { color: rgba(22,22,22,.55); }
        .v2-scope .text-ink\\/60 { color: rgba(22,22,22,.60); }
        .v2-scope .text-ink\\/65 { color: rgba(22,22,22,.65); }
        .v2-scope .text-ink\\/70 { color: rgba(22,22,22,.70); }
        .v2-scope .text-ink\\/75 { color: rgba(22,22,22,.75); }
        .v2-scope .text-ink\\/80 { color: rgba(22,22,22,.80); }
        .v2-scope .text-ink\\/85 { color: rgba(22,22,22,.85); }
        .v2-scope ::selection { background: #161616; color: #F4F0E8; }
      `}</style>
      <div className="v2-scope">
        <Nav />
        <Hero />
        <About />
        <Scenario />
        <Method />
        <Differentials />
        <Process />
        <Services />
        <Portfolio />
        <Plans />
        <Contact />
      </div>
    </main>
  );
};

export default V2;
