import { Nav } from "@/components/daime/Nav";
import { Hero } from "@/components/daime/Hero";
import { About } from "@/components/daime/About";
import { Problem } from "@/components/daime/Problem";
import { Method } from "@/components/daime/Method";
import { Differentials } from "@/components/daime/Differentials";
import { Process } from "@/components/daime/Process";
import { Services } from "@/components/daime/Services";
import { Portfolio } from "@/components/daime/Portfolio";
import { Plans } from "@/components/daime/Plans";
import { Contact } from "@/components/daime/Contact";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Daime Filmes — Audiovisual estratégico para clínicas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Produtora audiovisual especializada em clínicas, estética e bem-estar. Cinema com estratégia de performance para transformar autoridade em pacientes.",
      );
    }
  }, []);

  return (
    <main className="bg-background text-foreground">
      <Nav />
      <Hero />
      <About />
      <Problem />
      <Method />
      <Differentials />
      <Process />
      <Services />
      <Portfolio />
      <Plans />
      <Contact />
    </main>
  );
};

export default Index;
