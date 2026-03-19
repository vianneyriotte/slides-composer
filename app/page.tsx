import { Navbar } from "@/features/landing/navbar";
import { Hero } from "@/features/landing/hero";
import { Features } from "@/features/landing/features";
import { Footer } from "@/features/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </>
  );
}
