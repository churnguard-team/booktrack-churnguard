import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cette fonction s'exécute AVANT le chargement de chaque page protégée
export function middleware(request: NextRequest) {
  // 1. Le videur demande le pass (le cookie)
  const sessionCookie = request.cookies.get('user_session')?.value
  
  // 2. Pas de pass = On le renvoie à l'accueil (page de connexion) !
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Si le visiteur a un pass, on l'inspecte !
  try {
    const user = JSON.parse(decodeURIComponent(sessionCookie));

    // ACCÈS INTERDIT : Si un 'user' essaie d'entrer dans la zone '/admin'
    if (user.role === 'user' && request.nextUrl.pathname.startsWith('/admin')) {
        console.log("Tentative de fraude bloquée !");
        return NextResponse.redirect(new URL('/user/books', request.url))
    }

    // REDIRECTION LOGIQUE : Si un 'admin' essaie d'aller sur le panel user
    if (user.role === 'admin' && request.nextUrl.pathname.startsWith('/user')) {
        return NextResponse.redirect(new URL('/admin/books', request.url))
    }

  } catch (error) {
    // Si le pass est un faux ou s'il est abîmé (erreur de lecture)
    // On le jette dehors pour des raisons de sécurité
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si tout est beau, le videur le laisse passer !
  return NextResponse.next()
}

// 🎯 On donne au videur la liste des portes à surveiller :
// Ce fichier n'agira que si l'utilisateur essaie d'ouvrir les portes /admin ou /user
export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
}
