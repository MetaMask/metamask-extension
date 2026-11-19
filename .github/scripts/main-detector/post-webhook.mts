import type { SlackPayload } from './slack.mts';

/**
 * Scheduled and workflow_run runs have no one watching the log, so a missing
 * webhook there must fail the run instead of silently becoming a dry run.
 *
 */
export function requireWebhookInCi(): void {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const event = process.env.GITHUB_EVENT_NAME;
  if (!webhookUrl && (event === 'workflow_run' || event === 'schedule')) {
    throw new Error('SLACK_WEBHOOK_URL is not set; pings would be lost');
  }
}

/**
 * Posts a message to a Slack incoming webhook, or prints it when no webhook
 * is configured so the same command doubles as a dry run.
 *
 * @param payload - The message.
 */
export async function postOrPrint(payload: SlackPayload): Promise<void> {
  requireWebhookInCi();
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('SLACK_WEBHOOK_URL is not set; dry run:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook returned ${response.status}`);
  }
  console.log('Posted to Slack.');
}
