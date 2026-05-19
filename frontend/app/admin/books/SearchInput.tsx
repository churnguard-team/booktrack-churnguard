"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

type ScrapedBook = {
  title: string;
  auteur: string | null;
  cover_url: string | null;
  source: string;
  link: string | null;
};

export default function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue] = useState(
    searchParams.get("q")?.toString() || ""
  );
  const [suggestions, setSuggestions] = useState<ScrapedBook[]>([]);
  const [isLoadingScraping, setIsLoadingScraping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchScrapedSuggestions = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoadingScraping(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiUrl}/scraper/search?q=${encodeURIComponent(term)}&limit=6`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        setSuggestions([]);
        return;
      }

      const data: ScrapedBook[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingScraping(false);
    }
  }, []);

  const handleInputChange = (term: string) => {
    setInputValue(term);

    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
      setSuggestions([]);
      setShowDropdown(false);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchScrapedSuggestions(term), 400);
  };

  const handleSuggestionClick = (suggestion: ScrapedBook) => {
    if (suggestion.link) {
      window.open(suggestion.link, "_blank", "noopener,noreferrer");
    } else {
      setInputValue(suggestion.title);
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", suggestion.title);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }

    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Rechercher (base + web)..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          className="w-full max-w-sm px-4 py-2 text-sm text-gray-700 bg-gray-100
                     rounded-full border border-transparent
                     focus:outline-none focus:bg-white focus:border-gray-300
                     transition-all duration-200 placeholder:text-gray-400"
        />

        {isLoadingScraping && (
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.75rem",
              display: "inline-block",
              lineHeight: 1,
            }}
          >
            ...
          </span>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
            zIndex: 9999,
            overflow: "hidden",
            maxHeight: "380px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, idx) => (
            <button
              key={`${s.title}-${idx}`}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.6rem 0.8rem",
                display: "flex",
                gap: "0.75rem",
                borderBottom: "1px solid #f3f4f6",
                background: "white",
              }}
            >
              {s.cover_url ? (
                <img
                  src={s.cover_url}
                  alt={s.title}
                  style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 6 }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 56,
                    borderRadius: 6,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    fontSize: "0.75rem",
                  }}
                >
                  N/A
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{s.title}</span>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{s.auteur ?? "Auteur inconnu"}</span>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{s.source}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
