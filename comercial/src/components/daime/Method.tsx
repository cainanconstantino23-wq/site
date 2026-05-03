import { Reveal, SectionLabel } from "./Reveal";
import editImg from "@/assets/process-edit.jpg";

export const Method = () => (
  <section id="metodo" className="relative py-32 md:py-40 overflow-hidden">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionLabel num="03">Nosso Método</SectionLabel>
      </Reveal>

      <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-center">
        <div className="md:col-span-6 order-2 md:order-1">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={editImg}
                alt="Estação de pós-produção e color grading"
                className="w-full h-full object-cover"
                loading="lazy"
                width={1600}
                height={1200}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-display italic text-cream/80 text-lg">
                  "Cada vídeo é uma engrenagem de uma máquina maior: a sua
                  marca."
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-6 order-1 md:order-2">
          <Reveal delay={0.1}>
            <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl mb-8">
              Estratégia primeiro.{" "}
              <span className="italic text-primary">Câmera depois.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg text-cream/70 leading-relaxed mb-12">
              Unimos audiovisual e performance para transformar a identidade da
              sua clínica em um ativo que gera lucro.
            </p>
          </Reveal>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Imersão estratégica",
                desc: "Análise profunda do modelo de negócio e dos concorrentes para desenhar um posicionamento único e inquestionável.",
              },
              {
                step: "02",
                title: "Conteúdo com intenção",
                desc: "Roteiro estratégico e entrega final focada em autoridade, visando atrair pacientes com real potencial de fechamento.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={0.3 + i * 0.15}>
                <div className="flex gap-6 group">
                  <div className="font-display text-5xl text-primary/30 group-hover:text-primary transition-colors duration-500 leading-none">
                    {s.step}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-display text-2xl text-cream mb-2">
                      {s.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
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
