"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FEATURES_FREE = [
  "Accès au catalogue complet",
  "Ajouter jusqu'à 10 livres à votre bibliothèque",
  "Suivi de lecture basique",
];

const FEATURES_PREMIUM = [
  "Bibliothèque illimitée",
  "Recommandations personnalisées par IA",
  "Statistiques de lecture avancées (GenreRadar)",
  "Commentaires sur les livres",
  "Support prioritaire",
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setError("");
    const sessionCookie = document.cookie.split("; ").find((c) => c.startsWith("user_session="));
    if (!sessionCookie) {
      router.push("/login");
      return;
    }
    const auth = JSON.parse(decodeURIComponent(sessionCookie.split("=")[1]));
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: auth.user_id, email: auth.email }),
      });

      if (!res.ok) throw new Error("Impossible de créer la session de paiement.");
      const data = await res.json();
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Choisissez votre plan</h1>
          <p className="mt-3 text-gray-500 text-lg">Commencez gratuitement, passez Premium quand vous voulez.</p>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* FREE */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Gratuit</span>
              <div className="mt-2 text-5xl font-bold text-gray-900">0 MAD</div>
              <p className="mt-1 text-sm text-gray-400">Pour toujours</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-green-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed"
            >
              Plan actuel
            </button>
          </div>

          {/* PREMIUM */}
          <div className="rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-lg flex flex-col relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
              Recommandé
            </div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Premium</span>
              <div className="mt-2 text-5xl font-bold text-gray-900">99 MAD</div>
              <p className="mt-1 text-sm text-gray-400">par mois</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FEATURES_PREMIUM.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-blue-600 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Redirection..." : "Passer Premium →"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Paiement sécurisé par Stripe. Annulation possible à tout moment.
        </p>
      </div>
    </main>
  );
}
