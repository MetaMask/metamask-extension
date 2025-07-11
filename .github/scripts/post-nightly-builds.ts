import { IncomingWebhook } from '@slack/webhook';
import type { AnyBlock } from '@slack/types';
import { version } from '../../package.json';

async function main() {
  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    RUN_ID: process.env.RUN_ID || '',
    BRANCH: process.env.BRANCH || 'main',
    HOST_URL: process.env.HOST_URL || '',
    SLACK_NIGHTLY_BUILDS_WEBHOOK_URL:
      process.env.SLACK_NIGHTLY_BUILDS_WEBHOOK_URL || '',
  };

  if (!env.RUN_ID) throw new Error('RUN_ID not found');
  if (!env.HOST_URL) throw new Error('HOST_URL not found');
  if (!env.SLACK_NIGHTLY_BUILDS_WEBHOOK_URL)
    throw new Error('SLACK_NIGHTLY_BUILDS_WEBHOOK_URL not found');

  console.log(
    `🚀 Posting nightly builds for the ${env.REPOSITORY} repository ${env.BRANCH} branch to Slack`,
  );

  const buildMap = {
    builds: {
      chrome: `${env.HOST_URL}/build-dist-browserify/builds/metamask-chrome-${version}.zip`,
      firefox: `${env.HOST_URL}/build-dist-mv2-browserify/builds/metamask-firefox-${version}.zip`,
    },
    'builds (experimental)': {
      chrome: `${env.HOST_URL}/build-experimental-browserify/builds/metamask-experimental-chrome-${version}.zip`,
      firefox: `${env.HOST_URL}/build-experimental-mv2-browserify/builds/metamask-experimental-firefox-${version}.zip`,
    },
  };

  const webhook = new IncomingWebhook(env.SLACK_NIGHTLY_BUILDS_WEBHOOK_URL);

  const repositoryUrl = new URL('https://github.com');
  repositoryUrl.pathname = `/${env.OWNER}/${env.REPOSITORY}`;

  const branchUrl = new URL(repositoryUrl);
  branchUrl.pathname += `/tree/${env.BRANCH}`;

  const runUrl = new URL(repositoryUrl);
  runUrl.pathname += `/actions/runs/${env.RUN_ID}`;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const blocks: AnyBlock[] = [
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji',
              name: 'rocket',
            },
            {
              type: 'text',
              text: ' Nightly Build Available - ',
            },
            {
              type: 'link',
              url: repositoryUrl.toString(),
              text: env.REPOSITORY,
            },
            {
              type: 'text',
              text: ' ',
            },
            {
              type: 'link',
              url: branchUrl.toString(),
              text: env.BRANCH,
            },
            {
              type: 'text',
              text: ` (v${version})`,
            },
          ],
        },
      ],
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: `Built on ${currentDate}`,
              style: {
                italic: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji' as const,
              name: 'package',
            },
            {
              type: 'text' as const,
              text: ' Download Links:\n',
              style: {
                bold: true,
              },
            },
            {
              type: 'emoji' as const,
              name: 'chrome',
            },
            {
              type: 'text' as const,
              text: ' ',
            },
            {
              type: 'link' as const,
              url: buildMap.builds.chrome,
              text: 'Main Chrome Extension',
            },
            {
              type: 'text' as const,
              text: '\n',
            },
            {
              type: 'emoji' as const,
              name: 'firefox',
            },
            {
              type: 'text' as const,
              text: ' ',
            },
            {
              type: 'link' as const,
              url: buildMap.builds.firefox,
              text: 'Main Firefox Extension',
            },
            {
              type: 'text' as const,
              text: '\n',
            },
            {
              type: 'emoji' as const,
              name: 'test_tube',
            },
            {
              type: 'text' as const,
              text: ' ',
            },
            {
              type: 'link' as const,
              url: buildMap['builds (experimental)'].chrome,
              text: 'Experimental Chrome Extension',
            },
            {
              type: 'text' as const,
              text: '\n',
            },
            {
              type: 'emoji' as const,
              name: 'test_tube',
            },
            {
              type: 'text' as const,
              text: ' ',
            },
            {
              type: 'link' as const,
              url: buildMap['builds (experimental)'].firefox,
              text: 'Experimental Firefox Extension',
            },
            {
              type: 'text' as const,
              text: '\n',
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'emoji',
              name: 'information_source',
            },
            {
              type: 'text',
              text: ' Build Info: ',
              style: {
                bold: true,
              },
            },
            {
              type: 'link',
              url: runUrl.toString(),
              text: 'View Build Logs',
            },
          ],
        },
      ],
    },
  ];

  await webhook.send({ blocks });
  console.log(
    '✅ Successfully posted the nightly builds notification to Slack',
  );
}

main();
