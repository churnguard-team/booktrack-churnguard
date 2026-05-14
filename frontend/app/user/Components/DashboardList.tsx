'use client'
import {useState} from 'react'
import Link from "next/link"

export default function Dashboardlist(props:any){
    const {booksLibrary,user}= props;
    const[activeTab,setActiveTab]=useState("reading");



    const reading = booksLibrary.filter((book:any)=>book.status==="READING");
    const toRead = booksLibrary.filter((book:any)=>book.status==="TO_READ");
    const read = booksLibrary.filter((book:any)=>book.status==="READ");
    const abondoned = booksLibrary.filter((book:any)=>book.status==="ABANDONED");
    const favourite = booksLibrary.filter((book:any)=>book.is_favourite);



    const genreCount= booksLibrary.reduce((acc:any,book:any)=>{
        if(!book.genre) return acc;
        acc[book.genre]= (acc[book.genre] || 0)+1;
        return acc

    },{})

    const genreCountArray= Object.entries(genreCount).sort((a:any,b:any)=>b[1]-a[1]);

    let activeArray= activeTab==="reading"? reading:
    activeTab==="read"? read:
    activeTab==="dropped"? abondoned:
    activeTab==="toread"? toRead:
    activeTab==="favourite"? favourite:
    [];


return (
    <div className="max-w-7xl mx-auto px-6 py-8">


        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
            {[
                { key: "reading",   label: "📖 En cours",   count: reading.length },
                { key: "toread",    label: "📚 À lire",     count: toRead.length },
                { key: "read",      label: "✅ Lus",         count: read.length },
                { key: "dropped",   label: "⏸️ Abandonnés", count: abondoned.length },
                { key: "favourite", label: "❤️ Favoris",    count: favourite.length },
            ].map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.key
                            ? "border-gray-900 text-gray-900"
                            : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                >
                    {tab.label} ({tab.count})
                </button>
            ))}
        </div>

        {/* Book grid */}
        {activeArray.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-lg font-medium">Aucun livre ici</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeArray.map((book: any) => (
                    <div
                        key={book.book_id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    >
                        <Link href={`/user/books/${book.book_id}`}>
                            {book.cover_url ? (
                                <img src={book.cover_url} alt={book.title} className="w-full h-52 object-cover" />
                            ) : (
                                <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                    <span className="text-5xl">📖</span>
                                </div>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{book.title}</h3>
                                <p className="text-sm font-medium text-gray-500 mb-2">{book.auteur}</p>
                                {book.genre && (
                                    <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full w-fit">
                                        {book.genre}
                                    </span>
                                )}
                            </div>
                        </Link>
                        
                    </div>
                ))}
            </div>
        )}
    </div>
)


}