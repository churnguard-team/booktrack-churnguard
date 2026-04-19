"use client";
// ============================================================
// EditUserForm.tsx — Formulaire de modification d'un utilisateur
// Client Component : utilise useState pour gérer le formulaire
// et fetch() pour envoyer le PUT au backend
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  is_active: boolean;
};

export default function EditUserForm({ user }: { user: User }) {
  const router = useRouter();

  // Pré-remplissage du formulaire avec les données actuelles
  const [form, setForm] = useState({
    prenom:    user.prenom,
    nom:       user.nom,
    email:     user.email,
    is_active: user.is_active,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom:    form.prenom,
          nom:       form.nom,
          email:     form.email,
          is_active: form.is_active,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Erreur serveur (${res.status})`);
      }

      setSuccess(true);
      // Redirection vers la liste après 1.5s
      setTimeout(() => router.push("/admin/users"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Messages de succès / erreur */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          ✅ Utilisateur modifié avec succès ! Redirection...
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Prénom + Nom côte à côte */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input
            type="text"
            value={form.prenom}
            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
      </div>

      {/* Statut actif/inactif */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input
          id="is_active"
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="w-4 h-4 accent-indigo-600 cursor-pointer"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
          Compte actif
        </label>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full
          ${form.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {form.is_active ? "Actif" : "Inactif"}
        </span>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm
                     hover:bg-gray-50 transition-colors font-medium"
        >
          ← Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || success}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enregistrement..." : "💾 Enregistrer"}
        </button>
      </div>
    </form>
  );
}
