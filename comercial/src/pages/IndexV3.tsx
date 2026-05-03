import { useEffect } from "react";
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
import "./v3.css";

const IndexV3 = () => {
  useEffect(() => {
    document.title = "Daime Filmes — v3 · Audiovisual com leveza e estratégia";
  }, []);

  return (
    <div className="v3-scope">
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
    </div>
  );
};

export default IndexV3;
