// ============================================================
// /admin/users/[id]/edit/page.tsx — Page de modification utilisateur
// Server Component : fetch des données côté serveur pour pré-remplir
// ============================================================

import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import EditUserForm from "./EditUserForm";

// Type correspondant à UserResponse du backend
type UserData = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  is_active: boolean;
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // GET /users/{id} — récupère les données actuelles de l'utilisateur
  const res = await fetch(`${apiUrl}/users/${id}`, { cache: "no-store" });

  if (!res.ok) notFound(); // Affiche la page 404 si l'ID est invalide

  const user: UserData = await res.json();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-10">

        {/* En-tête */}
        <div className="mb-8">
          <p className="text-sm text-indigo-600 font-medium mb-1">Administration</p>
          <h1 className="text-2xl font-bold text-gray-900">
            ✏️ Modifier l'utilisateur
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user.prenom} {user.nom} — {user.email}
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* EditUserForm est un Client Component qui gère le formulaire */}
          <EditUserForm user={user} />
        </div>

      </div>
    </div>
  );
}
