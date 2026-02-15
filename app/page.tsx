import Navbar from "./components/navbar";
import Hero from "./components/hero";
import Simulation from "./components/simulation";
import LiveFabrication from "./components/live-fabrication";
import FabricationControl from "./components/fabrication-control";
import Evolution from "./components/evolution";
import Architecture from "./components/architecture";
import Bibliography from "./components/bibliography";
import About from "./components/about";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <Simulation />
        <LiveFabrication />
        <FabricationControl />
        <Evolution />
        <Architecture />
        <Bibliography />
        <About />
      </div>
    </main>
  );
}
