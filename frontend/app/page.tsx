import Navbar from "@/app/components/Navbar";
import SearchInput from "@/app/admin/books/SearchInput";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


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
  // Identité de l'utilisateur
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) redirect("/login");
  const user = JSON.parse(decodeURIComponent(sessionCookie.value));

  const params = await searchParams;
  const recherche = params.q?.toLowerCase() || "";

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // On appelle les 2 APIs EN MÊME TEMPS pour aller plus vite !
  const [allBooksRes, libraryRes] = await Promise.all([
    fetch(`${apiUrl}/books`, { cache: "no-store" }),
    fetch(`${apiUrl}/users/${user.user_id}/library`, { cache: "no-store" }),
  ]);

  const allBooks = allBooksRes.ok ? await allBooksRes.json() : [];
  const library = libraryRes.ok ? await libraryRes.json() : [];

  // On crée un dictionnaire rapide : { "book_id": { is_favourite: true/false } }
  const libraryMap = new Map(library.map((ub: { book_id: string; is_favourite: boolean }) => [ub.book_id, ub]));

  // Filtre de recherche
  const filteredBooks = allBooks.filter((book: { title: string }) =>
    book.title.toLowerCase().includes(recherche)
  );

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 0" }}>
        <h1 style={{ color: "#111", marginBottom: "1.5rem" }}>Bibliothèque des Livres</h1>
        <SearchInput />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {filteredBooks.map((book: BookItem) => {
            // Pour chaque livre, on vérifie s'il est déjà dans la bibliothèque
            const userBook = libraryMap.get(book.id);
            const isInLibrary = !!userBook;
            const isFavourite = isInLibrary ? (userBook as { is_favourite: boolean }).is_favourite : false;

            return (
              <div
                key={book.id}
                style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", backgroundColor: "#fff", color: "#111", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}
              >
                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      marginBottom: "0.75rem"
                    }}
                  />
                )}
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>{book.title}</h3>
                <p style={{ color: "#555", margin: "0 0 0.25rem", fontWeight: "bold" }}>{book.auteur}</p>
                <p style={{ color: "#888", margin: "0 0 0.5rem" }}>{book.genre}</p>
                <p style={{ fontSize: "0.9rem", color: "#666", flexGrow: 1 }}>{book.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


