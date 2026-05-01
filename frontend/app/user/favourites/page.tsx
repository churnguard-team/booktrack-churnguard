import Navbar from "@/app/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDictionary } from "@/app/i18n/dictionaries";

type UserBook = {
  book_id: string;
  title: string;
  auteur: string;
  cover_url: string;
  status: string;
  is_favourite: boolean;
};

export default async function FavouritesPage() {
  // 1. Récupérer l'identité de l'utilisateur via le cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("user_session");
  if (!sessionCookie) redirect("/");

  const locale = cookieStore.get("NEXT_LOCALE")?.value || "fr";
  const dict = await getDictionary(locale);

  const user = JSON.parse(decodeURIComponent(sessionCookie.value));

  // 2. Appeler TON API Backend pour récupérer sa bibliothèque complète
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/users/${user.user_id}/library`, {
    cache: "no-store",
  });

  const library: UserBook[] = res.ok ? await res.json() : [];

  // 3. Filtrer uniquement les favoris côté serveur 
  const favourites = library.filter((book) => book.is_favourite === true);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "TO_READ":
        return dict.favourites.status_to_read;
      case "READING":
        return dict.favourites.status_reading;
      case "READ":
        return dict.favourites.status_read;
      case "ABANDONED":
        return dict.favourites.status_abandoned;
      default:
        return status;
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 0" }}>
        <h1 style={{ color: "#111", marginBottom: "0.5rem" }}>{dict.favourites.title}</h1>
        <p style={{ color: "#666", marginBottom: "2rem" }}>
          {favourites.length === 0
            ? dict.favourites.empty
            : dict.favourites.count.replace("{count}", String(favourites.length))}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
          {favourites.map((book) => (
            <div
              key={book.book_id}
              style={{
                border: "1px solid #fca5a5",
                borderRadius: "12px",
                padding: "1.5rem",
                backgroundColor: "#fff",
                color: "#111",
                boxShadow: "0 4px 6px rgba(239,68,68,0.08)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>❤️</div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>{book.title}</h3>
              <p style={{ color: "#555", margin: "0 0 0.25rem", fontWeight: "bold", fontSize: "0.9rem" }}>{book.auteur}</p>
              <span style={{
                display: "inline-block", marginTop: "0.5rem",
                padding: "0.25rem 0.75rem", borderRadius: "999px",
                backgroundColor: "#fef2f2", color: "#dc2626",
                fontSize: "0.8rem", fontWeight: "bold"
              }}>
                {getStatusLabel(book.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
