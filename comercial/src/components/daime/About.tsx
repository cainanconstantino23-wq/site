import { Reveal, SectionLabel } from "./Reveal";

export const About = () => (
  <section id="sobre" className="relative py-32 md:py-40 bg-grain overflow-hidden">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="grid md:grid-cols-12 gap-12 md:gap-20 items-start">
        <div className="md:col-span-5 md:sticky md:top-32">
          <Reveal>
            <SectionLabel num="01">A Produtora</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
              Cinema com <span className="italic text-primary">propósito</span>{" "}
              de venda.
            </h2>
          </Reveal>
        </div>

        <div className="md:col-span-7 space-y-8">
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-cream/80 font-light leading-relaxed">
              A <span className="text-primary">Daime Filmes</span> nasce da fusão
              entre linguagem cinematográfica e estratégia de performance. Cada
              frame é pensado para construir autoridade — e cada vídeo, para
              gerar resultado.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Nosso trabalho começa muito antes da câmera ligar. Mergulhamos no
              modelo de negócio do cliente, estudamos a concorrência e desenhamos
              um posicionamento único — para que cada peça produzida atraia o
              paciente certo, com real potencial de fechamento.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/60 mt-12">
              {[
                { n: "+30", l: "Projetos\nentregues" },
                { n: "100%", l: "Foco em\nconversão" },
                { n: "4K", l: "Padrão\ncinematográfico" },
              ].map((s) => (
                <div key={s.n}>
                  <div className="font-display text-3xl md:text-5xl text-primary">
                    {s.n}
                  </div>
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2 whitespace-pre-line">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);
