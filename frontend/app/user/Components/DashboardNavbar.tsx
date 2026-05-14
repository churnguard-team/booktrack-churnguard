'use client'
import { useRouter} from 'next/navigation'
import Link from "next/link"


export default function DashboardNavBar(){
    const router = useRouter();

    function handleLogOut(){
        document.cookie= "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");



    }

    return(
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-900">BookTrack</Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogOut}>LogOut</button>
                    </div>
                </div>
            </div>
        </div>
    )


}