export type GenreInfo = {
  id?: string;
  name: string;
  type?: string | null;
};

export type BookGenreFields = {
  genre?: string | null;
  genres?: GenreInfo[];
};

const GENRE_FILTER_ALIASES: Record<string, string> = {
  fantasy: "fantastique",
  histoire: "historique",
  shonen: "shounen",
  shoujo: "shojo",
  comics: "comics us",
  "franco-belge": "franco-belge",
};

export function normalizeGenre(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getGenreLabels(book: BookGenreFields) {
  const labels = book.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
  if (labels.length > 0) return Array.from(new Set(labels));
  return book.genre ? [book.genre] : [];
}

export function bookMatchesGenre(book: BookGenreFields, filter: string) {
  const normalizedFilter = normalizeGenre(filter);
  const expected = GENRE_FILTER_ALIASES[normalizedFilter] ?? normalizedFilter;

  return getGenreLabels(book).some((genre) => normalizeGenre(genre) === expected);
}
