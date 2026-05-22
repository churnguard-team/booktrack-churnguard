"use client";

import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900">Paiement annulé</h1>
        <p className="mt-2 text-sm text-gray-500">
          Vous avez annulé le paiement. Votre compte reste en plan gratuit.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Voir les plans →
          </Link>
          <Link
            href="/books"
            className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
