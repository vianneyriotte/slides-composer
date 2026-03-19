import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
        Hébergez vos présentations en un clic
      </div>

      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Vos slides,{" "}
        <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
          en ligne
        </span>
      </h1>

      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Uploadez vos présentations HTML, partagez-les avec un lien.
        Simple, rapide, sans friction.
      </p>

      <div className="mt-8 flex gap-3">
        <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
          Commencer gratuitement
        </Link>
        <Link href="/p/git-basics" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Voir un exemple
        </Link>
      </div>
    </section>
  );
}
