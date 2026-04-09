async function getBooks() {
  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const res = await fetch(`${apiUrl}/books`, {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la récupération des livres");
  }

  return res.json();
}

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1> Liste des Livres</h1>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1rem",
        marginTop: "1rem"
      }}>
        {books.map((book: any) => (
          <div key={book.id} style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>{book.title}</h3>
            <p style={{ color: "#666", margin: "0 0 0.25rem" }}>{book.auteur}</p>
            <p style={{ color: "#888", margin: "0 0 0.25rem" }}> {book.genre}</p>
            <p style={{ fontSize: "0.85rem", color: "#999" }}>{book.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}