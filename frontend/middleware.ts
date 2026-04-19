import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cette fonction s'exécute AVANT le chargement de chaque page protégée
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // 1. Le videur demande le pass (le cookie)
  const sessionCookie = request.cookies.get('user_session')?.value
  
  // 2. Pas de pass = On renvoie directement à la page de connexion !
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Si le visiteur a un pass, on l'inspecte !
  try {
    const user = JSON.parse(decodeURIComponent(sessionCookie));

    // ONBOARDING : si l'utilisateur a DÉJÀ fait le quiz et tente d'y retourner
    // → on le redirige directement vers son espace
    if (pathname === '/onboarding' && user.has_onboarded) {
      return NextResponse.redirect(new URL('/user/books', request.url));
    }

    // Si un ADMIN va sur '/user/*' → redirige vers /admin/books
    if (user.role === 'admin' && pathname.startsWith('/user')) {
        return NextResponse.redirect(new URL('/admin/books', request.url))
    }

    // ACCÈS INTERDIT : Si un 'user' essaie d'entrer dans la zone '/admin'
    if (user.role === 'user' && pathname.startsWith('/admin')) {
        console.log("Tentative de fraude bloquée !");
        return NextResponse.redirect(new URL('/user/books', request.url))
    }

  } catch (error) {
    // Si le pass est un faux ou s'il est abîmé (erreur de lecture)
    // On le jette dehors pour des raisons de sécurité
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si tout est beau, le videur le laisse passer !
  return NextResponse.next()
}

// 🎯 Pages protégées — '/' est public (accessible sans connexion)
export const config = {
  matcher: ['/admin/:path*', '/user/:path*', '/onboarding'],
}
