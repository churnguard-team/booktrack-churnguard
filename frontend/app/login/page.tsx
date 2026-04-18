"use client"; // Indispensable pour utiliser useState dans Next.js App Router

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
        console.log("Succès, réponse du serveur :", data);
        // On sauvegarde les données (email, role, id) dans la mémoire du navigateur !
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=86400`;
        // 3. Magie ! Redirection automatique selon le rôle de la base de données 🚀
        if (data.role === "admin") {
          router.push("/admin/books");
        } else {
          router.push("/user/books");
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
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Se connecter
          </button>
          <Link href="/signup">Pas de compte ? S'inscrire</Link>
        </form>

      </div>
    </div>
  );
}
