// lib/db.ts
// Conexão direta com o Postgres (sem ORM). Uso exclusivo no servidor (rotas /api).
import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';

// Mantém o formato que o front já recebia do Supabase:
// numeric/bigint como número e datas como string ISO.
types.setTypeParser(1700, (v) => parseFloat(v));             // numeric
types.setTypeParser(20, (v) => parseInt(v, 10));             // bigint
types.setTypeParser(1082, (v) => v);                         // date
types.setTypeParser(1114, (v) => v.replace(' ', 'T'));       // timestamp
types.setTypeParser(1184, (v) =>                             // timestamptz
  v.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));

// Certificado autoassinado do Postgres da VPS (público, não é segredo). Fixá-lo
// como CA garante que o site só conversa com esse servidor, mesmo conectando por IP.
// Se o certificado da VPS for trocado, atualize aqui.
const VPS_CA = `-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIUBU2gW1ndV3GMeEfzY1AfpPvy6rMwDQYJKoZIhvcNAQEL
BQAwFzEVMBMGA1UEAwwMc2VydmVyLWthaWtlMB4XDTI2MDkwOTE2NTMxMFoXDTM2
MDkwNjE2NTMxMFowFzEVMBMGA1UEAwwMc2VydmVyLWthaWtlMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAucQer7uWt+0+sliLQ+WJS2LB5hYv7XZ6Hq2P
oq+bwEbwXNqO5SfH/UsFmvkMoq2wwhQlnnrNp3c0ibHMQk/YE0FFeEvMW6BZe6RV
3qKjIIRKKLpRixtKcqtAtwmYFicD05YnciydwLbNQVxWwMtBFtI78Rv++RN7Tq2x
5mRrpxyZw21oJKb/UfzcYXYtont75Cbsun4TbClSv49fM0NAVyDxCXsHjyJN9sXv
JJxf4ePVVWbOCT2mHQtue8avTL/fiSTO5dUSi8JJGpg2qT8Hs4eFctrfSw/7pNhX
hn9DKMLN6gWbcWzIE+imKuC6aeprA7CI+DiNeRwe/a+f+n3NyQIDAQABo0UwQzAJ
BgNVHRMEAjAAMBcGA1UdEQQQMA6CDHNlcnZlci1rYWlrZTAdBgNVHQ4EFgQUI/ke
9UReg24kmAdgq7vgDAFxRUUwDQYJKoZIhvcNAQELBQADggEBAGxGR/YU+HY7b2NR
mQwPbSMTKpt+Q6piw5BP6y8Pu2uoD9W/g7pvcOq40OSwb2WRFPtdI4DmwOPGyPiZ
Y1aVlbBDqZNqY+tlqxt0oBgnmgsAjh7D9xto/6ZMnS3oeTCg/fBm8uisuTXMXgQH
sXjOEgEBTz5qHsQM+0+JUd8Dklx3OGLDhMADMl37a4xlC0Ng/nl3keVGxFiPUIGn
LTs50whv2HMnRY/wOD13TFL72xGlt1hd4TUqZYp8Rkq5oy6xI0kAOIgwvDCMbKgR
2F3cemLWeQGKaWImyhLod+HpKlPpjOuGU+LvWMPYm2pJQc0JaXmDn3Mp17NJ3aCt
0YJOt1Y=
-----END CERTIFICATE-----`;
const VPS_SERVERNAME = 'server-kaike';

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { ca: VPS_CA, servername: VPS_SERVERNAME },
    max: 5,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

export async function query<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await pool.query<T>(sql, params);
  return rows;
}

export async function queryOne<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Executa `fn` numa transação: COMMIT se der certo, ROLLBACK se lançar erro. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Monta um UPDATE só com os campos da whitelist presentes em `body`.
 * Retorna a linha atualizada, ou null se o id não existir.
 */
export async function updateById<T extends QueryResultRow = any>(
  table: string,
  id: string | number,
  body: Record<string, unknown>,
  permitidos: readonly string[],
): Promise<T | null> {
  const campos = permitidos.filter((c) => c in body);
  if (campos.length === 0) return queryOne<T>(`SELECT * FROM ${table} WHERE id = $1`, [id]);

  const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const values = campos.map((c) => body[c]);
  return queryOne<T>(`UPDATE ${table} SET ${sets} WHERE id = $1 RETURNING *`, [id, ...values]);
}

/** INSERT a partir de um objeto { coluna: valor }. Retorna a linha criada. */
export async function insertRow<T extends QueryResultRow = any>(table: string, data: Record<string, unknown>): Promise<T> {
  const cols = Object.keys(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const row = await queryOne<T>(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    cols.map((c) => data[c]),
  );
  return row!;
}
