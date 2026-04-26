import Navbar from "@/app/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilPage() {
  // 1. On ouvre la "boîte à cookies" du serveur (Next 15)
  const cookieStore = await cookies(); 
  const sessionCookie = cookieStore.get("user_session");

  // 2. Si le cookie n'existe pas, on le renvoie à l'accueil pour se connecter ! (Sécurité)
  if (!sessionCookie) {
    redirect("/");
  }

  // 3. On décode le JSON stocké dans le cookie
  const user = JSON.parse(decodeURIComponent(sessionCookie.value));

  return (
    <main style={{ padding: "0", fontFamily: "sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />
      
      <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "2.5rem", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1.5rem" }}>
            <div style={{ width: "80px", height: "80px", backgroundColor: "#111", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold" }}>
                {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
                <h1 style={{ color: "#111", margin: "0" }}>Mon Profil</h1>
                <p style={{ color: "#666", margin: "0.2rem 0 0 0" }}>Gérez vos informations personnelles</p>
            </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", color: "#111" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center" }}>
            <strong style={{ color: "#555" }}>Email :</strong>
            <p style={{ margin: "0", fontSize: "1.1rem" }}>{user.email}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center" }}>
            <strong style={{ color: "#555" }}>Rôle :</strong>
            <p style={{ margin: "0", fontSize: "1.1rem" }}>
                <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "4px", fontSize: "0.9rem", fontWeight: "bold" }}>
                   {user.role.toUpperCase()}
                </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
