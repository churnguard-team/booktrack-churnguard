import Link from "next/link";
import AddBookForm from "../AddBookForm";
import Navbar from "@/app/components/Navbar";

export default function AddBookPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/admin/books"
          className="mb-6 inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Retour a la liste
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nouveau livre</h1>
          <p className="mt-1 text-sm text-gray-500">Ajoutez un titre au catalogue BookTrack.</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <AddBookForm />
        </div>
      </div>
    </main>
  );
}

