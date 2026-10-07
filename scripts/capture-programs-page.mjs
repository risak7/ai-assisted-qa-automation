import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') });

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const email = process.env.DIDAXIS_EMAIL;
const password = process.env.DIDAXIS_PASSWORD;
const outDir = path.resolve(import.meta.dirname, '..', 'test-evidence', 'DS-1');
const outFile = path.join(outDir, 'programs-new-program-blocked.png');

if (!email || !password) {
  console.error('Missing DIDAXIS_EMAIL or DIDAXIS_PASSWORD');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto(`${baseUrl}/login`);
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill(password);
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL((url) => !url.pathname.endsWith('/login'));
await page.goto(`${baseUrl}/programs`, { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: 'Programs', level: 2 }).waitFor({ timeout: 60_000 });
await page.screenshot({ path: outFile, fullPage: false, timeout: 60_000 });
await browser.close();
console.log(outFile);
