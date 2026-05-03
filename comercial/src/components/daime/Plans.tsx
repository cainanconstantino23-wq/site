import { Reveal, SectionLabel } from "./Reveal";
import { Check } from "lucide-react";

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

export const Plans = () => (
  <section id="planos" className="relative py-32 md:py-40 bg-secondary/30">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="max-w-3xl mb-20">
        <Reveal>
          <SectionLabel num="08">Investimento</SectionLabel>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
            Escolha o ritmo da sua{" "}
            <span className="italic text-primary">presença.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-lg text-cream/70 leading-relaxed mt-6">
            Três níveis de parceria pensados para diferentes momentos de marca.
            O investimento é apresentado na nossa reunião de diagnóstico, após
            entendermos o seu cenário.
          </p>
        </Reveal>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {plans.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.1}>
            <div
              className={`relative h-full p-8 md:p-10 border transition-all duration-500 flex flex-col ${
                plan.featured
                  ? "bg-card border-primary/60 md:-translate-y-4 shadow-[0_30px_60px_-20px_hsl(28_85%_58%/0.3)]"
                  : "bg-background border-border/60 hover:border-primary/40"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.25em] px-4 py-1.5">
                  Mais escolhido
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-display text-3xl md:text-4xl text-cream letter-tight mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.tagline}
                </p>
              </div>

              <div className="border-t border-border/60 pt-8 mb-8">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
                  O que está incluso
                </p>
                <ul className="space-y-3">
                  {plan.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 text-sm text-cream/80">
                      <Check className="text-primary shrink-0 mt-0.5" size={16} strokeWidth={2} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#contato"
                className={`mt-auto block text-center text-xs uppercase tracking-[0.25em] py-4 transition-all ${
                  plan.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-cream/30 text-cream hover:border-cream"
                }`}
              >
                Quero este plano
              </a>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.4}>
        <p className="text-center text-sm text-muted-foreground italic mt-12 max-w-2xl mx-auto">
          Todos os planos incluem mínimo de 3 meses de contrato — tempo
          necessário para construir consistência e resultado mensurável.
        </p>
      </Reveal>
    </div>
  </section>
);
