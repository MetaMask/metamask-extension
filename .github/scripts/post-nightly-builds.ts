import { IncomingWebhook } from '@slack/webhook';
import type { AnyBlock } from '@slack/types';

async function main() {
  const env = {
    OWNER: process.env.OWNER || 'metamask',
    REPOSITORY: process.env.REPOSITORY || 'metamask-extension',
    BRANCH: process.env.BRANCH || 'main',
    DOWNLOAD_URL_CHROME: process.env.DOWNLOAD_URL_CHROME || '',
    DOWNLOAD_URL_FIREFOX: process.env.DOWNLOAD_URL_FIREFOX || '',
    DOWNLOAD_URL_EXPERIMENTAL_CHROME: process.env.DOWNLOAD_URL_EXPERIMENTAL_CHROME || '',
    DOWNLOAD_URL_EXPERIMENTAL_FIREFOX: process.env.DOWNLOAD_URL_EXPERIMENTAL_FIREFOX || '',
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID || '',
    VERSION: process.env.VERSION || '',
  };

  if (!env.SLACK_WEBHOOK_URL) {
    console.log('No Slack webhook URL provided, skipping Slack notification');
    return;
  }

  if (!env.DOWNLOAD_URL_CHROME && !env.DOWNLOAD_URL_FIREFOX && !env.DOWNLOAD_URL_EXPERIMENTAL_CHROME && !env.DOWNLOAD_URL_EXPERIMENTAL_FIREFOX) {
    console.log('No download URLs provided, skipping Slack notification');
    return;
  }

  const webhook = new IncomingWebhook(env.SLACK_WEBHOOK_URL);

  const repositoryUrl = new URL('https://github.com');
  repositoryUrl.pathname = `/${env.OWNER}/${env.REPOSITORY}`;

  const branchUrl = new URL(repositoryUrl);
  branchUrl.pathname += `/tree/${env.BRANCH}`;

  const runUrl = new URL(repositoryUrl);
  runUrl.pathname += `/actions/runs/${env.GITHUB_RUN_ID}`;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  console.log(`🚀 Posting nightly build links for ${env.REPOSITORY} ${env.BRANCH} to Slack`);

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
              text: ` (v${env.VERSION})`,
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
  ];

  // Add download links section
  const downloadElements = [
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
  ];

  if (env.DOWNLOAD_URL_CHROME) {
    downloadElements.push(
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
        url: env.DOWNLOAD_URL_CHROME,
        text: 'Main Chrome Extension',
      },
      {
        type: 'text' as const,
        text: '\n',
      },
    );
  }

  if (env.DOWNLOAD_URL_FIREFOX) {
    downloadElements.push(
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
        url: env.DOWNLOAD_URL_FIREFOX,
        text: 'Main Firefox Extension',
      },
      {
        type: 'text' as const,
        text: '\n',
      },
    );
  }

  if (env.DOWNLOAD_URL_EXPERIMENTAL_CHROME) {
    downloadElements.push(
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
        url: env.DOWNLOAD_URL_EXPERIMENTAL_CHROME,
        text: 'Experimental Chrome Extension',
      },
      {
        type: 'text' as const,
        text: '\n',
      },
    );
  }

  if (env.DOWNLOAD_URL_EXPERIMENTAL_FIREFOX) {
    downloadElements.push(
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
        url: env.DOWNLOAD_URL_EXPERIMENTAL_FIREFOX,
        text: 'Experimental Firefox Extension',
      },
      {
        type: 'text' as const,
        text: '\n',
      },
    );
  }

  blocks.push({
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: downloadElements,
      },
    ],
  });

  // Add build info section
  blocks.push(
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
  );

  try {
    await webhook.send({ blocks });
    console.log('✅ Successfully posted nightly build notification to Slack');
  } catch (error) {
    console.error('❌ Failed to post to Slack:', error);
    process.exit(1);
  }
}

main();