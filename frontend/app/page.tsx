import Link from "next/link";

const CATEGORIES = ["Roman", "Science-Fiction", "Histoire", "Développement personnel", "Poésie", "Essai", "Jeunesse", "Biographie"];

const FEATURED = [
  { title: "L'Ombre du Désert", auteur: "Karim Mansouri", genre: "Roman", prix: "89 MAD", cover: "#1a1a2e" },
  { title: "Algorithmes du Cœur", auteur: "Leila Benali", genre: "Science-Fiction", prix: "110 MAD", cover: "#1a2e1a" },
  { title: "Les Dunes d'Or", auteur: "Youssef Alami", genre: "Historique", prix: "95 MAD", cover: "#2e1a1a" },
  { title: "Mémoires Digitales", auteur: "Sara Tazi", genre: "Essai", prix: "75 MAD", cover: "#2e2a1a" },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", fontFamily: "'Inter', sans-serif", color: "#f5f0e8" }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 3rem", borderBottom: "1px solid #1a1a1a",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,13,13,0.97)", backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
          {/* Logo */}
          <div>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#c9a84c", fontWeight: 700, textTransform: "uppercase" }}>Librairie</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#f5f0e8", letterSpacing: "-0.02em", lineHeight: 1 }}>BookTrack</div>
          </div>
          {/* Nav links */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {["Catalogue", "Nouveautés", "Meilleures ventes", "Auteurs"].map(l => (
              <Link key={l} href="/catalogue" style={{ padding: "0.45rem 0.85rem", color: "#666", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, borderRadius: "6px" }}>
                {l}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link href="/login" style={{ padding: "0.5rem 1rem", color: "#888", textDecoration: "none", fontSize: "0.85rem" }}>
            Connexion
          </Link>
          <Link href="/register" style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", background: "#161616", border: "1px solid #2a2a2a", color: "#f5f0e8", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            S'inscrire
          </Link>
          <Link href="/catalogue" style={{ padding: "0.5rem 1.1rem", borderRadius: "8px", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
            Acheter
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "5rem 3rem 4rem", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-block", padding: "0.3rem 0.85rem", borderRadius: "99px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", fontSize: "0.7rem", fontWeight: 700, color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            Livraison gratuite dès 200 MAD
          </div>
          <h1 style={{ margin: "0 0 1.25rem", fontSize: "3.2rem", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Des milliers de livres,<br />
            <span style={{ color: "#c9a84c" }}>livrés chez vous.</span>
          </h1>
          <p style={{ margin: "0 0 2rem", color: "#555", fontSize: "1rem", lineHeight: 1.75, maxWidth: "440px" }}>
            Découvrez notre catalogue de romans, essais, sciences et bien plus. Commandez en ligne, recevez rapidement.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/catalogue" style={{ padding: "0.85rem 2rem", borderRadius: "10px", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", textDecoration: "none", fontWeight: 800, fontSize: "0.95rem" }}>
              Explorer le catalogue
            </Link>
            <Link href="/register" style={{ padding: "0.85rem 2rem", borderRadius: "10px", background: "#161616", border: "1px solid #2a2a2a", color: "#f5f0e8", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}>
              Créer un compte
            </Link>
          </div>
          {/* Trust badges */}
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem", flexWrap: "wrap" }}>
            {["+ 5 000 titres", "Livraison 48h", "Paiement sécurisé"].map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c9a84c" }} />
                <span style={{ fontSize: "0.78rem", color: "#555", fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Book stack visual */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {FEATURED.map((book, i) => (
            <div key={i} style={{
              background: book.cover, border: "1px solid #1e1e1e", borderRadius: "12px",
              padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between",
              minHeight: "160px", cursor: "pointer",
              transform: i === 1 ? "translateY(-8px)" : i === 2 ? "translateY(8px)" : "none",
            }}>
              <div>
                <div style={{ fontSize: "0.65rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{book.genre}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f5f0e8", lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.3rem" }}>{book.auteur}</div>
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#c9a84c", marginTop: "1rem" }}>{book.prix}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catégories ── */}
      <section style={{ padding: "3rem", borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Parcourir par catégorie
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <Link key={cat} href="/catalogue" style={{
                padding: "0.5rem 1.1rem", borderRadius: "99px",
                background: "#111", border: "1px solid #1e1e1e",
                color: "#888", textDecoration: "none", fontSize: "0.82rem", fontWeight: 500,
              }}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meilleures ventes ── */}
      <section style={{ padding: "4rem 3rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Sélection</div>
            <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Meilleures ventes</h2>
          </div>
          <Link href="/catalogue" style={{ fontSize: "0.82rem", color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>
            Voir tout →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {[...FEATURED, ...FEATURED.slice(0, 2)].map((book, i) => (
            <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", overflow: "hidden", cursor: "pointer" }}>
              {/* Cover placeholder */}
              <div style={{ height: "200px", background: book.cover, display: "flex", alignItems: "flex-end", padding: "1rem" }}>
                <span style={{ fontSize: "0.65rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(0,0,0,0.6)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                  {book.genre}
                </span>
              </div>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f5f0e8", marginBottom: "0.25rem", lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.75rem" }}>{book.auteur}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "#c9a84c" }}>{book.prix}</span>
                  <button style={{ padding: "0.4rem 0.85rem", borderRadius: "6px", border: "none", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                    Acheter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bannière auteur ── */}
      <section style={{ margin: "0 3rem 4rem", padding: "3rem", background: "#111", border: "1px solid #1a1a1a", borderRadius: "16px", display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#c9a84c", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Vous êtes auteur ?</div>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Publiez et vendez vos livres sur BookTrack
          </h2>
          <p style={{ margin: 0, color: "#555", fontSize: "0.875rem", lineHeight: 1.7, maxWidth: "500px" }}>
            Rejoignez notre réseau d'auteurs, soumettez vos manuscrits et atteignez des milliers de lecteurs à travers le Maroc.
          </p>
        </div>
        <Link href="/register" style={{ padding: "0.85rem 1.75rem", borderRadius: "10px", background: "linear-gradient(135deg, #c9a84c, #a07830)", color: "#111", textDecoration: "none", fontWeight: 800, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
          Devenir auteur
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "2.5rem 3rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#c9a84c", fontWeight: 700, textTransform: "uppercase" }}>Librairie</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f5f0e8", marginBottom: "0.75rem" }}>BookTrack</div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#444", lineHeight: 1.7 }}>
              La librairie en ligne de référence au Maroc. Des milliers de titres, livrés rapidement.
            </p>
          </div>
          {[
            { title: "Boutique", links: ["Catalogue", "Nouveautés", "Meilleures ventes", "Promotions"] },
            { title: "Compte", links: ["Se connecter", "S'inscrire", "Mes commandes", "Ma bibliothèque"] },
            { title: "Info", links: ["À propos", "Livraison", "Retours", "Contact"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {links.map(l => (
                  <Link key={l} href="/catalogue" style={{ fontSize: "0.8rem", color: "#444", textDecoration: "none" }}>{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#333" }}>© 2026 BookTrack — Tous droits réservés</span>
          <Link href="/login" style={{ fontSize: "0.72rem", color: "#333", textDecoration: "none" }}>Espace administration</Link>
        </div>
      </footer>
    </div>
  );
}
