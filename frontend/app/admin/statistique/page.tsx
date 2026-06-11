import Link from "next/link";
import Navbar from "@/app/components/Navbar";

const API = process.env.API_URL ?? "http://localhost:8000";

type PopularBook = { book_id: string; title: string; auteur: string; genre: string; cover_url: string; nb_ajouts: number; note_moyenne: number | null; nb_commentaires: number };
type RecentBook = { id: string; title: string; auteur: string; created_at: string };
type RecentUser = { id: string; email: string; nom: string; prenom: string; created_at: string };
type AdminStats = {
  total_books: number;
  total_users: number;
  recent_books: RecentBook[];
  recent_users: RecentUser[];
  popular_books: PopularBook[];
};

async function getStats(): Promise<AdminStats | null> {
  const res = await fetch(`${API}/dashboard/admin/stats`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminStatistiquePage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900"> Statistiques</h1>
            <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme BookTrack</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/books"
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 text-center">
              📚 Livres
            </Link>
            <Link href="/admin/users"
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 text-center">
              👥 Utilisateurs
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Total Livres
            </p>
            <p className="text-4xl font-bold text-gray-900 mt-3">{stats?.total_books ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">dans le catalogue</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Total Utilisateurs
            </p>
            <p className="text-4xl font-bold text-gray-900 mt-3">{stats?.total_users ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">comptes inscrits</p>
          </div>
        </div>

        {/* Listes récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Livres récents */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                 Livres récemment ajoutés
              </h2>
              <Link href="/admin/books"
                className="text-xs text-indigo-600 hover:underline font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {(stats?.recent_books ?? []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun livre récent.</p>
              )}
              {(stats?.recent_books ?? []).map((book) => (
                <div key={book.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{book.title}</p>
                    <p className="text-xs text-gray-400">{book.auteur}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-4 bg-gray-50 px-2 py-1 rounded-lg">
                    {book.created_at
                      ? new Date(book.created_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Utilisateurs récents */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                 Utilisateurs récemment inscrits
              </h2>
              <Link href="/admin/users"
                className="text-xs text-indigo-600 hover:underline font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {(stats?.recent_users ?? []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur récent.</p>
              )}
              {(stats?.recent_users ?? []).map((user) => (
                <div key={user.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-4 bg-gray-50 px-2 py-1 rounded-lg">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Livres les plus recommandés */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              🏆 Livres les plus recommandés
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Livre</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Genre</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase text-center">Ajouts</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase text-center">Note moy.</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase text-center">Commentaires</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.popular_books ?? []).map((book, i) => (
                  <tr key={book.book_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                        {book.cover_url && (
                          <img src={book.cover_url} alt={book.title}
                            className="w-8 h-10 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{book.title}</p>
                          <p className="text-xs text-gray-400">{book.auteur}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                        {book.genre ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 text-center font-semibold text-gray-700">{book.nb_ajouts}</td>
                    <td className="py-3 text-center">
                      {book.note_moyenne
                        ? <span className="text-amber-500 font-semibold">★ {book.note_moyenne}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 text-center text-gray-600">{book.nb_commentaires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
