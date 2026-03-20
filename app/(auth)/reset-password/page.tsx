"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>Ce lien de réinitialisation est invalide ou a expiré.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/forgot-password" className="text-sm text-primary underline underline-offset-4">
            Demander un nouveau lien
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Erreur lors de la réinitialisation");
      return;
    }

    toast.success("Mot de passe réinitialisé !");
    router.push("/sign-in");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>Choisissez un nouveau mot de passe</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <PasswordInput
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <PasswordInput
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Réinitialisation..." : "Réinitialiser"}
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary underline underline-offset-4">
              Retour à la connexion
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
