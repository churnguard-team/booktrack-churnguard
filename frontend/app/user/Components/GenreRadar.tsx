"use client";
import { useState } from "react";

type Book = {
  type?: string;
  genre?: string;
  genres?: { name: string }[];
  status?: string;
  is_favourite?: boolean;
};

type Filter = "all" | "READ" | "TO_READ" | "favourites";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "READ", label: "Lus" },
  { key: "TO_READ", label: "A lire" },
  { key: "favourites", label: "Favoris" },
];

type Props = { books: Book[] };

const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Fantastique et Aventure", keywords: ["fantastique", "aventure", "isekai", "shounen", "fantasy"] },
  { label: "Policier et Thriller", keywords: ["policier", "thriller", "mystere", "mystery"] },
  { label: "Science-Fiction", keywords: ["science-fiction", "sf", "dystopie", "dystopia"] },
  { label: "Romance", keywords: ["romance", "shojo", "romantique"] },
  { label: "Horreur et Mystere", keywords: ["horreur", "dark", "suspense"] },
  { label: "Classique et Litterature", keywords: ["classique", "litterature", "literature"] },
  { label: "Philosophie et Pensee", keywords: ["philosophie", "philosophy", "essai", "pensee"] },
  { label: "Sciences et Savoir", keywords: ["sciences", "savoir", "biographie", "biography"] },
  { label: "Histoire", keywords: ["historique", "histoire", "history"] },
  { label: "Developpement Personnel", keywords: ["developpement personnel", "self-help"] },
  { label: "Humour et Legerete", keywords: ["humour", "comedie", "franco-belge", "legerete"] },
  { label: "Action et Combat", keywords: ["action", "seinen", "combat", "guerre"] },
];

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function scoreBook(book: Book): Record<string, number> {
  const scores: Record<string, number> = {};
  const tags = [
    book.type,
    book.genre,
    ...(book.genres?.map((g) => g.name) ?? []),
  ].filter(Boolean).map((t) => normalize(t!));

  for (const cat of CATEGORIES) {
    for (const tag of tags) {
      if (cat.keywords.some((kw) => tag === kw)) {
        scores[cat.label] = (scores[cat.label] || 0) + 1;
        break;
      }
    }
  }
  return scores;
}

function getTop8(books: Book[]) {
  const totals: Record<string, number> = {};
  for (const book of books) {
    const s = scoreBook(book);
    for (const [k, v] of Object.entries(s)) totals[k] = (totals[k] || 0) + v;
  }
  return CATEGORIES
    .map((c) => ({ ...c, count: totals[c.label] || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default function GenreRadar({ books }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all"       ? books
                 : filter === "favourites" ? books.filter((b) => b.is_favourite)
                 : books.filter((b) => b.status === filter);

  const top = getTop8(filtered);

  const n = top.length;
  const max = Math.max(...top.map((c) => c.count));
  const cx = 170, cy = 170, r = 110;
  const levels = 4;

  const points = (ratio: number) =>
    top.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const d = ratio * r;
      return [cx + d * Math.cos(angle), cy + d * Math.sin(angle)] as [number, number];
    });

  const toSvgPoly = (pts: [number, number][]) =>
    pts.map(([x, y]) => `${x},${y}`).join(" ");

  const dataPoints = points(1).map(([x, y], i) => {
    const ratio = top[i].count / max;
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const d = ratio * r;
    return [cx + d * Math.cos(angle), cy + d * Math.sin(angle)] as [number, number];
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Votre profil de lecteur</h2>
          <p className="text-xs text-gray-400">{filtered.length} livre{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {top.length < 3 ? (
        <p className="text-sm text-gray-400 text-center py-10">Pas assez de donnees pour cette selection.</p>
      ) : (
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <svg viewBox="0 0 340 340" className="w-80 h-80 shrink-0">
          {Array.from({ length: levels }, (_, i) => (
            <polygon
              key={i}
              points={toSvgPoly(points((i + 1) / levels))}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {top.map((_, i) => {
            const [x, y] = points(1)[i];
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
          })}

          <polygon
            points={toSvgPoly(dataPoints)}
            fill="rgba(37,99,235,0.15)"
            stroke="#2563eb"
            strokeWidth="2"
          />

          {dataPoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#2563eb" />
          ))}

          {top.map((cat, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const labelR = r + 32;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            const anchor = lx < cx - 5 ? "end" : lx > cx + 5 ? "start" : "middle";
            return (
              <g key={i}>
                <text x={lx} y={ly - 6} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fill="#374151" fontWeight="600">
                  {cat.label.split(" ")[0]}
                </text>
                <text x={lx} y={ly + 8} textAnchor={anchor} dominantBaseline="middle" fontSize="10" fill="#9ca3af">
                  {cat.count} livre{cat.count > 1 ? "s" : ""}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex-1 w-full h-80 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
          <p className="text-sm text-gray-300 font-medium">A venir...</p>
        </div>
      </div>
      )}
    </div>
  );
}
