import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/mail";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe — Slide Composer",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="margin-bottom:16px;">Réinitialisation du mot de passe</h2>
            <p>Bonjour ${user.name},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
            <p style="margin:24px 0;">
              <a href="${url}" style="background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p style="color:#888;font-size:14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
            <p style="color:#888;font-size:14px;">Ce lien expire dans 1 heure.</p>
          </div>
        `,
      });
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Votre lien de connexion — Slide Composer",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="margin-bottom:16px;">Connexion à Slide Composer</h2>
              <p>Cliquez sur le lien ci-dessous pour vous connecter :</p>
              <p style="margin:24px 0;">
                <a href="${url}" style="background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                  Se connecter
                </a>
              </p>
              <p style="color:#888;font-size:14px;">Ce lien expire dans 5 minutes.</p>
              <p style="color:#888;font-size:14px;">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    gitlab: {
      clientId: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
