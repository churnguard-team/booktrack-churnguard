"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type BookItem } from "./page";

type Props = {
  books: BookItem[];
};

export default function FilterBar({ books }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "");
  const [selectedAuthor, setSelectedAuthor] = useState(searchParams.get("author") || "");
  const [authorSearch, setAuthorSearch] = useState(searchParams.get("author") || "");
  const [publicationYear, setPublicationYear] = useState(searchParams.get("year") || "");
  const [suggestedAuthors, setSuggestedAuthors] = useState<string[]>([]);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    setSelectedType(searchParams.get("type") || "");
    setSelectedGenre(searchParams.get("genre") || "");
    setSelectedAuthor(searchParams.get("author") || "");
    setAuthorSearch(searchParams.get("author") || "");
    setPublicationYear(searchParams.get("year") || "");
  }, [searchParams]);

  const types = useMemo(
    () => Array.from(new Set(books.map((book) => book.type).filter(Boolean))),
    [books]
  );

  const authors = useMemo(
    () => Array.from(new Set(books.map((book) => book.auteur).filter(Boolean))),
    [books]
  );

  useEffect(() => {
    const getGenresForType = (type: string | null) => {
      let filteredBooks = books;
      if (type) {
        filteredBooks = books.filter((book) => book.type === type);
      }
      const allGenres = filteredBooks.flatMap((book) => book.genres || []);
      const uniqueGenres = allGenres.filter((genre, index, self) =>
        index === self.findIndex((g) => g.name === genre.name)
      );
      return uniqueGenres.map((genre) => genre.name);
    };

    setGenres(getGenresForType(selectedType));
    if (!searchParams.get("genre")) setSelectedGenre("");
  }, [selectedType, books, searchParams]);

  useEffect(() => {
    if (authorSearch.trim()) {
      const matches = authors.filter((author): author is string =>
        author !== undefined && author.toLowerCase().includes(authorSearch.toLowerCase())
      );
      setSuggestedAuthors(matches);
    } else {
      setSuggestedAuthors([]);
    }
  }, [authorSearch, authors]);

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);
    if (selectedType) params.set("type", selectedType);
    if (selectedGenre) params.set("genre", selectedGenre);
    if (selectedAuthor) params.set("author", selectedAuthor);
    if (publicationYear) params.set("year", publicationYear);

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <input
        type="text"
        placeholder="Rechercher un livre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      />

      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      >
        <option value="">Tous les types</option>
        {types.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <select
        value={selectedGenre}
        onChange={(e) => setSelectedGenre(e.target.value)}
        disabled={!selectedType}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50"
      >
        <option value="">Tous les genres</option>
        {genres.map((genre) => (
          <option key={genre} value={genre}>{genre}</option>
        ))}
      </select>

      <div className="relative flex-grow min-w-[200px]">
        <input
          type="text"
          placeholder="Auteur..."
          value={authorSearch}
          onChange={(e) => setAuthorSearch(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        />
        {suggestedAuthors.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto">
            {suggestedAuthors.map((author) => (
              <li
                key={author}
                onClick={() => {
                  setSelectedAuthor(author);
                  setAuthorSearch(author);
                  setSuggestedAuthors([]);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {author}
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        type="number"
        placeholder="Annee"
        value={publicationYear}
        onChange={(e) => setPublicationYear(e.target.value)}
        min="1000"
        max={new Date().getFullYear() + 1}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-32"
      />

      <button
        onClick={applyFilters}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
      >
        Filtrer
      </button>
    </div>
  );
}
