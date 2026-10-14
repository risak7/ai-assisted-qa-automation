import { expect, test } from '@playwright/test';

/**
 * Manual catalog cleanup. Excluded from normal test runs.
 *
 * Purges nothing unless DELETE_PROGRAMS is set for this command.
 * PowerShell:
 *   $env:DELETE_PROGRAMS="100"; npm.cmd run test:purge
 *   $env:DELETE_PROGRAMS="300"; npm.cmd run test:purge
 *   $env:DELETE_PROGRAMS="1000"; npm.cmd run test:purge
 *   $env:DELETE_PROGRAMS="all"; npm.cmd run test:purge
 *
 * "100" purges the first 100 ids from GET /api/programs. "all" purges every id in that response.
 * Each removal is DELETE /api/programs/<uuid>?purge=true.
 */

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

type DeleteLimit = number | 'all';

function deleteLimit(): DeleteLimit | undefined {
  const raw = process.env.DELETE_PROGRAMS?.trim();
  if (!raw) return undefined;
  if (raw.toLowerCase() === 'all') return 'all';
  if (!/^\d+$/.test(raw)) {
    throw new Error('DELETE_PROGRAMS must be a positive integer (100, 300, 1000, ...) or "all"');
  }
  const count = Number(raw);
  if (count < 1) {
    throw new Error('DELETE_PROGRAMS must be a positive integer or "all"');
  }
  return count;
}

function tokenStillValid(token: string): boolean {
  const segment = token.split('.')[1];
  if (!segment) return false;
  try {
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString()) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000) + 30;
  } catch {
    return false;
  }
}

async function accessToken(forceLogin = false): Promise<string> {
  const existing = process.env.DIDAXIS_API_TOKEN;
  if (!forceLogin && existing && tokenStillValid(existing)) return existing;

  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD so an expired API token can be replaced');
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => undefined);
  const token = body?.data?.access_token ?? body?.access_token;
  if (!response.ok || typeof token !== 'string') {
    throw new Error(`Login failed while preparing program delete (HTTP ${response.status})`);
  }
  return token;
}

function programIdsFrom(body: unknown): string[] {
  const rows = Array.isArray(body) ? body : (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) {
    throw new Error('GET /api/programs did not return a data array');
  }

  const programIds: string[] = [];
  for (const row of rows) {
    const id = row && typeof row === 'object' ? (row as { id?: unknown }).id : undefined;
    if (typeof id === 'string' && id.length > 0) programIds.push(id);
  }
  return programIds;
}

async function fetchProgramIds(token: string): Promise<string[]> {
  const response = await fetch(`${baseUrl}/api/programs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (response.status === 401) {
    throw Object.assign(new Error('unauthorized'), { status: 401 });
  }
  if (!response.ok) {
    throw new Error(`GET /api/programs failed (HTTP ${response.status})`);
  }
  return programIdsFrom(await response.json());
}

async function deleteProgram(id: string, token: string): Promise<number> {
  const response = await fetch(`${baseUrl}/api/programs/${id}?purge=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return response.status;
}

test('list program ids and delete the requested slice', async () => {
  test.setTimeout(60 * 60 * 1000);
  const limit = deleteLimit();

  let token = await accessToken();
  let programIds: string[];
  try {
    programIds = await fetchProgramIds(token);
  } catch (error) {
    if ((error as { status?: number }).status !== 401) throw error;
    token = await accessToken(true);
    programIds = await fetchProgramIds(token);
  }

  console.log(`GET /api/programs returned ${programIds.length} ids`);
  test.skip(
    limit === undefined,
    'Set DELETE_PROGRAMS to 100, 300, 1000, or all. This run only listed ids and purged nothing.',
  );

  const idsToDelete = limit === 'all' ? programIds.slice() : programIds.slice(0, limit);
  console.log(`Purging ${idsToDelete.length} of ${programIds.length} programs`);

  let deleted = 0;
  for (const id of idsToDelete) {
    let status = await deleteProgram(id, token);
    if (status === 401) {
      token = await accessToken(true);
      status = await deleteProgram(id, token);
    }
    if (status !== 200 && status !== 204 && status !== 404) {
      throw new Error(`Failed to purge program ${id}: HTTP ${status}. Purged ${deleted} before this failure.`);
    }
    deleted += 1;
    if (deleted % 100 === 0 || deleted === idsToDelete.length) {
      console.log(`Purged ${deleted}/${idsToDelete.length}`);
    }
  }

  expect(deleted).toBe(idsToDelete.length);
});
