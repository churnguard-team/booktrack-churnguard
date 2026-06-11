import Link from "next/link";
import DeleteUserButton from "./DeleteUserButton";
import Navbar from "@/app/components/Navbar";

type UserItem = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  is_active: boolean;
};

async function getUsers(): Promise<UserItem[]> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const res = await fetch(`${apiUrl}/users`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la recuperation des utilisateurs");
  }

  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestion des utilisateurs</h1>
            <p className="mt-1 text-sm text-gray-500">Administrez les comptes et leur statut.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/books"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Retour aux livres
            </Link>
            <Link
              href="/admin/users/add"
              className="rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-700"
            >
              Ajouter utilisateur
            </Link>
          </div>
        </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-xl border border-gray-100 bg-white p-4 text-gray-900 shadow-sm"
          >
            <h3 className="mb-2 font-semibold text-gray-900">
              {user.prenom} {user.nom}
            </h3>
            <p className="mb-1 break-all text-sm text-gray-500">{user.email}</p>
            <p className={user.is_active ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
              {user.is_active ? "Actif" : "Inactif"}
            </p>

            {/* Boutons Modifier + Supprimer sur la même ligne */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {/* Modifier → redirige vers la page d'édition */}
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ✏️ Modifier
              </Link>

              {/* Supprimer (Client Component existant) */}
              <div style={{ flex: 1 }}>
                <DeleteUserButton userId={user.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </main>
  );
}


