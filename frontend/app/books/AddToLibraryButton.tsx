"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToLibraryButton({ bookId, userId }: { bookId: string, userId: string|null }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // On attaque ta TOUTE NOUVELLE route Backend !
      if(userId===null){router.push("/login"); 
        return(alert("Veuillez d'abord vous connecter."))
      }

      const res = await fetch(`${apiUrl}/users/${userId}/library/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            book_id: bookId, 
            status: "TO_READ", // Par défaut, on le met dans la pile "À lire"
            is_favourite: false 
        })
      });

      if (res.ok) {
        alert(" Livre ajouté à ton étagère personnelle !");
        router.refresh();
      } else {
        const error = await res.json();
        alert(`❌ ${error.detail}`); // Affichera "Ce livre est déjà dans votre étagère" grâce à ton test Python !
      }
    } catch {
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
        onClick={handleAdd} 
        disabled={loading} 
        style={{ 
            marginTop: "1rem", width: "100%", padding: "0.8rem", 
            backgroundColor: "#111", color: "white", border: "none", 
            borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", 
            fontWeight: "bold", transition: "0.2s"
        }}
    >
      {loading ? "Ajout en cours..." : "➕ Ajouter à ma liste"}
    </button>
  );
}
