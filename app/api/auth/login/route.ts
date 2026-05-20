import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createSessionToken,
  checkLoginRateLimit,
  resetLoginRateLimit,
  SESSION_COOKIE,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  // ── 1. IP para rate limiting ──────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0';

  const rate = checkLoginRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Muitas tentativas. Aguarde ${rate.retryAfterSec} segundos.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSec),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let username: string, password: string;
  try {
    const body = await request.json();
    username = String(body.username ?? '').trim();
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
  }

  // ── 3. Verificar credenciais ──────────────────────────────────────────────
  const storedUser = process.env.ADMIN_USERNAME ?? '';
  const storedHash = process.env.ADMIN_PASSWORD_HASH ?? '';
  const storedSalt = process.env.ADMIN_PASSWORD_SALT ?? '';

  // Timing-safe: verifica usuário e senha mesmo quando usuário está errado
  // para evitar user enumeration via timing
  const userMatch     = storedUser.length > 0 &&
    username.length === storedUser.length &&
    username === storedUser;

  const passwordOk = storedHash.length > 0
    ? await verifyPassword(password, storedHash, storedSalt)
    : false;

  if (!userMatch || !passwordOk) {
    return NextResponse.json(
      { error: 'Usuário ou senha incorretos.' },
      { status: 401 },
    );
  }

  // ── 4. Sucesso: zera rate limit e cria sessão ─────────────────────────────
  resetLoginRateLimit(ip);
  const token = await createSessionToken();

  const isProduction = process.env.NODE_ENV === 'production';

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,   // HTTPS only em produção
    sameSite: 'strict',     // Bloqueia CSRF cross-site
    maxAge: 24 * 60 * 60,   // 24 h em segundos
    path: '/',
  });

  return res;
}
