import fs from 'fs';
import path from 'path';
import { postCommentWithMetamaskBot } from './utils/benchmark-utils';

async function start(): Promise<void> {
  const { PR_COMMENT_TOKEN, OWNER, REPOSITORY, PR_NUMBER } =
    process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn('No pull request detected; skipping fixture announce');
    return;
  }

  const fixturePath = path.resolve(
    process.cwd(),
    'test-artifacts',
    'onboarding-fixture',
    'onboarding-fixture.json',
  );

  if (!fs.existsSync(fixturePath)) {
    console.warn(`Fixture file not found at '${fixturePath}'; skipping`);
    return;
  }

  const json = fs.readFileSync(fixturePath, 'utf8');

  const exposedContent = 'Fixture Ready';
  const hiddenContent = `<details><summary>${exposedContent}</summary><pre>${escapeHtml(
    json,
  )}</pre></details>`;

  await postCommentWithMetamaskBot({
    commentBody: hiddenContent,
    owner: OWNER,
    repository: REPOSITORY,
    prNumber: PR_NUMBER,
    commentToken: PR_COMMENT_TOKEN,
    optionalLog: 'Posted Fixture Ready comment',
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
