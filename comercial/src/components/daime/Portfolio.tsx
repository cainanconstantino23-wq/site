import { Reveal, SectionLabel } from "./Reveal";
import clinic from "@/assets/portfolio-clinic.jpg";
import aesthetic from "@/assets/portfolio-aesthetic.jpg";
import bts from "@/assets/portfolio-bts.jpg";
import wellness from "@/assets/portfolio-wellness.jpg";

const items = [
  { src: clinic, label: "Clínica Médica", category: "Vídeo institucional" },
  { src: aesthetic, label: "Estética Avançada", category: "Reels & Shorts" },
  { src: bts, label: "Bastidores", category: "Behind the scenes" },
  { src: wellness, label: "Bem-Estar & Spa", category: "Branded content" },
];

export const Portfolio = () => (
  <section id="portfolio" className="relative py-32 md:py-40 overflow-hidden">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="grid md:grid-cols-12 gap-8 mb-20">
        <div className="md:col-span-6">
          <Reveal>
            <SectionLabel num="07">Portfólio</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="md:text-6xl text-cream letter-tight leading-[1.05] font-serif text-2xl">
              Estética cinematográfica para{" "}
              <span className="italic text-primary">marcas que cuidam.</span>
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-5 md:col-start-8 md:pt-4">
          <Reveal delay={0.2}>
            <p className="text-lg text-cream/70 leading-relaxed">
              Selecionamos alguns dos nossos trabalhos para mostrar o padrão
              Daime — clínicas médicas, estética avançada e espaços de
              bem-estar.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-6">
        {/* Large left */}
        <Reveal className="col-span-2 md:col-span-7">
          <PortfolioCard {...items[0]} aspect="aspect-[4/5] md:aspect-[5/6]" />
        </Reveal>

        <div className="col-span-2 md:col-span-5 grid grid-cols-1 gap-4 md:gap-6">
          <Reveal delay={0.1}>
            <PortfolioCard {...items[1]} aspect="aspect-[4/3]" />
          </Reveal>
          <Reveal delay={0.2}>
            <PortfolioCard {...items[2]} aspect="aspect-[4/3]" />
          </Reveal>
        </div>

        <Reveal className="col-span-2 md:col-span-12" delay={0.15}>
          <PortfolioCard {...items[3]} aspect="aspect-[21/9]" />
        </Reveal>
      </div>

      <Reveal delay={0.3}>
        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground italic">
            Portfólio completo disponível em vídeo · Solicite um envio personalizado
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);

const PortfolioCard = ({
  src,
  label,
  category,
  aspect,
}: {
  src: string;
  label: string;
  category: string;
  aspect: string;
}) => (
  <div className={`group relative ${aspect} overflow-hidden bg-card`}>
    <img
      src={src}
      alt={label}
      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent transition-opacity shadow-sm opacity-60" />
    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-2">
        {category}
      </p>
      <h3 className="font-display text-2xl md:text-3xl text-cream letter-tight">
        {label}
      </h3>
    </div>
  </div>
);
