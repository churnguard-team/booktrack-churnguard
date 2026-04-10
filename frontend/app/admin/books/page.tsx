import Link from "next/link";
import DeleteBookButton from "./DeleteBookButton";

type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
};

async function getBooks(): Promise<BookItem[]> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const res = await fetch(`${apiUrl}/books`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la recuperation des livres");
  }

  return res.json();
}

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Liste des livres</h1>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem", marginBottom: "1rem" }}>
        <Link
          href="/admin/books/add"
          style={{
            display: "inline-block",
            padding: "0.55rem 0.9rem",
            border: "1px solid #333",
            borderRadius: "6px",
            textDecoration: "none",
            color: "#111",
          }}
        >
          Ajouter un livre
        </Link>
        <Link
          href="/admin/users"
          style={{
            display: "inline-block",
            padding: "0.55rem 0.9rem",
            border: "1px solid #333",
            borderRadius: "6px",
            textDecoration: "none",
            color: "#111",
          }}
        >
          Gerer les utilisateurs
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {books.map((book) => (
          <div
            key={book.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: "#fff",
              color: "#111",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem" }}>{book.title}</h3>
            <p style={{ color: "#666", margin: "0 0 0.25rem" }}>{book.auteur}</p>
            <p style={{ color: "#888", margin: "0 0 0.25rem" }}>{book.genre}</p>
            <p style={{ fontSize: "0.85rem", color: "#999" }}>{book.description}</p>
            <DeleteBookButton bookId={book.id} />
          </div>
        ))}
      </div>
    </main>
  );
}

