import {cookies} from "next/headers"
import {redirect} from "next/navigation"
import DashboardList from "./Components/DashboardList"
import DashboardNavBar from "./Components/DashboardNavbar";



async function DashboardPage(){
    const cookie = await cookies();
    const sessionCookie = cookie.get("user_session");
    if(!sessionCookie) redirect("/");
    const user=JSON.parse(decodeURIComponent(sessionCookie.value));


    const apiUrl = process.env.API_URL || "http://localhost:8000";

    const res= await fetch(`${apiUrl}/users/${user.user_id}/library`,{cache:"no-store"})


    let booksLibrary= []

    if(res.ok){
        booksLibrary= await res.json();
    }


    

return (
    <main className="min-h-screen bg-gray-50">
        <DashboardNavBar  />
        <div className="max-w-7xl mx-auto px-6 py-8">
            <section className="mb-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
                    {user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        Bonjour, {user.prenom} 👋
                    </h1>
                    <p className="text-gray-500 mt-1 text-lg">Votre tableau de bord de lecture</p>
                </div>
            </section>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                    {[
                        { label: "Total",        value: booksLibrary.length },
                        { label: "En cours",     value: booksLibrary.filter((book:any)=>book.status==="READING").length },
                        { label: "Lus",          value: booksLibrary.filter((book:any)=>book.status==="READ").length },
                        { label: "Favoris",      value: booksLibrary.filter((book:any)=>book.is_favourite).length },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </div>

            <div className="border-t border-gray-200 mb-8" />

            <DashboardList booksLibrary={booksLibrary} user={user} />
        </div>
    </main>
)


}



export default DashboardPage