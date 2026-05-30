"use client";
import { useEffect } from "react";

export default function BookViewTracker({ bookId, userId }: { bookId: string; userId: string | null }) {
  useEffect(() => {
    if (!userId || !bookId) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API}/api/recommendations/track-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    }).catch(() => {});
  }, [bookId, userId]);

  return null;
}
