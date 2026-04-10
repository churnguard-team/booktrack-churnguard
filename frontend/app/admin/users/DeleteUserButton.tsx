"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
};

export default function DeleteUserButton({ userId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm("Supprimer cet utilisateur ?");
    if (!ok) return;

    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/users/${userId}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Suppression echouee");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || isDeleting || !userId}
      style={{
        marginTop: "0.75rem",
        padding: "0.45rem 0.7rem",
        border: "1px solid #d33",
        borderRadius: "6px",
        backgroundColor: isPending || isDeleting || !userId ? "#f7d6d6" : "#ffecec",
        color: "#8a1111",
        cursor: isPending || isDeleting || !userId ? "not-allowed" : "pointer",
      }}
      title={!userId ? "ID utilisateur manquant" : "Supprimer cet utilisateur"}
    >
      {!userId ? "ID manquant" : isDeleting ? "Suppression..." : "Supprimer"}
    </button>
  );
}

