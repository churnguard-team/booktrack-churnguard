import BooksPage from "./books/page";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; type?: string; author?: string; year?: string; filter?: string; page?: string; show_all?: string }>
}) {
  return <BooksPage searchParams={searchParams} basePath="/" />;
}
