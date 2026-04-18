import Link from "next/link";
import DeleteUserButton from "./DeleteUserButton";

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
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Gestion des utilisateurs</h1>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/admin/dashboard"
          style={{ display: "inline-block", padding: "0.55rem 0.9rem", border: "1px solid #4f46e5", borderRadius: "6px", textDecoration: "none", color: "#4f46e5", fontWeight: 600 }}
        >
          📊 Dashboard
        </Link>
        <Link
          href="/admin/books"
          style={{ display: "inline-block", padding: "0.55rem 0.9rem", border: "1px solid #333", borderRadius: "6px", textDecoration: "none", color: "#111" }}
        >
          Retour aux livres
        </Link>
        <Link
          href="/admin/users/add"
          style={{ display: "inline-block", padding: "0.55rem 0.9rem", border: "1px solid #333", borderRadius: "6px", textDecoration: "none", color: "#111" }}
        >
          Ajouter utilisateur
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: "#fff",
              color: "#111",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem" }}>
              {user.prenom} {user.nom}
            </h3>
            <p style={{ color: "#666", margin: "0 0 0.25rem" }}>{user.email}</p>
            <p style={{ color: user.is_active ? "#0f766e" : "#b91c1c", margin: 0 }}>
              {user.is_active ? "Actif" : "Inactif"}
            </p>
            <DeleteUserButton userId={user.id} />
          </div>
        ))}
      </div>
    </main>
  );
}


