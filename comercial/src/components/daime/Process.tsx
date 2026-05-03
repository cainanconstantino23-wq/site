import { Reveal, SectionLabel } from "./Reveal";

const phases = [
  {
    n: "01",
    label: "Imersão",
    title: "Briefing & Storyboard",
    desc: "Entendemos o seu negócio, definimos a ideia central, escrevemos o roteiro e visualizamos cada cena.",
  },
  {
    n: "02",
    label: "Pré-produção",
    title: "Roteiro final & Cronograma",
    desc: "Aprovação do roteiro, locação, equipe, equipamentos e cronograma detalhado de gravação.",
  },
  {
    n: "03",
    label: "Produção",
    title: "Dia do set",
    desc: "Equipamento profissional, direção criativa e captação cinematográfica para garantir o padrão Daime.",
  },
  {
    n: "04",
    label: "Pós-produção",
    title: "Edição & Coloração",
    desc: "Edição estratégica, coloração cinematográfica, sound design e revisão até a aprovação final.",
  },
];

export const Process = () => (
  <section id="processo" className="relative py-32 md:py-40 overflow-hidden">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="grid md:grid-cols-12 gap-8 mb-20">
        <div className="md:col-span-5">
          <Reveal>
            <SectionLabel num="05">Processo</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
              Do briefing ao vídeo{" "}
              <span className="italic text-primary">finalizado.</span>
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-6 md:col-start-7 md:pt-4">
          <Reveal delay={0.2}>
            <p className="text-lg text-cream/70 leading-relaxed">
              Cada etapa do nosso processo foi desenhada para garantir máxima
              qualidade, alinhamento estratégico e resultados mensuráveis — do
              primeiro briefing à análise final de desempenho.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent md:-translate-x-1/2" />

        <div className="space-y-16 md:space-y-24">
          {phases.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1}>
              <div
                className={`relative grid md:grid-cols-2 gap-8 items-center ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background z-10" />

                <div
                  className={`pl-12 md:pl-0 ${
                    i % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 mb-3 ${
                      i % 2 === 0 ? "md:justify-end" : ""
                    }`}
                  >
                    <span className="font-display italic text-primary text-sm">
                      {p.n}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {p.label}
                    </span>
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl text-cream mb-3 letter-tight">
                    {p.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>
                <div />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
