# Configuration OAuth — Slide Composer

Guide pour configurer la connexion via GitHub, Google et GitLab.

## Prérequis

- L'app tourne sur `http://localhost:3000` en dev
- En production, remplacez par votre domaine (ex: `https://slides.example.com`)

---

## GitHub

1. Allez sur **[github.com/settings/developers](https://github.com/settings/developers)**
2. Cliquez **OAuth Apps** → **New OAuth App**
3. Remplissez :
   | Champ | Valeur |
   |-------|--------|
   | Application name | `Slide Composer` |
   | Homepage URL | `http://localhost:3000` |
   | Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |
4. Cliquez **Register application**
5. Copiez le **Client ID**
6. Cliquez **Generate a new client secret** et copiez le **Client Secret**
7. Ajoutez dans `.env.local` :
   ```
   GITHUB_CLIENT_ID=votre_client_id
   GITHUB_CLIENT_SECRET=votre_client_secret
   ```

---

## Google

1. Allez sur **[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)**
2. Sélectionnez ou créez un projet
3. Cliquez **Create Credentials** → **OAuth client ID**
4. Si demandé, configurez d'abord le **OAuth consent screen** :
   - User Type : **External**
   - App name : `Slide Composer`
   - User support email : votre email
   - Authorized domains : `localhost` (dev) ou votre domaine (prod)
   - Sauvegardez
5. Retournez sur **Credentials** → **Create Credentials** → **OAuth client ID**
6. Remplissez :
   | Champ | Valeur |
   |-------|--------|
   | Application type | `Web application` |
   | Name | `Slide Composer` |
   | Authorized JavaScript origins | `http://localhost:3000` |
   | Authorized redirect URIs | `http://localhost:3000/api/auth/callback/google` |
7. Cliquez **Create** et copiez **Client ID** + **Client Secret**
8. Ajoutez dans `.env.local` :
   ```
   GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=votre_client_secret
   ```

---

## GitLab

1. Allez sur **[gitlab.com/-/user_settings/applications](https://gitlab.com/-/user_settings/applications)**
2. Cliquez **Add new application**
3. Remplissez :
   | Champ | Valeur |
   |-------|--------|
   | Name | `Slide Composer` |
   | Redirect URI | `http://localhost:3000/api/auth/callback/gitlab` |
   | Confidential | ✅ Oui |
   | Scopes | `read_user` |
4. Cliquez **Save application**
5. Copiez l'**Application ID** et le **Secret**
6. Ajoutez dans `.env.local` :
   ```
   GITLAB_CLIENT_ID=votre_application_id
   GITLAB_CLIENT_SECRET=votre_secret
   ```

> **GitLab self-hosted** : si vous utilisez une instance GitLab privée, Better Auth supporte l'option `issuer` dans la config pour pointer vers votre instance.

---

## Vérification

1. Relancez le serveur : `pnpm dev`
2. Allez sur `http://localhost:3000/sign-in`
3. Les boutons GitHub, Google et GitLab doivent apparaître
4. Cliquez sur un bouton pour tester le flow OAuth

## Notes

- Les providers non configurés (variables vides) afficheront une erreur au clic — c'est normal, il suffit de configurer ceux que vous souhaitez utiliser.
- En **production**, mettez à jour toutes les URLs callback avec votre domaine réel.
- Le **BETTER_AUTH_SECRET** doit être un secret aléatoire fort en production (ex: `openssl rand -base64 32`).
