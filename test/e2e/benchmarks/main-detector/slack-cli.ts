/**
 * Usage: yarn tsx test/e2e/benchmarks/main-detector/slack-cli.ts --result result.json [--run-url URL]
 * Posts a Slack message when the detector result has a ping. With no
 * SLACK_WEBHOOK_MAIN_DETECTOR set it prints the payload instead, so the same
 * command doubles as a dry run. Needs `gh` for the commit author.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import { IncomingWebhook } from '@slack/webhook';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { buildSlackMessage } from './slack';

const REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';

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
  const argv = await yargs(hideBin(process.argv))
    .option('result', { type: 'string', demandOption: true })
    .option('run-url', { type: 'string', default: '' })
    .parseAsync();

  const result = JSON.parse(fs.readFileSync(argv.result, 'utf8'));
  if (result.decision.ping === 'none') {
    console.log(`No ping (${result.label}); nothing to post.`);
    return;
  }

  const payload = buildSlackMessage({
    plan: result.plan,
    first: result.first,
    second: result.second,
    decision: result.decision,
    repository: REPOSITORY,
    runUrl: argv.runUrl,
    author: authorOf(result.plan.headSha),
  });

  const webhookUrl = process.env.SLACK_WEBHOOK_MAIN_DETECTOR;
  if (!webhookUrl) {
    console.log('SLACK_WEBHOOK_MAIN_DETECTOR is not set; dry run:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  await new IncomingWebhook(webhookUrl).send(payload);
  console.log('Posted to Slack.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
