/**
 * Slack RC Build Notification (Extension)
 *
 * Posts a Block Kit message when a release-candidate Main workflow completes, aligned with
 * metamask-mobile/scripts/slack-rc-notification.mjs (bot token + chat.postMessage).
 *
 * Build URLs use `getBuildLinks` from development/metamaskbot-build-announce/artifacts.ts
 * (main Chrome/Firefox for Browserify + Webpack).
 *
 * Local / manual testing
 * ----------------------
 * Dry-run (no Slack API):
 *   DRY_RUN=1 SEMVER=13.26.0 GITHUB_RUN_ID=12345678 \
 *   HOST_URL='https://<cloudfront>/metamask-extension/12345678' \
 *   ./node_modules/.bin/tsx ./.github/scripts/slack-rc-notification.ts
 *
 * Post to a specific channel (first non-empty wins):
 *   SLACK_RC_CHANNEL, SLACK_CHANNEL, or TEST_CHANNEL (Mobile parity)
 *   Example:
 *   SEMVER=… GITHUB_RUN_ID=… SLACK_BOT_TOKEN='xoxb-…' SLACK_CHANNEL='#my-test' HOST_URL=… \
 *   ./node_modules/.bin/tsx ./.github/scripts/slack-rc-notification.ts
 *
 * Requires `yarn install` at repo root for `@metamask/auto-changelog`.
 *
 * @see metamask-mobile/scripts/slack-rc-notification.mjs
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseChangelog } from '@metamask/auto-changelog';
import { getBuildLinks } from '../../development/metamaskbot-build-announce/artifacts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..', '..');

const REPO_URL = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/MetaMask/metamask-extension';

type SlackPayload = {
  blocks: Record<string, unknown>[];
  text: string;
};

type MainBrowserLinks = {
  browserify: { chrome: string; firefox: string };
  webpack: { chrome: string; firefox: string };
};

function escapeSlackMrkdwn(text: string | undefined | null): string {
  if (text === undefined || text === null) {
    return '';
  }
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getExtensionMainBuildLinks(
  hostUrl: string,
  packageVersion: string,
): MainBrowserLinks {
  const full = getBuildLinks({ hostUrl: hostUrl.replace(/\/$/, ''), version: packageVersion });
  return {
    browserify: full.browserify.main,
    webpack: full.webpack.main,
  };
}

function extractChangelogEntries(version: string): Record<string, unknown[]> | null {
  const changelogPath = path.join(REPO_ROOT, 'CHANGELOG.md');

  let changelogContent: string;
  try {
    changelogContent = readFileSync(changelogPath, 'utf8');
  } catch (error) {
    const err = error as Error;
    console.error(`Failed to read CHANGELOG.md: ${err.message}`);
    return null;
  }

  try {
    const changelog = parseChangelog({
      changelogContent,
      repoUrl: REPO_URL,
      shouldExtractPrLinks: true,
    });

    return (changelog.getReleaseChanges(version) as Record<string, unknown[]> | undefined) ?? null;
  } catch (error) {
    const err = error as Error;
    console.error(`Failed to parse CHANGELOG.md: ${err.message}`);
    return null;
  }
}

function formatChangesForSlack(
  changes: Record<string, unknown[]>,
  maxEntries = 15,
): string {
  const formattedEntries: string[] = [];

  const categoryOrder = [
    'Added',
    'Fixed',
    'Changed',
    'Deprecated',
    'Removed',
    'Uncategorized',
  ];

  for (const category of categoryOrder) {
    const entries = (changes[category] || []) as {
      description: string;
      prNumbers?: number[];
    }[];
    for (const entry of entries) {
      if (formattedEntries.length >= maxEntries) {
        break;
      }

      let description = escapeSlackMrkdwn(entry.description);

      if (entry.prNumbers && entry.prNumbers.length > 0) {
        const prLinks = entry.prNumbers
          .map((prNum) => `<${REPO_URL}/pull/${prNum}|#${prNum}>`)
          .join(', ');
        description = `${description} (${prLinks})`;
      }

      formattedEntries.push(`• ${description}`);
    }
  }

  const allEntriesCount = Object.values(changes)
    .flat()
    .filter(Boolean).length;
  const remaining = allEntriesCount - formattedEntries.length;

  if (remaining > 0) {
    formattedEntries.push(`\n_...and ${remaining} more changes_`);
  }

  return formattedEntries.join('\n');
}

function isValidUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'n/a' || trimmed === 'null' || trimmed === 'undefined') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function readPackageVersion(): string | null {
  try {
    const pkgPath = path.join(REPO_ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
    return pkg.version;
  } catch (e) {
    const err = e as Error;
    console.warn(`Could not read package.json version: ${err.message}`);
    return null;
  }
}

function buildSlackMessage(options: {
  semver: string;
  packageVersion: string;
  runId: string;
  links: MainBrowserLinks;
  changelogText: string;
  hasChangelog: boolean;
  actionsRunUrl: string | undefined;
}): SlackPayload {
  const { semver, packageVersion, runId, links, changelogText, hasChangelog, actionsRunUrl } =
    options;

  const buildIdLabel = runId ? `run ${runId}` : 'unknown run';

  const b = links.browserify;
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
        text: '*📦 Main build zips (Browserify)*',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: isValidUrl(b.chrome)
            ? `*Chrome (MV3):*\n<${b.chrome}|Download zip>`
            : '*Chrome (MV3):*\n_Not available_',
        },
        {
          type: 'mrkdwn',
          text: isValidUrl(b.firefox)
            ? `*Firefox (MV2):*\n<${b.firefox}|Download zip>`
            : '*Firefox (MV2):*\n_Not available_',
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

  if (hasChangelog && changelogText) {
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 What's in this RC:*\n${changelogText}`,
        },
      },
    );
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No changelog entries found for this version in CHANGELOG.md (section may not exist yet)._',
      },
    });
  }

  const footerBits = [
    actionsRunUrl ? `<${actionsRunUrl}|GitHub Actions run>` : null,
    `<${REPO_URL}/blob/release/${semver}/CHANGELOG.md|CHANGELOG.md on release/${semver}>`,
  ].filter(Boolean);

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

async function main(): Promise<void> {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  const semver = process.env.SEMVER;
  const runId = process.env.GITHUB_RUN_ID;

  if (!semver) {
    console.warn('⚠️ SEMVER is required');
    return;
  }
  if (!runId) {
    console.warn('⚠️ GITHUB_RUN_ID is required');
    return;
  }

  const requiredForPost = ['SLACK_BOT_TOKEN'];
  const missingVars = requiredForPost.filter((v) => !process.env[v]);

  if (missingVars.length > 0 && !dryRun) {
    console.warn(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
    console.warn('Skipping Slack notification (non-critical)');
    return;
  }

  if (dryRun && missingVars.length > 0) {
    console.warn(`⚠️ DRY_RUN: missing ${missingVars.join(', ')} — printing payload only`);
  }

  const botToken = process.env.SLACK_BOT_TOKEN;
  const hostUrl = process.env.HOST_URL?.trim();
  const channelOverride = getChannelOverride();

  const packageVersion = readPackageVersion() ?? semver;

  const links: MainBrowserLinks = hostUrl
    ? getExtensionMainBuildLinks(hostUrl, packageVersion)
    : {
        browserify: { chrome: '', firefox: '' },
        webpack: { chrome: '', firefox: '' },
      };

  if (!hostUrl) {
    console.warn(
      '⚠️ HOST_URL not set — download links will show as unavailable (in CI this is AWS_CLOUDFRONT_URL/repo/GITHUB_RUN_ID)',
    );
  }

  const expectedChannelName = channelOverride ?? getSlackChannel(semver);
  const isOverride = Boolean(channelOverride);

  console.log(`\n📣 Preparing Slack notification for Extension RC v${semver} (run ${runId})`);
  if (isOverride) {
    console.log(
      `🧪 Channel override (SLACK_RC_CHANNEL / SLACK_CHANNEL / TEST_CHANNEL): ${expectedChannelName}`,
    );
  } else {
    console.log(`📍 Target channel: ${expectedChannelName}`);
  }

  console.log('\n📖 Reading CHANGELOG.md...');
  const changes = extractChangelogEntries(semver);

  let changelogText = '';
  let hasChangelog = false;

  if (changes) {
    const totalChanges = Object.values(changes)
      .flat()
      .filter(Boolean).length;
    console.log(`   Found ${totalChanges} changelog entries for v${semver}`);

    if (totalChanges > 0) {
      hasChangelog = true;
      changelogText = formatChangesForSlack(changes);
    }
  } else {
    console.log('   ⚠️ Could not read changelog for this version');
  }

  const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'MetaMask/metamask-extension').split(
    '/',
  );
  const actionsRunUrl =
    runId && owner && repo
      ? `https://github.com/${owner}/${repo}/actions/runs/${runId}`
      : undefined;

  const payload = buildSlackMessage({
    semver,
    packageVersion,
    runId,
    links,
    changelogText,
    hasChangelog,
    actionsRunUrl,
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

main().catch((error) => {
  console.error('⚠️ Unexpected error (non-critical):', error);
});
