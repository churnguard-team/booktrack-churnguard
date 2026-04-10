"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserFormState = {
  email: string;
  nom: string;
  prenom: string;
  is_active: boolean;
};

const initialFormState: UserFormState = {
  email: "",
  nom: "",
  prenom: "",
  is_active: true,
};

export default function AddUserForm() {
  const router = useRouter();
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.trim() || !form.nom.trim() || !form.prenom.trim()) {
      setError("Email, nom et prenom sont requis.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          is_active: form.is_active,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Cet email existe deja.");
        }
        throw new Error("Echec de la creation de l'utilisateur");
      }

      setForm(initialFormState);
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginBottom: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
        maxWidth: "520px",
      }}
    >
      <h2>Ajouter un utilisateur</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        style={{ padding: "0.5rem" }}
        required
      />
      <input
        type="text"
        placeholder="Nom"
        value={form.nom}
        onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
        style={{ padding: "0.5rem" }}
        required
      />
      <input
        type="text"
        placeholder="Prenom"
        value={form.prenom}
        onChange={(e) => setForm((prev) => ({ ...prev, prenom: e.target.value }))}
        style={{ padding: "0.5rem" }}
        required
      />
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
        />
        Actif
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: "0.65rem 0.9rem",
          border: "1px solid #0f172a",
          borderRadius: "8px",
          backgroundColor: isSubmitting ? "#94a3b8" : "#0f172a",
          color: "#fff",
          fontWeight: 600,
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Ajout en cours..." : "Ajouter utilisateur"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}


