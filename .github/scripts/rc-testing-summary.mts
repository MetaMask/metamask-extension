/**
 * RC Testing Summary — Slack Notification
 *
 * Posts a Block Kit message summarising RC testing progress for a given
 * release candidate. Triggered manually (workflow_dispatch) or on a Friday
 * schedule via `.github/workflows/rc-testing-summary.yml`.
 *
 * Phase 1 (no Mixpanel credentials): posts a formatted link to the manually-
 * created Mixpanel board for the RC, with a testing checklist.
 *
 * Phase 2 (MIXPANEL_PROJECT_SECRET set): additionally queries the Mixpanel
 * Insights API to pull live event counts for all configured metrics, including
 * zero-fire events that Mixpanel's UI hides, and renders them as a Block Kit
 * table so testers can see coverage gaps without opening Mixpanel.
 *
 * Local / dry-run testing (no Slack API call):
 *   DRY_RUN=1 SEMVER=13.30.0 MIXPANEL_URL='https://mixpanel.com/…' \
 *   ./node_modules/.bin/tsx ./.github/scripts/rc-testing-summary.mts
 *
 * Full test post to a channel:
 *   SEMVER=13.30.0 MIXPANEL_URL='https://mixpanel.com/…' \
 *   SLACK_BOT_TOKEN='xoxb-…' SLACK_CHANNEL='#mm-qa-legends' \
 *   ./node_modules/.bin/tsx ./.github/scripts/rc-testing-summary.mts
 */

type SlackBlock = Record<string, unknown>;

type SlackPayload = {
  blocks: SlackBlock[];
  text: string;
};

type MixpanelSeriesResult = {
  series: string[];
  values: Record<string, Record<string, number>>;
};

type MixpanelQueryResponse = {
  status: string;
  results: MixpanelSeriesResult;
  error?: string;
};

type EventCount = {
  eventName: string;
  count: number;
};

// ---------------------------------------------------------------------------
// Mixpanel helpers
// ---------------------------------------------------------------------------

const MIXPANEL_BASE_URL = 'https://mixpanel.com';

/**
 * Queries the Mixpanel Insights (segmentation) API for a single event over
 * the past N days, filtered by the RC version property.
 *
 * @see https://developer.mixpanel.com/reference/segmentation-query
 */
async function queryMixpanelEvent(opts: {
  projectId: string;
  projectSecret: string;
  eventName: string;
  rcProperty: string;
  rcValue: string;
  fromDate: string;
  toDate: string;
}): Promise<number> {
  const {
    projectId,
    projectSecret,
    eventName,
    rcProperty,
    rcValue,
    fromDate,
    toDate,
  } = opts;

  const params = new URLSearchParams({
    project_id: projectId,
    event: `["${eventName}"]`,
    type: 'general',
    unit: 'day',
    interval: '1',
    from_date: fromDate,
    to_date: toDate,
    where: `properties["${rcProperty}"] == "${rcValue}"`,
  });

  const url = `${MIXPANEL_BASE_URL}/api/2.0/segmentation?${params}`;
  const credentials = Buffer.from(`${projectId}:${projectSecret}`).toString(
    'base64',
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Mixpanel API error ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as MixpanelQueryResponse;

  if (data.status !== 'ok') {
    throw new Error(`Mixpanel query failed: ${data.error ?? 'unknown error'}`);
  }

  // Sum all daily counts across the date range
  const dailyCounts = data.results?.values?.[eventName] ?? {};
  return Object.values(dailyCounts).reduce(
    (sum: number, v: number) => sum + v,
    0,
  );
}

/**
 * Fetches event counts for all configured events from Mixpanel.
 * Events missing from the response (0 fires) are explicitly set to 0.
 * Returns results sorted: zero-count events first, then by count descending.
 */
async function fetchMixpanelCounts(opts: {
  projectId: string;
  projectSecret: string;
  reportId: string;
  rcProperty: string;
  rcValue: string;
  eventNames: string[];
  fromDate: string;
  toDate: string;
}): Promise<EventCount[]> {
  const {
    projectId,
    projectSecret,
    rcProperty,
    rcValue,
    eventNames,
    fromDate,
    toDate,
  } = opts;

  const results = await Promise.allSettled(
    eventNames.map(async (eventName) => {
      const count = await queryMixpanelEvent({
        projectId,
        projectSecret,
        eventName,
        rcProperty,
        rcValue,
        fromDate,
        toDate,
      });
      return { eventName, count } as EventCount;
    }),
  );

  const counts: EventCount[] = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.warn(
      `⚠️ Failed to fetch count for ${eventNames[i]}: ${(result.reason as Error).message}`,
    );
    return { eventName: eventNames[i] as string, count: 0 };
  });

  // Zero-fire events first (most actionable), then sort by count descending
  return counts.sort((a, b) => {
    if (a.count === 0 && b.count > 0) {
      return -1;
    }
    if (a.count > 0 && b.count === 0) {
      return 1;
    }
    return b.count - a.count;
  });
}

// ---------------------------------------------------------------------------
// Slack message builders
// ---------------------------------------------------------------------------

/**
 * Builds the Phase 1 Block Kit message: link to the Mixpanel board + a
 * testing checklist reminder. No Mixpanel API call required.
 */
function buildLinkOnlyMessage(opts: {
  semver: string;
  mixpanelUrl: string;
  actionsRunUrl: string | undefined;
}): SlackPayload {
  const { semver, mixpanelUrl, actionsRunUrl } = opts;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🧪 RC Testing Summary — v${semver}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `It's RC testing day for *v${semver}*! Please test your assigned flows and make sure coverage is complete before end of day.`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📊 Live Mixpanel testing board:*\n<${mixpanelUrl}|View dashboard>\n_Tip: change the "App Version" filter to \`${semver}-release-candidate\` if it's not already set._`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*📋 Make sure these flows are covered before EOD:*',
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: '• Send (ETH / ERC-20 / NFT)' },
        { type: 'mrkdwn', text: '• Swap' },
        { type: 'mrkdwn', text: '• Bridge' },
        { type: 'mrkdwn', text: '• Transaction confirmation / sign' },
        { type: 'mrkdwn', text: '• Dapp connect / permissions' },
        { type: 'mrkdwn', text: '• Settings changes' },
        { type: 'mrkdwn', text: '• Onboarding / account creation' },
        { type: 'mrkdwn', text: '• Network switching' },
      ],
    },
  ];

  const footerParts = [
    actionsRunUrl ? `<${actionsRunUrl}|GitHub Actions run>` : null,
    '_Live event counts will appear here once Mixpanel credentials are configured._',
  ].filter(Boolean);

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: footerParts.join('\n'),
        },
      ],
    },
  );

  return {
    blocks,
    text: `RC Testing Summary — v${semver}. Testing board: ${mixpanelUrl}`,
  };
}

/**
 * Builds the Phase 2 Block Kit message: includes live event counts from
 * Mixpanel, with zero-fire events highlighted as gaps.
 */
function buildLiveCountsMessage(opts: {
  semver: string;
  mixpanelUrl: string;
  counts: EventCount[];
  rcValue: string;
  actionsRunUrl: string | undefined;
}): SlackPayload {
  const { semver, mixpanelUrl, counts, rcValue, actionsRunUrl } = opts;

  const zeroes = counts.filter((e) => e.count === 0);
  const tested = counts.filter((e) => e.count > 0);
  const total = counts.length;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🧪 RC Testing Summary — v${semver}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*RC version:*\n${semver}`,
        },
        {
          type: 'mrkdwn',
          text: `*Filter:*\n\`$app_version_string = ${rcValue}\``,
        },
      ],
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Coverage:*\n${tested.length} / ${total} events fired`,
        },
        {
          type: 'mrkdwn',
          text: `*📊 Dashboard:*\n<${mixpanelUrl}|View in Mixpanel>`,
        },
      ],
    },
    { type: 'divider' },
  ];

  if (zeroes.length > 0) {
    const zeroLines = zeroes
      .map((e) => `• \`${e.eventName}\``)
      .join('\n');
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚠️ Not yet tested (${zeroes.length} of ${total}):*\n${zeroLines}`,
      },
    });
    blocks.push({ type: 'divider' });
  }

  if (tested.length > 0) {
    const maxCount = Math.max(...tested.map((e) => e.count));
    const testedLines = tested
      .map((e) => {
        const bar = maxCount > 0
          ? '▓'.repeat(Math.round((e.count / maxCount) * 5))
          : '';
        const label = e.count.toLocaleString().padStart(6, ' ');
        return `\`${label}\` ${bar}  \`${e.eventName}\``;
      })
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*✅ Tested (${tested.length} of ${total}):*\n${testedLines}`,
      },
    });
    blocks.push({ type: 'divider' });
  }

  const footerParts = [
    actionsRunUrl ? `<${actionsRunUrl}|GitHub Actions run>` : null,
  ].filter(Boolean);

  if (footerParts.length > 0) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: footerParts.join(' | '),
        },
      ],
    });
  }

  return {
    blocks,
    text: `RC Testing Summary — v${semver}: ${tested.length}/${total} flows tested${zeroes.length > 0 ? `, ${zeroes.length} not yet covered` : ''}.`,
  };
}

// ---------------------------------------------------------------------------
// Slack posting
// ---------------------------------------------------------------------------

async function postToSlack(
  botToken: string,
  channel: string,
  payload: SlackPayload,
): Promise<void> {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel,
      blocks: payload.blocks,
      text: payload.text,
    }),
  });

  const data = (await response.json()) as { ok: boolean; error?: string };

  if (!data.ok) {
    if (data.error === 'channel_not_found') {
      console.warn(`⚠️ Channel ${channel} not found — bot may not be invited`);
      return;
    }
    throw new Error(`Slack API error: ${data.error}`);
  }

  console.log(`✅ Posted to ${channel}`);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0] as string;
}

/** Returns [fromDate, toDate] covering the past N days up to today (UTC). */
function dateRange(days: number): [string, string] {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days);
  return [isoDate(from), isoDate(to)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  const semver = process.env.SEMVER?.trim();
  const mixpanelUrl = process.env.MIXPANEL_URL?.trim();
  const botToken = process.env.SLACK_BOT_TOKEN?.trim();

  if (!semver) {
    console.error('❌ SEMVER is required (e.g. 13.30.0)');
    process.exit(1);
  }
  if (!mixpanelUrl) {
    console.error('❌ MIXPANEL_URL is required (paste the board URL)');
    process.exit(1);
  }
  if (!botToken && !dryRun) {
    console.error(
      '❌ SLACK_BOT_TOKEN is required (set DRY_RUN=1 to skip posting)',
    );
    process.exit(1);
  }

  // Channel: explicit override → default for this semver
  const channel =
    process.env.SLACK_CHANNEL?.trim() ||
    `#release-extension-${semver.replace(/\./g, '-')}`;

  const runId = process.env.GITHUB_RUN_ID?.trim();
  const repo =
    process.env.GITHUB_REPOSITORY?.trim() ?? 'MetaMask/metamask-extension';
  const actionsRunUrl =
    runId ? `https://github.com/${repo}/actions/runs/${runId}` : undefined;

  console.log(`\n📣 RC Testing Summary notification for v${semver}`);
  console.log(`📍 Target channel: ${channel}`);

  // Phase 2: check for Mixpanel credentials
  const projectSecret = process.env.MIXPANEL_PROJECT_SECRET?.trim();
  const projectId = process.env.MIXPANEL_PROJECT_ID?.trim();
  const rcProperty =
    process.env.MIXPANEL_RC_PROPERTY?.trim() ?? '$app_version_string';
  const rcValue = `${semver}-release-candidate`;

  // Events to query — read from env (comma-separated) or fall back to empty.
  // When empty, Phase 2 is skipped even if credentials are present.
  const eventNamesRaw = process.env.MIXPANEL_EVENT_NAMES?.trim() ?? '';
  const eventNames = eventNamesRaw
    ? eventNamesRaw.split(',').map((e) => e.trim()).filter(Boolean)
    : [];

  const hasCredentials = Boolean(projectSecret && projectId);
  const hasEvents = eventNames.length > 0;

  let payload: SlackPayload;

  if (hasCredentials && hasEvents) {
    console.log(
      `\n📊 Phase 2: querying Mixpanel for ${eventNames.length} events…`,
    );
    console.log(`   Filter: ${rcProperty} = ${rcValue}`);

    const [fromDate, toDate] = dateRange(7);
    console.log(`   Date range: ${fromDate} → ${toDate}`);

    try {
      const counts = await fetchMixpanelCounts({
        projectId: projectId as string,
        projectSecret: projectSecret as string,
        reportId: process.env.MIXPANEL_REPORT_ID?.trim() ?? '',
        rcProperty,
        rcValue,
        eventNames,
        fromDate,
        toDate,
      });

      const zeroes = counts.filter((e) => e.count === 0);
      console.log(
        `   Found ${counts.length - zeroes.length} tested, ${zeroes.length} not yet tested`,
      );

      payload = buildLiveCountsMessage({
        semver,
        mixpanelUrl,
        counts,
        rcValue,
        actionsRunUrl,
      });
    } catch (err) {
      console.warn(
        `⚠️ Mixpanel query failed, falling back to link-only message: ${(err as Error).message}`,
      );
      payload = buildLinkOnlyMessage({ semver, mixpanelUrl, actionsRunUrl });
    }
  } else {
    if (hasCredentials && !hasEvents) {
      console.log(
        '⚠️ MIXPANEL_PROJECT_SECRET is set but MIXPANEL_EVENT_NAMES is empty — skipping live counts',
      );
    } else {
      console.log(
        'ℹ️  Phase 1: no Mixpanel credentials — posting link-only message',
      );
    }
    payload = buildLinkOnlyMessage({ semver, mixpanelUrl, actionsRunUrl });
  }

  if (dryRun) {
    console.log('\n--- DRY_RUN payload (not sent) ---\n');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('\n📤 Posting to Slack…');
  await postToSlack(botToken as string, channel, payload);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
