import type { SlackPayload } from './slack.mts';

const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

/**
 * Scheduled and workflow_run runs have no one watching the log, so a missing
 * bot token or channel there must fail the run instead of silently becoming a
 * dry run.
 */
export function requireSlackInCi(): void {
  const event = process.env.GITHUB_EVENT_NAME;
  if (event !== 'workflow_run' && event !== 'schedule') {
    return;
  }
  if (!process.env.SLACK_BOT_TOKEN) {
    throw new Error('SLACK_BOT_TOKEN is not set; pings would be lost');
  }
  if (!process.env.SLACK_CHANNEL?.trim()) {
    throw new Error('SLACK_CHANNEL is not set; pings would be lost');
  }
}

/**
 * Posts a message with the Slack bot token (chat.postMessage, as the RC
 * notification does), or prints it when no token is configured so the same
 * command doubles as a dry run.
 *
 * @param payload - The message.
 */
export async function postOrPrint(payload: SlackPayload): Promise<void> {
  requireSlackInCi();
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    console.log('SLACK_BOT_TOKEN is not set; dry run:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const channel = process.env.SLACK_CHANNEL?.trim();
  if (!channel) {
    throw new Error('SLACK_CHANNEL is required to post');
  }
  const response = await fetch(SLACK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel,
      blocks: payload.blocks,
      text: payload.text,
      // Slack API field names.
      /* eslint-disable @typescript-eslint/naming-convention */
      unfurl_links: false,
      unfurl_media: false,
      /* eslint-enable @typescript-eslint/naming-convention */
    }),
  });
  if (!response.ok) {
    throw new Error(`Slack API returned ${response.status}`);
  }
  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    // Slack answers 200 with ok: false; a bot must be in the channel to post.
    throw new Error(`Slack API error: ${data.error} (channel ${channel})`);
  }
  console.log(`Posted to Slack channel ${channel}.`);
}
