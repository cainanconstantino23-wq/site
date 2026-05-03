import { Reveal, SectionLabel } from "./Reveal";
import { Lightbulb, Film, MousePointerClick, TrendingUp } from "lucide-react";

const services = [
  {
    icon: Lightbulb,
    tag: "Briefing & Story",
    title: "Estratégia",
    desc: "Planejamento, briefing criativo e análise aprofundada de concorrentes para posicionar a sua marca.",
  },
  {
    icon: Film,
    tag: "Conteúdo Visual",
    title: "Captação & Edição",
    desc: "Produção audiovisual de alta qualidade para contar a história do seu negócio de forma impactante.",
  },
  {
    icon: MousePointerClick,
    tag: "Conversão",
    title: "Landing Page",
    desc: "Criação de páginas de destino otimizadas, focadas em converter visitantes em clientes reais.",
  },
  {
    icon: TrendingUp,
    tag: "Crescimento",
    title: "Tráfego Pago",
    desc: "Distribuição inteligente do conteúdo para atingir o público certo no momento ideal.",
  },
];

export const Services = () => (
  <section id="servicos" className="relative py-32 md:py-40 bg-secondary/30">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="max-w-3xl mb-20">
        <Reveal>
          <SectionLabel num="06">O que fazemos por você</SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
            Um ecossistema completo de{" "}
            <span className="italic text-primary">aquisição.</span>
          </h2>
        </Reveal>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div className="group relative h-full p-8 bg-background border border-border/60 hover:border-primary/60 transition-all duration-500">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                <s.icon className="text-primary group-hover:text-primary-foreground transition-colors" size={22} strokeWidth={1.2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                {s.tag}
              </p>
              <h3 className="font-display text-2xl text-cream mb-4 letter-tight">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
