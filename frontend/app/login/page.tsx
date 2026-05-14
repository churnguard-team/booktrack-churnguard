"use client"; // Indispensable pour utiliser useState dans Next.js App Router

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react"; // Import NextAuth pour le bouton Google

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false); // Loader pour le bouton Google

  // Note le mot-clé "async" qui permet d'attendre la réponse du serveur
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      // 1. On interroge notre nouvelle route Backend (port 8000)
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // On envoie un JSON avec tes identifiants (qui correspond au LoginRequest)
        body: JSON.stringify({ email: email, password: password }),
      });

      // 2. Si le Backend répond OK (200) = Mot de passe correct !
      if (response.ok) {
        const data = await response.json();
        // On sauvegarde les données de session dans le cookie (24h)
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=86400`;

        if (data.role === "admin") {
          router.push("/admin/books");
        } else if (!data.has_onboarded) {
          // Nouvel utilisateur (genres_preferes vide) → quiz d'onboarding !
          router.push("/onboarding");
        } else {
          // Utilisateur existant → page d'accueil avec le carousel
          router.push("/");
        }
      }
      // 4. Si le Backend refuse (mot de passe faux ou email inconnu)
      else {
        const errorData = await response.json();
        setError(errorData.detail || "Identifiants incorrects.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur. Est-il bien lancé ?");
      console.error("Erreur serveur :", err);
    }
  };

  // Déclenche le flux OAuth Google via NextAuth
  // NextAuth redirige vers Google, puis rappelle /api/auth/callback/google
  // puis /api/auth/set-session qui pose notre cookie user_session
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError("");
    try {
      // callbackUrl : page vers laquelle NextAuth redirige après le callback
      await signIn("google", { callbackUrl: "/api/auth/set-session" });
    } catch {
      setError("Erreur lors de la connexion avec Google.");
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">

        <h1 className="text-2xl font-bold text-center text-gray-900">
          Connexion à BookTrack
        </h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Identifiant</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="user"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Bouton de connexion classique */}
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Se connecter
          </button>
        </form>

        {/* Séparateur visuel entre les deux méthodes de connexion */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-sm text-gray-400">ou</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Bouton connexion Google — déclenche le flux OAuth via NextAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-2
                     bg-white border border-gray-300 rounded-md text-gray-700
                     hover:bg-gray-50 hover:border-gray-400 transition-colors
                     font-medium text-sm shadow-sm disabled:opacity-60"
        >
          {/* Logo Google en SVG (pas besoin d'image externe) */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 12 24 12c3 0 5.7 1.1 7.8 2.9l6-6C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-1.8 13.7-4.8l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.5-3.4-11.2-8l-6.6 5.1C9.7 39.7 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.7l6.3 5.2C41.2 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {loadingGoogle ? "Redirection..." : "Continuer avec Google"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-4 border-t pt-4">
          Pas de compte ?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline font-bold">
            S&apos;inscrire
          </Link>
        </p>

      </div>
    </div>
  );
}
