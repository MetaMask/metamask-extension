import type { SlackPayload } from './slack.mts';

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
