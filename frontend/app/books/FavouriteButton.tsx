"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


type Props = {
  bookId: string;
  userId: string|null;
  isFavourite: boolean;
};

export default function FavouriteButton({ bookId, userId, isFavourite }: Props) {
  const [favourite, setFavourite] = useState(isFavourite);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleFavourite = async () => {
    setLoading(true);
    try {
      if(userId === null) {router.push("/login");
      return(alert("Veuillez d'abord vous connecter."));
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/users/${userId}/library/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favourite: !favourite }),
      });

      if (res.ok) {
        setFavourite(!favourite); // On bascule le cœur sans rechargement !
        router.refresh();
      }
    } catch {
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavourite}
      disabled={loading}
      title={favourite ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        background: "none",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "1.8rem",
        transition: "transform 0.2s",
        transform: loading ? "scale(0.8)" : "scale(1)",
      }}
    >
      {favourite ? "❤️" : "🤍"}
    </button>
  );
}
