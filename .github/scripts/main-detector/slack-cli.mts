/**
 * Usage: node .github/scripts/main-detector/slack-cli.mts --result result.json [--run-url URL]
 * Posts a Slack message when the detector result has a ping or a slower
 * critical user flow. With no
 * SLACK_BOT_TOKEN set it prints the payload instead, so the same
 * command doubles as a dry run; SLACK_CHANNEL names the channel to post to.
 * Needs `gh` for the commit author.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { REPOSITORY } from './build-source.mts';
import { postOrPrint, requireSlackInCi } from './post-slack.mts';
import { buildSlackMessage } from './slack.mts';

function authorOf(sha: string): string {
  try {
    const login = execFileSync(
      'gh',
      [
        'api',
        `repos/${REPOSITORY}/commits/${sha}`,
        '--jq',
        '.author.login // .commit.author.name',
      ],
      { encoding: 'utf8' },
    ).trim();
    return login || 'unknown author';
  } catch {
    return 'unknown author';
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      result: { type: 'string' },
      'run-url': { type: 'string', default: '' },
    },
  });
  if (!values.result) {
    throw new Error('--result is required');
  }
  requireSlackInCi();

  const result = JSON.parse(fs.readFileSync(values.result, 'utf8'));
  // A slower critical user flow posts even when startup did not change.
  if (result.decision.ping === 'none' && !result.cufs?.findings.length) {
    console.log(`No ping (${result.label}); nothing to post.`);
    return;
  }

  const payload = buildSlackMessage({
    plan: result.plan,
    first: result.first,
    second: result.second,
    decision: result.decision,
    repository: REPOSITORY,
    runUrl: values['run-url'],
    author: authorOf(result.plan.headSha),
    cufs: result.cufs,
  });

  await postOrPrint(payload);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
