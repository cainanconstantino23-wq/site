import { Reveal, SectionLabel } from "./Reveal";
import { AlertTriangle, BarChart2, Camera, Handshake, FileText } from "lucide-react";

export const Problem = () => (
  <section id="problema" className="relative py-32 md:py-40 bg-secondary/40 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
    <div className="relative max-w-[1400px] mx-auto px-6 md:px-10">
      <Reveal>
        <SectionLabel num="02">O Cenário</SectionLabel>
      </Reveal>

      <div className="grid md:grid-cols-12 gap-12 mb-24">
        <div className="md:col-span-6">
          <Reveal delay={0.1}>
            <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
              Em 2026, quem não é visto com{" "}
              <span className="italic text-primary"><br />excelência</span> é
              esquecido.
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-6 md:pt-4">
          <Reveal delay={0.2}>
            <p className="text-base md:text-lg text-cream/70 leading-relaxed">
              A falta de constância e de vídeos de alta qualidade cria um vácuo
              de autoridade que a concorrência rapidamente preenche. O "silêncio
              digital" ou postagens amadoras são interpretados pelo paciente
              como falta de atualização técnica — gerando insegurança e perda de
              credibilidade já conquistada.
            </p>
          </Reveal>
          <Reveal delay={0.35}>
            <div className="mt-8 p-6 border-l-2 border-primary bg-primary/5 flex items-start gap-4">
              <AlertTriangle className="text-primary shrink-0 mt-1" size={20} />
              <p className="text-sm md:text-base text-cream/90 italic font-display text-lg">
                Sem presença audiovisual profissional, a clínica não apenas
                deixa de atrair novos pacientes — perde a credibilidade que
                construiu.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal>
        <div className="border-t border-border/60 pt-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-12">
            Os erros comuns de quem atende negócios locais
          </p>
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: BarChart2,
            title: "Sem foco em resultado",
            desc: "Trabalham sem métricas claras e sem conexão com conversão.",
          },
          {
            icon: Camera,
            title: "Entregam só o vídeo",
            desc: "O conteúdo chega pronto, mas sem estratégia por trás.",
          },
          {
            icon: Handshake,
            title: "Sem acompanhamento",
            desc: "Falta alinhamento e o resultado se distancia da real necessidade.",
          },
          {
            icon: FileText,
            title: "Briefing genérico",
            desc: "Sem clareza, o material perde precisão e força comercial.",
          },
        ].map((item, i) => (
          <Reveal key={item.title} delay={0.1 + i * 0.08}>
            <div className="group relative p-8 border border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/60 transition-all duration-500 h-full">
              <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-700" />
              <item.icon className="text-primary mb-6" size={28} strokeWidth={1.2} />
              <h3 className="font-display text-2xl text-cream mb-3 leading-tight">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
