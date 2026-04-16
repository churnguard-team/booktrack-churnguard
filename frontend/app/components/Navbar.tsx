"use client"; // Indispensable car on utilise un "clic" (intéractivité)

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

    const handleLogout = () => {
    // On écrase le cookie avec une date d'expiration dans le passé (1970) pour le détruire
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    console.log("Déconnexion réussie !");
    router.push("/"); 
  };


  return (
    <nav style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "1rem 2rem", backgroundColor: "#fff", borderBottom: "1px solid #ddd" 
    }}>
      <div style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#2563eb" }}>
          BookTrack
      </div>
      
      {/* ===== LE BOUTON PROFIL ET SON MENU ===== */}
      <div style={{ position: "relative" }}>
        
        {/* Le faux bouton "Avatar" (Tu pourras y mettre une vraie image plus tard !) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "45px", height: "45px", borderRadius: "50%",
            backgroundColor: "#111", color: "#fff", border: "none",
            cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem"
          }}
        >
          U {/* U comme User */}
        </button>

        {/* Le menu déroulant qui s'affiche si isOpen est `true` */}
        {isOpen && (
          <div style={{
            position: "absolute", top: "55px", right: "0",
            backgroundColor: "#fff", border: "1px solid #ddd",
            borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            width: "160px", overflow: "hidden", zIndex: 10
          }}>
            <Link 
              href={pathname.startsWith("/admin") ? "/admin/profil" : "/user/profil"}
              style={{ display: "block", padding: "12px", color: "#333", textDecoration: "none", borderBottom: "1px solid #eee" }}
            >
              Voir Profil
            </Link>
            {/* ❤️ Visible uniquement côté User, pas Admin */}
                {!pathname.startsWith("/admin") && (
                <Link
                    href="/user/favourites"
                    style={{ display: "block", padding: "12px", color: "#e11d48", textDecoration: "none", borderBottom: "1px solid #eee" }}
                >
                    ❤️ Mes Favoris
                </Link>
                )}
            <button 
              onClick={handleLogout}
              style={{ display: "block", width: "100%", padding: "12px", color: "red", backgroundColor: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "bold" }}
            >
              Se déconnecter
            </button>
          </div>
        )}
        
      </div>
    </nav>
  );
}
