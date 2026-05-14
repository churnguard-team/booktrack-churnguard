// Route spéciale qui transforme la session NextAuth en cookie "user_session"
// Compatible avec notre middleware.ts existant qui lit ce cookie
// URL : /api/auth/set-session

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  // Récupère le token JWT NextAuth depuis les cookies de la requête
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Si pas de token valide, redirige vers la page de connexion
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Construit l'objet session au même format que notre login classique
  // (le middleware.ts s'attend à ce format précis dans le cookie)
  const sessionData = {
    user_id: token.user_id,
    role: token.role || "user",
    has_onboarded: token.has_onboarded ?? false,
    email: token.email,
    prenom: token.prenom || (token.name ? token.name.split(" ")[0] : "Utilisateur"),
    nom: token.nom || (token.name ? token.name.split(" ").slice(-1)[0] : ""),
  };

  // Détermine la page de redirection selon le rôle et l'onboarding
  let redirectUrl = "/";
  if (sessionData.role === "admin") {
    redirectUrl = "/admin/books";
  } else if (!sessionData.has_onboarded) {
    redirectUrl = "/onboarding"; // Nouvel utilisateur Google → quiz de préférences
  } else {
    redirectUrl = "/user/books";
  }

  // Crée la réponse de redirection
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));

  // Pose le cookie "user_session" au même format que le login classique
  // Ce cookie est lu par middleware.ts pour protéger les routes
  response.cookies.set(
    "user_session",
    encodeURIComponent(JSON.stringify(sessionData)),
    {
      httpOnly: false,   // false pour que le JS côté client puisse le lire (comme avant)
      path: "/",
      maxAge: 86400,     // 24 heures (même durée que le login classique)
    }
  );

  return response;
}
