import { motion } from "framer-motion";
import heroImg from "@/assets/hero-camera.jpg";

export const Hero = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ink"
    >
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <img
          src={heroImg}
          alt="Câmera cinematográfica em set de filmagem"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/30 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-ink/40" />
        <div className="absolute inset-0 vignette" />
      </motion.div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 w-full pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex items-center gap-4 mb-8 font-serif"
        >
          <span className="h-px w-12 bg-primary" />
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary">
            Proposta Comercial · 2026
          </span>
        </motion.div>

        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl text-cream leading-[0.95] letter-tight"
          >
            Audiovisual que <br />
            <span className="italic text-gradient-ember">transforma autoridade</span>
            <br />
            em pacientes.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-10 text-base md:text-xl text-cream/70 max-w-2xl leading-relaxed font-light"
          >
            Unimos cinema, estratégia e performance para transformar a identidade
            da sua clínica em um ativo que atrai, converte e fideliza.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mt-12 flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#sobre"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-xs uppercase tracking-[0.25em] hover:bg-primary/90 transition-all"
            >
              Ver proposta
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href="#contato"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-cream/30 text-cream text-xs uppercase tracking-[0.25em] hover:border-cream hover:bg-cream/5 transition-all"
            >
              Agendar diagnóstico
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-cream/50"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Role</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-10 bg-gradient-to-b from-cream/60 to-transparent"
        />
      </motion.div>
    </section>
  );
};
