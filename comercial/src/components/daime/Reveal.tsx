import { motion } from "framer-motion";
import { ReactNode } from "react";

export const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SectionLabel = ({ children, num }: { children: ReactNode; num?: string }) => (
  <div className="flex items-center gap-4 mb-8 font-serif">
    {num && (
      <span className="font-display italic text-primary/80 text-sm">{num}</span>
    )}
    <span className="h-px w-10 bg-primary/40" />
    <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground">
      {children}
    </span>
  </div>
);
