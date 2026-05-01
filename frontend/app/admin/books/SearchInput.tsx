"use client"; // Indispensable pour écouter le clavier de l'utilisateur

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Cette fonction s'active à CHAQUE lettre tapée
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    // Si on change la recherche, on revient à la page 1.
    params.delete("page");
    // "replace" modifie l'URL sans rechargement lourd
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <input
      type="text"
      placeholder="Rechercher un livre..."
      defaultValue={searchParams.get("q")?.toString() || ""}
      onChange={(e) => handleSearch(e.target.value)}
      className="w-full max-w-sm px-4 py-2 text-sm text-gray-700 bg-gray-100
                 rounded-full border border-transparent
                 focus:outline-none focus:bg-white focus:border-gray-300
                 transition-all duration-200 placeholder:text-gray-400"
    />
  );
}
