"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RatingStars({
  bookId,
  userId,
  currentRating,
}: {
  bookId: string;
  userId: string;
  currentRating: number | null;
}) {
  const [rating, setRating] = useState(currentRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleClick = async (value: number) => {
    const newRating = rating === value ? null : value;
    setSaving(true);
    setRating(newRating);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/users/${userId}/library/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating }),
      });
      if (res.ok) router.refresh();
      else setRating(currentRating);
    } catch {
      setRating(currentRating);
    } finally {
      setSaving(false);
    }
  };

  const display = hovered ?? rating ?? 0;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">Ma note</span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={saving}
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="text-2xl leading-none transition-transform hover:scale-110 disabled:opacity-50"
          >
            {star <= display ? "*" : "."}
          </button>
        ))}
        {rating && (
          <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
        )}
      </div>
    </div>
  );
}
