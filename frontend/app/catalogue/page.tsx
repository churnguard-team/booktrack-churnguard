import Link from "next/link";

type Book = {
  id: string;
  title: string;
  auteur?: string;
  genre?: string;
  description?: string;
  cover_url?: string;
  nb_pages?: number;
  langue?: string;
};

async function getBooks(): Promise<Book[]> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/books`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const COVER_COLORS = ["#1a1a2e", "#1a2e1a", "#2e1a1a", "#2e2a1a", "#1a2a2e", "#2a1a2e"];

function getPrix(id: string): string {
  const prices = [75, 89, 95, 110, 120, 85, 99, 130];
  const idx = id.charCodeAt(0) % prices.length;
  return `${prices[idx]} MAD`;
}

export default async function CataloguePage() {
  const books = await getBooks();

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", fontFamily: "'Inter', sans-serif", color: "#f5f0e8" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 3rem", borderBottom: "1px solid #1a1a1a", position: "sticky", top: 0, zIndex: 100, background: "rgba(13,13,13,0.97)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#c9a84c", fontWeight: 700, textTransform: "uppercase" }}>Librairie</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f5f0e8", letterSpacing: "-0.02em", lineHeight: 1 }}>BookTrack</div>
          </Link>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {["Catalogue", "Nouveautés", "Meilleures ventes"].map(l => (
              <span key={l} style={{ padding: "0.45rem 0.85rem", color: "#666", fontSize: "0.85rem", fontWeight: 500 }}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link href="/login" style={{ padding: "0.5rem 1rem", color: "#888", textDecoration: "none", fontSize: "0.85rem" }}>Connexion</Link>
          <Link href="/register" style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
            Mon compte
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            {books.length} titres disponibles
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Catalogue</h1>
        </div>

        {books.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <div style={{ fontSize: "0.9rem", color: "#444", marginBottom: "1.5rem" }}>
              Le catalogue est vide pour le moment.
            </div>
            <Link href="/login" style={{ padding: "0.7rem 1.5rem", borderRadius: "8px", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
              Espace administration
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1.25rem" }}>
            {books.map((book, i) => {
              const coverColor = COVER_COLORS[i % COVER_COLORS.length];
              const prix = getPrix(book.id);
              return (
                <div key={book.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
                  {/* Cover */}
                  <div style={{ height: "220px", background: book.cover_url ? `url(${book.cover_url}) center/cover` : coverColor, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1rem" }}>
                    {book.genre && (
                      <span style={{ alignSelf: "flex-start", fontSize: "0.62rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(0,0,0,0.7)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                        {book.genre}
                      </span>
                    )}
                    {book.langue && (
                      <span style={{ alignSelf: "flex-end", fontSize: "0.62rem", color: "#888", background: "rgba(0,0,0,0.6)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                        {book.langue.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "1rem" }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f5f0e8", marginBottom: "0.25rem", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {book.title}
                    </div>
                    {book.auteur && (
                      <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" }}>{book.auteur}</div>
                    )}
                    {book.description && (
                      <div style={{ fontSize: "0.72rem", color: "#444", lineHeight: 1.5, marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {book.description}
                      </div>
                    )}
                    {book.nb_pages && (
                      <div style={{ fontSize: "0.7rem", color: "#333", marginBottom: "0.75rem" }}>{book.nb_pages} pages</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#c9a84c" }}>{prix}</span>
                      <button style={{ padding: "0.4rem 0.85rem", borderRadius: "6px", border: "none", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer minimal */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "1.5rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3rem" }}>
        <span style={{ fontSize: "0.72rem", color: "#333" }}>© 2026 BookTrack</span>
        <Link href="/" style={{ fontSize: "0.72rem", color: "#444", textDecoration: "none" }}>← Accueil</Link>
      </footer>
    </div>
  );
}
