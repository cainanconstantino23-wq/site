import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  { id: "hero", label: "Início" },
  { id: "sobre", label: "A Produtora" },
  { id: "problema", label: "Cenário" },
  { id: "metodo", label: "Método" },
  { id: "diferenciais", label: "Diferenciais" },
  { id: "processo", label: "Processo" },
  { id: "servicos", label: "Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "planos", label: "Planos" },
  { id: "contato", label: "Contato" },
];

export const Nav = () => {
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      const mid = window.scrollY + window.innerHeight / 3;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.offsetTop;
        const bot = top + el.offsetHeight;
        if (mid >= top && mid < bot) {
          setActive(s.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ink/80 backdrop-blur-xl border-b border-border/40" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a href="#hero" className="font-display text-xl md:text-2xl tracking-wide text-cream">
          Daime <span className="italic text-primary">Filmes</span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {sections.slice(1, -1).map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                active === s.id ? "text-primary" : "text-muted-foreground hover:text-cream"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <a
          href="#contato"
          className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] px-5 py-2.5 border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          Agendar conversa
        </a>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-cream p-2"
          aria-label="Menu"
        >
          <div className="w-6 h-px bg-current mb-1.5" />
          <div className="w-6 h-px bg-current mb-1.5" />
          <div className="w-4 h-px bg-current ml-auto" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-ink/95 backdrop-blur-xl border-t border-border/40"
          >
            <div className="px-6 py-6 space-y-4">
              {sections.slice(1).map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="block text-sm uppercase tracking-[0.2em] text-cream/80 hover:text-primary"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
