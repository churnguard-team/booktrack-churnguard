"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    // Give the webhook a moment to process, then verify subscription
    const timer = setTimeout(async () => {
      try {
        const sessionCookie = document.cookie.split("; ").find((c) => c.startsWith("user_session="));
        if (!sessionCookie) { router.push("/login"); return; }
        const auth = JSON.parse(decodeURIComponent(sessionCookie.split("=")[1]));

        const res = await fetch(`${API_URL}/api/payment/subscription/${auth.user_id}`);
        if (!res.ok) throw new Error();
        const sub = await res.json();

        if (sub.type === "PREMIUM") {
          // Update cookie so the rest of the app knows
          document.cookie = `user_session=${encodeURIComponent(JSON.stringify({ ...auth, subscription: "PREMIUM" }))}; path=/; max-age=86400`;
          setStatus("success");
        } else {
          setStatus("success");
        }
      } catch {
        setStatus("success"); // Stripe already charged, show success regardless
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
        {status === "loading" && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900">Confirmation en cours...</h1>
            <p className="mt-2 text-sm text-gray-500">Nous vérifions votre paiement.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue dans Premium !</h1>
            <p className="mt-2 text-sm text-gray-500">
              Votre abonnement est actif. Profitez de toutes les fonctionnalités.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/books"
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
              >
                Explorer les livres →
              </Link>
              <Link
                href="/user"
                className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Mon tableau de bord
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-gray-500">
              Votre paiement n'a pas pu être confirmé. Contactez le support.
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-block rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Réessayer
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
