// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pega o nosso "crachá" (cookie) de autorização
  const adminToken = request.cookies.get('admin_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Se tentar acessar o /admin sem o crachá, manda pro /login
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (adminToken !== 'claudiney_autorizado') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Se já estiver logado e tentar acessar o /login, manda pro painel
  if (isLoginPage && adminToken === 'claudiney_autorizado') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// Dizemos ao Next.js para só rodar esse middleware nessas rotas específicas
export const config = {
  matcher: ['/admin/:path*', '/login'],
};