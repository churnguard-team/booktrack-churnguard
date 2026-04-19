import Link from "next/link";
import DeleteBookButton from "./DeleteBookButton";
import Navbar from "@/app/components/Navbar";
import SearchInput from "./SearchInput";

type BookItem = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
  cover_url?: string;
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



export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // On attend la lecture de l'URL
  const params = await searchParams;
  const recherche = params.q?.toLowerCase() || "";
  // On récupère tous les livres
  const allBooks = await getBooks();
  // On filtre la liste : on garde uniquement les livres où le titre contient notre recherche
  const filteredBooks = allBooks.filter((book) =>
    book.title.toLowerCase().includes(recherche)
  );

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <Navbar />
      <h1>Liste des livres</h1>
      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem", marginBottom: "1.5rem",alignItems: "center" }}>
        <Link
          href="/admin/books/add"
          style={{
            display: "flex",
            alignItems: "center",
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
            display: "flex",
            alignItems: "center",
            padding: "0.55rem 0.9rem",
            border: "1px solid #333",
            borderRadius: "6px",
            textDecoration: "none",
            color: "#111",
          }}
        >
          Gerer les utilisateurs
        </Link>
        <SearchInput />
      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {filteredBooks.map((book) => (
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
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                  border: "1px solid #eee",
                }}
              />
            ) : null}
            <h3 style={{ margin: "0 0 0.5rem" }}>{book.title}</h3>
            <p style={{ color: "#666", margin: "0 0 0.25rem" }}>{book.auteur}</p>
            <p style={{ color: "#888", margin: "0 0 0.25rem" }}>{book.genre}</p>
            <p style={{ fontSize: "0.85rem", color: "#999" }}>{book.description}</p>
            <DeleteBookButton bookId={book.id} />
          </div>
          
        ))}
         {/* Message si la recherche ne donne rien */}
          {filteredBooks.length === 0 && (
            <div style={{ color: "#666", padding: "1rem", backgroundColor: "#fff", border: "1px dashed #ccc", borderRadius: "8px" }}>
              Aucun livre ne correspond à la recherche "{recherche}".
            </div>
          )}
      </div>
    </main>
  );
}

