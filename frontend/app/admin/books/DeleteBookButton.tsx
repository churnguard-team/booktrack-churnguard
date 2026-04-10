"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookId: string;
};

export default function DeleteBookButton({ bookId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
	const ok = window.confirm("Supprimer ce livre ?");
	if (!ok) return;

	setIsDeleting(true);
	try {
	  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
	  const res = await fetch(`${apiUrl}/books/${bookId}`, { method: "DELETE" });

	  if (!res.ok) {
		throw new Error("Suppression echouee");
	  }

	  startTransition(() => router.refresh());
	} catch (error) {
	  console.error("Failed to delete book:", error);
	} finally {
	  setIsDeleting(false);
	}
  };

  return (
	<button
	  onClick={handleDelete}
	  disabled={isPending || isDeleting || !bookId}
	  style={{
		marginTop: "0.75rem",
		padding: "0.45rem 0.7rem",
		border: "1px solid #d33",
		borderRadius: "6px",
		backgroundColor: isPending || isDeleting || !bookId ? "#f7d6d6" : "#ffecec",
		color: "#8a1111",
		cursor: isPending || isDeleting || !bookId ? "not-allowed" : "pointer",
	  }}
	  title={!bookId ? "ID du livre manquant" : "Supprimer ce livre"}
	>
	  {!bookId ? "ID manquant" : isDeleting ? "Suppression..." : "Supprimer"}
	</button>
  );
}

