import Link from "next/link";
import AddBookForm from "../AddBookForm";
import Navbar from "@/app/components/Navbar";

export default function AddBookPage() {
  return (
	<main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
	  <Navbar />
	  <h1>Nouveau livre</h1>
	  <Link
		href="/admin/books"
		style={{
		  display: "inline-block",
		  margin: "0.5rem 0 1rem",
		  padding: "0.5rem 0.85rem",
		  border: "1px solid #334155",
		  borderRadius: "8px",
		  backgroundColor: "#f8fafc",
		  textDecoration: "none",
		  color: "#0f172a",
		  fontWeight: 500,
		}}
	  >
		Retour a la liste
	  </Link>
	  <AddBookForm />
	</main>
  );
}

