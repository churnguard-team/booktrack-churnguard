import Link from "next/link";
import AddUserForm from "../AddUserForm";

export default function AddUserPage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Nouveau utilisateur</h1>
      <Link
        href="/admin/users"
        style={{
          display: "inline-block",
          margin: "0.5rem 0 1rem",
          padding: "0.5rem 0.85rem",
          border: "1px solid #334155",
          borderRadius: "8px",
          backgroundColor: "#f8fafc",
          textDecoration: "none",
          color: "#0f172a",
          fontWeight: 500,
        }}
      >
        Retour a la liste
      </Link>
      <AddUserForm />
    </main>
  );
}


