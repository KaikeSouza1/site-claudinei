/**
 * Autenticação admin — utilidades criptográficas
 *
 * Usa exclusivamente a Web Crypto API (global `crypto`), que está disponível
 * tanto no Edge Runtime (middleware) quanto no Node.js Runtime (API routes).
 * Não depende de nenhum pacote externo.
 */

export const SESSION_COOKIE = 'adm_sess';
const EXPIRES_MS = 24 * 60 * 60 * 1000; // 24 h

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// base64url sem padding
function encodeB64(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeB64(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const mod4 = padded.length % 4;
  return atob(mod4 ? padded + '===='.slice(mod4) : padded);
}

// ─── Session token (HMAC-SHA256 assinado) ─────────────────────────────────────

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  if (!secret) throw new Error('ADMIN_SESSION_SECRET não configurado');

  const expires = Date.now() + EXPIRES_MS;
  const nonce   = bytesToHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const payload = `${expires}.${nonce}`;

  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));

  return encodeB64(`${payload}:${bytesToHex(sig)}`);
}

export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET ?? '';
    if (!secret || !token) return false;

    const decoded  = decodeB64(token);
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return false;

    const payload = decoded.slice(0, lastColon);
    const sigHex  = decoded.slice(lastColon + 1);

    const key  = await getHmacKey(secret);
    const sig  = hexToBytes(sigHex);
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(payload));
    if (!valid) return false;

    const expires = parseInt(payload.split('.')[0], 10);
    return Number.isFinite(expires) && Date.now() < expires;
  } catch {
    return false;
  }
}

// ─── Senha (PBKDF2-SHA512, 100 000 iterações) ─────────────────────────────────

export async function hashPassword(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-512' },
    keyMaterial,
    512, // 64 bytes
  );
  return bytesToHex(bits);
}

export async function verifyPassword(input: string, storedHash: string, salt: string): Promise<boolean> {
  const inputHash = await hashPassword(input, salt);
  return timingSafeEqual(inputHash, storedHash);
}

// ─── Rate limiter (in-memory, login only) ────────────────────────────────────

type RateEntry = { count: number; resetAt: number };
const _rateMap = new Map<string, RateEntry>();

const RATE_MAX     = 5;
const RATE_WINDOW  = 15 * 60 * 1000; // 15 min

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now   = Date.now();
  const entry = _rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    _rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true };
  }

  if (entry.count >= RATE_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

export function resetLoginRateLimit(ip: string): void {
  _rateMap.delete(ip);
}
