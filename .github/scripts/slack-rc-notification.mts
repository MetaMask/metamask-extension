/**
 * Slack RC Build Notification (Extension)
 *
 * Posts a Block Kit message when a release-candidate Main workflow completes, aligned with
 * metamask-mobile/scripts/slack-rc-notification.mjs (bot token + chat.postMessage).
 *
 * Mobile parity: downloads + cherry-picks link + View full RC notes. No inline CHANGELOG.md dump.
 *
 * Build URLs include main Chrome/Firefox Webpack artifacts.
 * Slack links to run-specific PR comment anchors for cherry-picks and full RC notes.
 *
 * Local / manual testing
 * ----------------------
 * Dry-run (no Slack API):
 *   DRY_RUN=1 SEMVER=13.26.0 BUILD_RUN_ID=12345678 \
 *   HOST_URL='https://<cloudfront>/metamask-extension/12345678' \
 *   node ./.github/scripts/slack-rc-notification.mts
 *
 * Post to a specific channel (first non-empty wins):
 *   SLACK_RC_CHANNEL, SLACK_CHANNEL, or TEST_CHANNEL (Mobile parity)
 *   Example:
 *   SEMVER=… BUILD_RUN_ID=… SLACK_BOT_TOKEN='xoxb-…' SLACK_CHANNEL='#my-test' HOST_URL=… \
 *   node ./.github/scripts/slack-rc-notification.mts
 *
 * @see metamask-mobile/scripts/slack-rc-notification.mjs
 */

import { pathToFileURL } from 'url';
import packageJson from '../../package.json' with { type: 'json' };
import {
  getBuildLinks,
  type BuildLinks,
} from '../../development/metamaskbot-build-announce/build-links.ts';

const REPO_URL = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/MetaMask/metamask-extension';

type SlackPayload = {
  blocks: Record<string, unknown>[];
  text: string;
};

type MainBrowserLinks = {
  webpack: BuildLinks['webpack']['main'];
};

function getExtensionMainBuildLinks(
  hostUrl: string,
  packageVersion: string,
): MainBrowserLinks {
  const buildLinks = getBuildLinks({
    hostUrl: hostUrl.replace(/\/$/, ''),
    version: packageVersion,
  });
  return {
    webpack: buildLinks.webpack.main,
  };
}

function isValidUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed === '' ||
    trimmed === 'n/a' ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function buildSlackMessage(options: {
  semver: string;
  packageVersion: string;
  runId: string;
  links: MainBrowserLinks;
  actionsRunUrl: string | undefined;
  prNumber?: string;
}): SlackPayload {
  const { semver, packageVersion, runId, links, actionsRunUrl, prNumber } =
    options;

  const buildIdLabel = `run ${runId}`;
  const w = links.webpack;

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🧩 Extension RC Build v${semver} (${buildIdLabel})`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Release branch version:*\n${semver}`,
        },
        {
          type: 'mrkdwn',
          text: `*package.json version:*\n${packageVersion}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*📦 Main build zips (Webpack)*',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: isValidUrl(w.chrome)
            ? `*Chrome (MV3):*\n<${w.chrome}|Download zip>`
            : '*Chrome (MV3):*\n_Not available_',
        },
        {
          type: 'mrkdwn',
          text: isValidUrl(w.firefox)
            ? `*Firefox (MV2):*\n<${w.firefox}|Download zip>`
            : '*Firefox (MV2):*\n_Not available_',
        },
      ],
    },
  ];

  // Match Mobile: link Slack to the run-specific PR comment anchors.
  // GitHub prefixes user-provided anchor IDs with `user-content-`.
  if (prNumber) {
    const cherryPicksLink = `<${REPO_URL}/pull/${prNumber}#user-content-cherry-picks-${runId}|View cherry-picks>`;
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🍒 Cherry-picks:* ${cherryPicksLink}`,
        },
      },
    );
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_Cherry-picks available in the release PR._`,
      },
    });
  }

  const footerBits = [
    actionsRunUrl ? `<${actionsRunUrl}|View Build Pipeline>` : null,
    prNumber
      ? `<${REPO_URL}/pull/${prNumber}#user-content-whats-in-this-rc-${runId}|View full RC notes>`
      : null,
  ].filter(Boolean);

  if (footerBits.length > 0) {
    blocks.push(
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: footerBits.join(' | '),
          },
        ],
      },
    );
  }

  return {
    blocks,
    text: `Extension RC Build v${semver} (${buildIdLabel}) is ready.`,
  };
}

async function postToSlack(
  botToken: string,
  channelName: string,
  payload: SlackPayload,
): Promise<{ success: boolean; channelNotFound: boolean }> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: channelName,
        blocks: payload.blocks,
        text: payload.text,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const data = (await response.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      if (data.error === 'channel_not_found') {
        return { success: false, channelNotFound: true };
      }
      throw new Error(`Slack API error: ${data.error}`);
    }

    console.log('✅ Slack notification sent successfully');
    return { success: true, channelNotFound: false };
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Failed to post to Slack: ${err.message}`);
    return { success: false, channelNotFound: false };
  }
}

function getSlackChannel(version: string): string {
  const formattedVersion = version.replace(/\./g, '-');
  return `#release-extension-${formattedVersion}`;
}

/**
 * Optional destination channel for testing or staging.
 * Priority: SLACK_RC_CHANNEL → SLACK_CHANNEL → TEST_CHANNEL (same as Mobile).
 *
 * @returns Channel name (e.g. `#foo`) or undefined to use default `#release-extension-x-y-z`.
 */
function getChannelOverride(): string | undefined {
  const raw =
    process.env.SLACK_RC_CHANNEL?.trim() ||
    process.env.SLACK_CHANNEL?.trim() ||
    process.env.TEST_CHANNEL?.trim();
  return raw || undefined;
}

export async function main(): Promise<void> {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  const semver = process.env.SEMVER;
  const runId = process.env.BUILD_RUN_ID;
  const prNumber = process.env.PR_NUMBER || '';

  if (!semver) {
    console.warn('⚠️ SEMVER is required');
    return;
  }
  if (!runId) {
    console.warn('⚠️ BUILD_RUN_ID is required');
    return;
  }

  const requiredForPost = ['SLACK_BOT_TOKEN'];
  const missingVars = requiredForPost.filter((v) => !process.env[v]);

  if (missingVars.length > 0 && !dryRun) {
    console.warn(
      `⚠️ Missing required environment variables: ${missingVars.join(', ')}`,
    );
    console.warn('Skipping Slack notification (non-critical)');
    return;
  }

  if (dryRun && missingVars.length > 0) {
    console.warn(
      `⚠️ DRY_RUN: missing ${missingVars.join(', ')} — printing payload only`,
    );
  }

  const botToken = process.env.SLACK_BOT_TOKEN;
  const trimmedHostUrl = process.env.HOST_URL?.trim() ?? '';
  const channelOverride = getChannelOverride();

  const packageVersion = packageJson.version;

  const hostUrlOk = trimmedHostUrl !== '' && isValidUrl(trimmedHostUrl);

  const links: MainBrowserLinks = hostUrlOk
    ? getExtensionMainBuildLinks(trimmedHostUrl, packageVersion)
    : {
        webpack: { chrome: '', firefox: '' },
      };

  if (!hostUrlOk) {
    console.warn(
      trimmedHostUrl === ''
        ? '⚠️ HOST_URL unset — artifact links omitted'
        : `⚠️ Invalid HOST_URL (expect https://…; check AWS_CLOUDFRONT_URL): ${trimmedHostUrl}`,
    );
  }

  const expectedChannelName = channelOverride ?? getSlackChannel(semver);
  const isOverride = Boolean(channelOverride);

  console.log(
    `\n📣 Preparing Slack notification for Extension RC v${semver} (run ${runId})`,
  );
  if (isOverride) {
    console.log(`🧪 Channel override: ${expectedChannelName}`);
  } else {
    console.log(`📍 Target channel: ${expectedChannelName}`);
  }
  if (prNumber) {
    console.log(`📍 Release PR: #${prNumber}`);
  }

  const [owner, repo] = (
    process.env.GITHUB_REPOSITORY || 'MetaMask/metamask-extension'
  ).split('/');
  const actionsRunUrl =
    runId && owner && repo
      ? `https://github.com/${owner}/${repo}/actions/runs/${runId}`
      : undefined;

  const payload = buildSlackMessage({
    semver,
    packageVersion,
    runId,
    links,
    actionsRunUrl,
    prNumber,
  });

  if (dryRun) {
    console.log('\n--- DRY_RUN payload (not sent) ---\n');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('\n📤 Posting to Slack...');

  const result = await postToSlack(botToken!, expectedChannelName, payload);

  if (result.success) {
    console.log(`\n✅ RC notification sent to ${expectedChannelName}`);
  } else if (result.channelNotFound) {
    console.warn(`\n⚠️ Channel ${expectedChannelName} not found`);
    console.warn('Skipping Slack notification (non-critical)');
  } else {
    console.log('\n⚠️ RC notification failed but continuing (non-critical)');
  }
}

function handleUnexpectedError(error: unknown): void {
  console.error('⚠️ Unexpected error (non-critical):', error);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(handleUnexpectedError);
}
