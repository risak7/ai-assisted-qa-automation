import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') });

const issueKey = process.argv[2];
const files = process.argv.slice(3).filter((f) => f && fs.existsSync(f));

if (!issueKey) {
  console.error('Usage: node scripts/jira-attach-screenshots.mjs ISSUE-KEY file1.png [file2.png ...]');
  process.exit(1);
}

const email = process.env.JIRA_LOGIN_EMAIL ?? process.env.ATLASSIAN_EMAIL;
const token = process.env.JIRA_API_TOKEN ?? process.env.ATLASSIAN_API_TOKEN;
const siteFromUrl = process.env.ATLASSIAN_BASE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const site = process.env.JIRA_SITE ?? siteFromUrl ?? 'legionqaschool.atlassian.net';

if (!email || !token) {
  console.error('Set JIRA_LOGIN_EMAIL + JIRA_API_TOKEN (or ATLASSIAN_EMAIL + ATLASSIAN_API_TOKEN) in .env');
  process.exit(1);
}

if (files.length === 0) {
  console.error('No screenshot files to attach');
  process.exit(1);
}

const auth = Buffer.from(`${email}:${token}`).toString('base64');

for (const filePath of files) {
  const fileName = path.basename(filePath);
  const body = fs.readFileSync(filePath);
  const res = await fetch(`https://${site}/rest/api/3/issue/${issueKey}/attachments`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'X-Atlassian-Token': 'no-check',
    },
    body: (() => {
      const form = new FormData();
      form.append('file', new Blob([body]), fileName);
      return form;
    })(),
  });
  if (!res.ok) {
    console.error(`Failed to attach ${fileName}: HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`Attached ${fileName} to ${issueKey}`);
}
