import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rotas de auth — sempre passam ────────────────────────────────────────
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // ── Webhooks externos (Asaas) — validam com token próprio, não cookie
  if (pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next();
  }

  // ── Determina se é rota admin (UI ou API) ─────────────────────────────────
  const isAdminUI   = pathname.startsWith('/admin');
  const isAdminAPI  = pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/login';

  if (!isAdminUI && !isAdminAPI && !isLoginPage) {
    return NextResponse.next();
  }

  // ── Valida o token de sessão ──────────────────────────────────────────────
  const token   = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const isValid = token ? await validateSessionToken(token) : false;

  // ── Página de login ───────────────────────────────────────────────────────
  if (isLoginPage) {
    if (isValid) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  // ── Rotas de API admin ────────────────────────────────────────────────────
  if (isAdminAPI) {
    if (!isValid) {
      return NextResponse.json(
        { error: 'Não autenticado. Faça login em /login.' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="admin"' } },
      );
    }
    return NextResponse.next();
  }

  // ── Páginas admin (UI) ────────────────────────────────────────────────────
  if (isAdminUI) {
    if (!isValid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/api/admin/:path*',
    '/api/auth/:path*',
    '/api/webhooks/:path*', // passa pelo early-return acima, não exige cookie
  ],
};
