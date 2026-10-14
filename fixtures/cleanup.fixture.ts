import { expect, test as base, type Page, type Response } from '@playwright/test';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

const pendingCaptures = new WeakMap<Page, Promise<void>[]>();
const latestToken = new WeakMap<Page, string>();

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

function tokenStillValid(token: string): boolean {
  const segment = token.split('.')[1];
  if (!segment) return false;
  try {
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString()) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000) + 15;
  } catch {
    return false;
  }
}

function bearerFrom(header: string | undefined): string | undefined {
  if (!header || !/^Bearer\s+/i.test(header)) return undefined;
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 ? token : undefined;
}

async function readLoginAccessToken(response: Response): Promise<string | undefined> {
  const path = new URL(response.url()).pathname;
  const isAuth = response.request().method() === 'POST' && /\/api\/auth\/(login|refresh)$/.test(path);
  if (!isAuth || !response.ok()) return undefined;
  const body = await response.json().catch(() => undefined);
  const token = body?.data?.access_token ?? body?.access_token;
  return typeof token === 'string' ? token : undefined;
}

function watchPage(page: Page): void {
  const pending: Promise<void>[] = [];
  pendingCaptures.set(page, pending);
  const remember = (token: string | undefined) => {
    if (token) latestToken.set(page, token);
  };

  page.on('request', (request) => {
    remember(bearerFrom(request.headers()['authorization']));
  });
  page.on('response', (response) => {
    pending.push(readLoginAccessToken(response).then(remember).catch(() => undefined));
  });
}

async function tokenFromNextApiCall(page: Page): Promise<string> {
  const requestPromise = page.waitForRequest((request) => {
    return request.url().includes('/api/') && bearerFrom(request.headers()['authorization']) !== undefined;
  }, { timeout: 30_000 });
  await page.goto(`${baseUrl}/programs`, { waitUntil: 'domcontentloaded' });
  const token = bearerFrom((await requestPromise).headers()['authorization']);
  if (!token || !tokenStillValid(token)) {
    throw new Error('Could not capture a usable access token from the UI after login');
  }
  return token;
}

async function captureTokenAfterLogin(page: Page): Promise<string> {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('DIDAXIS_API_TOKEN is expired. Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD so cleanup can sign in and capture a new token.');
  }

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  if (!new URL(page.url()).pathname.endsWith('/login')) {
    return tokenFromNextApiCall(page);
  }

  const loginResponse = page.waitForResponse((response) => {
    return response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/api/auth/login');
  }, { timeout: 30_000 });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  const response = await loginResponse;
  if (!response.ok()) {
    throw new Error(`Login failed while refreshing the API token (HTTP ${response.status()})`);
  }
  const token = await readLoginAccessToken(response);
  if (!token || !tokenStillValid(token)) {
    throw new Error('Login did not return a usable access token');
  }
  return token;
}

async function tokenForCleanup(page: Page): Promise<string> {
  await Promise.all(pendingCaptures.get(page) ?? []);
  const fromUi = latestToken.get(page);
  if (fromUi && tokenStillValid(fromUi)) return fromUi;
  const fromEnv = process.env.DIDAXIS_API_TOKEN;
  if (fromEnv && tokenStillValid(fromEnv)) return fromEnv;
  const refreshed = await captureTokenAfterLogin(page);
  latestToken.set(page, refreshed);
  return refreshed;
}

async function deleteProgram(uuid: string, token: string): Promise<number> {
  const response = await fetch(`${baseUrl}/api/programs/${uuid}?purge=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return response.status;
}

async function programStillExists(uuid: string, token: string): Promise<boolean> {
  const response = await fetch(`${baseUrl}/api/programs/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return response.status !== 404;
}

export const test = base.extend<CleanupFixtures>({
  page: async ({ page }, use) => {
    watchPage(page);
    await use(page);
  },

  trackProgram: async ({ page }, use) => {
    const ids: string[] = [];
    await use((uuid: string) => {
      if (uuid) ids.push(uuid);
    });
    if (ids.length === 0) return;

    let token = await tokenForCleanup(page);
    for (const uuid of ids) {
      let status = await deleteProgram(uuid, token);
      if (status === 401) {
        token = await captureTokenAfterLogin(page);
        latestToken.set(page, token);
        status = await deleteProgram(uuid, token);
      }
      if (status !== 200 && status !== 204 && status !== 404) {
        throw new Error(`Failed to purge program ${uuid}: HTTP ${status}`);
      }
      if (status !== 404 && (await programStillExists(uuid, token))) {
        throw new Error(`Program ${uuid} still exists after purge`);
      }
      console.log(`[cleanup] purged program ${uuid} (HTTP ${status})`);
    }
  },
});

export { expect };
