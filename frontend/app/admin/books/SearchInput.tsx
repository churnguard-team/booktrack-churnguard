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
    // "replace" modifie l'URL de manière invisible sans rechargement lourd !
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <input
      type="text"
      placeholder="Entrez un titre pour filtrer instantanément..."
      defaultValue={searchParams.get("q")?.toString() || ""}
      onChange={(e) => handleSearch(e.target.value)}
      // J'ai repris tes jolis styles d'avant
      style={{ 
        padding: "0.8rem", width: "400px", borderRadius: "6px",
        marginTop: "0.75rem",
        marginBottom: "1.5rem",
        border: "1px solid #ccc", fontSize: "1rem" 
      }}
    />
  );
}
