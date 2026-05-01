// Composant client requis pour encapsuler SessionProvider (NextAuth)
// SessionProvider doit être côté client car il utilise le contexte React
"use client";
import { SessionProvider } from "next-auth/react";

export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  // SessionProvider rend la session Google accessible via useSession() dans toute l'appli
  return <SessionProvider>{children}</SessionProvider>;
}
