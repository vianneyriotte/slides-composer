"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthButtons } from "@/components/oauth-buttons";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn.email({ email, password });

    if (error) {
      toast.error(error.message ?? "Erreur de connexion");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      toast.error("Entrez votre email d'abord");
      return;
    }
    setSendingMagicLink(true);

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });

    setSendingMagicLink(false);

    if (error) {
      toast.error(error.message ?? "Erreur lors de l'envoi");
      return;
    }

    setMagicLinkSent(true);
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Vérifiez votre email</CardTitle>
            <CardDescription>
              Un lien de connexion a été envoyé à <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cliquez sur le lien dans l&apos;email pour vous connecter. Le lien expire dans 5 minutes.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => setMagicLinkSent(false)}>
              ← Retour
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <PasswordInput
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={handleMagicLink}
            disabled={sendingMagicLink}
          >
            {sendingMagicLink ? "Envoi..." : "Recevoir un lien par email"}
          </Button>
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/sign-up" className="text-primary underline underline-offset-4">
              S&apos;inscrire
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
