import type { SlackPayload } from './slack.mts';

/**
 * Scheduled and workflow_run runs have no one watching the log, so a missing
 * webhook there must fail the run instead of silently becoming a dry run.
 *
 * @param webhookUrl - The incoming webhook, if any.
 */
export function requireWebhookInCi(webhookUrl: string | undefined): void {
  const event = process.env.GITHUB_EVENT_NAME;
  if (!webhookUrl && (event === 'workflow_run' || event === 'schedule')) {
    throw new Error(
      'SLACK_WEBHOOK_MAIN_DETECTOR is not set; pings would be lost',
    );
  }
}

/**
 * Posts a message to a Slack incoming webhook, or prints it when no webhook
 * is configured so the same command doubles as a dry run.
 *
 * @param payload - The message.
 * @param webhookUrl - The incoming webhook, if any.
 */
export async function postOrPrint(
  payload: SlackPayload,
  webhookUrl: string | undefined,
): Promise<void> {
  requireWebhookInCi(webhookUrl);
  if (!webhookUrl) {
    console.log('SLACK_WEBHOOK_MAIN_DETECTOR is not set; dry run:');
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
