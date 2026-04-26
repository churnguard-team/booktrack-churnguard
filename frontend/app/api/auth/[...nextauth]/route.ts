// Route NextAuth — gère tout le flux OAuth Google automatiquement
// URL : /api/auth/[...nextauth] (intercepte /api/auth/signin, /callback, /signout, etc.)

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Configuration principale de NextAuth
const handler = NextAuth({
  providers: [
    // Fournisseur Google OAuth — utilise les clés du fichier .env.local
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Ce callback s'exécute APRÈS que Google a authentifié l'utilisateur
    // On l'utilise pour créer/retrouver l'utilisateur dans notre base de données
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Utilise API_URL (serveur Docker) en priorité, sinon NEXT_PUBLIC_API_URL (navigateur/local)
          const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

          // Appel POST vers notre backend FastAPI pour créer ou retrouver l'utilisateur
          // Le backend reçoit les infos Google et gère la logique métier
          const res = await fetch(`${apiUrl}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              nom: user.name?.split(" ").slice(-1)[0] || "",    // Nom de famille (dernier mot)
              prenom: user.name?.split(" ")[0] || "",           // Prénom (premier mot)
              oauth_id: account.providerAccountId,               // ID unique Google
              oauth_provider: "google",
              photo_url: user.image,                            // Avatar Google
            }),
          });

          // Si le backend retourne une erreur, on bloque la connexion
          if (!res.ok) {
            const errorBody = await res.text();
            console.error("Backend error during Google Auth:", res.status, errorBody);
            return false;
          }

          // Stocke les données de notre backend dans la session NextAuth
          const data = await JSON.parse(await res.text());
          user.id = data.user_id;         // On remplace l'ID Google par notre UUID
          (user as any).role = data.role;
          (user as any).has_onboarded = data.has_onboarded;
          (user as any).prenom = data.prenom;
          (user as any).nom = data.nom;
          (user as any).email = data.email;

          return true; // Connexion autorisée
        } catch (error) {
          console.error("Network error during Google Auth:", error);
          return false; // Connexion refusée en cas d'erreur réseau
        }
      }
      return true;
    },

    // Ce callback enrichit le token JWT avec nos données personnalisées
    async jwt({ token, user }) {
      if (user) {
        // Ajoute les champs de notre backend au token JWT NextAuth
        token.user_id = user.id;
        token.role = (user as any).role;
        token.has_onboarded = (user as any).has_onboarded;
        token.prenom = (user as any).prenom;
        token.nom = (user as any).nom;
        token.email = (user as any).email || token.email;
      }
      return token;
    },

    // Ce callback rend nos données accessibles dans useSession() côté client
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.user_id as string,
        role: token.role as string,
        has_onboarded: token.has_onboarded as boolean,
      } as any;
      return session;
    },

    // Ce callback gère la redirection après connexion Google réussie
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/api/auth/set-session`;
    },
  },

  // Page de connexion personnalisée (notre propre page /login)
  pages: {
    signIn: "/login",
  },

  // Utilise JWT pour stocker la session (compatible avec notre cookie actuel)
  session: {
    strategy: "jwt",
  },
});

// Next.js App Router : export GET et POST pour que NextAuth réponde aux deux méthodes
export { handler as GET, handler as POST };
