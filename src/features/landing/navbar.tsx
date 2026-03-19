import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h3v3H7z"/><path d="M14 7h3"/><path d="M14 11h3"/><path d="M7 14h10"/><path d="M7 18h10"/></svg>
          Slide Composer
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Connexion
          </Link>
          <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}
