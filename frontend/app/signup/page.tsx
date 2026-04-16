"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Pratique pour faire le bouton "Retour à la connexion"

export default function SignupPage() {
  const router = useRouter();
  // On regroupe toutes les infos dans un seul objet "form"
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Petites vérifications de sécurité avant l'envoi
    if (!form.email || !form.password || !form.nom || !form.prenom) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // On toque à la porte de ton routeur Backend "users.py"
      const response = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          nom: form.nom,
          prenom: form.prenom,
          password_hash: form.password, // Ton backend attend explicitement "password_hash"
          is_active: true
        }),
      });

      if (response.ok) {
        console.log("Compte créé avec succès !");
        // Succès ! On renvoie le nouvel utilisateur vers la page de connexion
        router.push("/");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Erreur lors de la création du compte.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Rejoindre BookTrack 📚
        </h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded">{error}</p>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          
          {/* On met Prénom et Nom côte à côte pour faire plus joli */}
          <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">Prénom</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 text-white font-bold rounded-md transition ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Création en cours..." : "S'inscrire"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4 border-t pt-4">
          Déjà un compte ?{" "}
          <Link href="/" className="text-blue-600 hover:underline font-bold">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  );
}
