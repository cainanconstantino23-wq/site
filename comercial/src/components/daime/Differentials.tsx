import { Reveal, SectionLabel } from "./Reveal";

const items = [
  {
    n: "01",
    title: "Acompanhamento integral",
    desc: "Da produção à análise de resultados, presença contínua ao seu lado em cada etapa do processo.",
  },
  {
    n: "02",
    title: "Entrega de resultados",
    desc: "Cada peça audiovisual tem objetivo claro: atrair, converter e fidelizar novos pacientes.",
  },
  {
    n: "03",
    title: "Conteúdo orientado a conversão",
    desc: "Cada vídeo é pensado para gerar agendamentos e fechamentos — não apenas curtidas.",
  },
  {
    n: "04",
    title: "Plataforma própria de aprovação",
    desc: "Todos os meses entregamos relatórios detalhados de progresso em um app exclusivo para você.",
  },
];

export const Differentials = () => (
  <section
    id="diferenciais"
    className="relative py-32 md:py-40 bg-secondary/30 overflow-hidden"
  >
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="max-w-3xl mb-20">
        <Reveal>
          <SectionLabel num="04">Diferenciais</SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
            O que faz a Daime ser{" "}
            <span className="italic text-primary">diferente.</span>
          </h2>
        </Reveal>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-border/60">
        {items.map((item, i) => (
          <Reveal key={item.n} delay={i * 0.1}>
            <div className="bg-background p-10 md:p-12 h-full group hover:bg-card transition-colors duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 font-display text-[10rem] text-primary/[0.04] leading-none -mt-8 -mr-4 group-hover:text-primary/10 transition-colors duration-700">
                {item.n}
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-display italic text-primary">
                    {item.n}
                  </span>
                  <span className="h-px w-8 bg-primary/40" />
                </div>
                <h3 className="font-display text-3xl md:text-4xl text-cream mb-4 leading-tight letter-tight">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
