import { Reveal } from "./Reveal";
import { Instagram, Globe, Mail } from "lucide-react";

export const Contact = () => (
  <section
    id="contato"
    className="relative py-32 md:py-48 overflow-hidden bg-ink"
  >
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(28_85%_58%/0.15)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-grain" />
    </div>

    <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 text-center">
      <Reveal>
        <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary mb-8">
          Vamos trabalhar juntos
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <h2 className="font-display text-5xl md:text-7xl lg:text-8xl text-cream letter-tight leading-[0.95] max-w-5xl mx-auto">
          Sua marca merece ser{" "}
          <span className="italic text-gradient-ember">vista com <br />excelência.</span>
        </h2>
      </Reveal>

      <Reveal delay={0.2}>
        <p className="mt-10 text-base md:text-xl text-cream/70 max-w-2xl mx-auto leading-relaxed font-light">
          Transforme a identidade da sua clínica em um ativo que gera lucro. A
          Daime Filmes está pronta para criar a sua narrativa visual com
          estratégia, cinema e resultado.
        </p>
      </Reveal>

      <Reveal delay={0.3}>
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-primary text-primary-foreground text-xs uppercase tracking-[0.25em] hover:bg-primary/90 transition-all"
          >
            Agendar diagnóstico gratuito →
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.4}>
        <div className="mt-20 pt-12 border-t border-border/40 grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <a
            href="https://instagram.com/daimefilmes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 text-cream/70 hover:text-primary transition-colors"
          >
            <Instagram size={18} strokeWidth={1.5} />
            <span className="text-sm">@daimefilmes</span>
          </a>
          <a
            href="https://www.daimefilmes.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 text-cream/70 hover:text-primary transition-colors"
          >
            <Globe size={18} strokeWidth={1.5} />
            <span className="text-sm">daimefilmes.com.br</span>
          </a>
          <a
            href="mailto:contato@daimefilmes.com.br"
            className="flex items-center justify-center gap-3 text-cream/70 hover:text-primary transition-colors"
          >
            <Mail size={18} strokeWidth={1.5} />
            <span className="text-sm">contato@daimefilmes.com.br</span>
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.5}>
        <div className="mt-20 text-center">
          <p className="font-display text-3xl md:text-4xl text-cream/90 italic">
            Daime <span className="text-primary">Filmes</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mt-3">
            Cinema · Estratégia · Resultado
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);
