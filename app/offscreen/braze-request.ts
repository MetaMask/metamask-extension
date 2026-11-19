/* eslint-disable @typescript-eslint/naming-convention -- Braze wire field names. */
import { isObject } from '@metamask/utils';

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u;

/**
 * Send only the SDK's session-start data for the currently eligible profile.
 *
 * @param request - Untrusted request from the SDK worker.
 * @param session - First-party configuration and revocation signal.
 * @param session.url - The configured Braze data endpoint.
 * @param session.apiKey - The configured web SDK key.
 * @param session.profile - The currently eligible canonical profile ID.
 * @param session.signal - Aborted when eligibility is revoked.
 * @returns The HTTP status, or zero on failure or rejection.
 */
export async function sendBrazeSession(
  request: unknown,
  session: {
    url: string;
    apiKey: string;
    profile: string;
    signal: AbortSignal;
  },
): Promise<number> {
  if (
    session.signal.aborted ||
    !isObject(request) ||
    request.method !== 'POST' ||
    request.url !== session.url ||
    typeof request.body !== 'string' ||
    request.body.length > 4096
  ) {
    return 0;
  }

  try {
    const data: unknown = JSON.parse(request.body);
    if (!isObject(data)) {
      return 0;
    }
    const { respond_with: respondWith, events, device_id: deviceId } = data;
    if (
      !isObject(respondWith) ||
      respondWith.user_id !== session.profile ||
      !Array.isArray(events) ||
      events.length !== 1 ||
      typeof deviceId !== 'string' ||
      !uuidPattern.test(deviceId)
    ) {
      return 0;
    }
    const [event]: unknown[] = events;
    if (
      !isObject(event) ||
      event.name !== 'ss' ||
      event.user_id !== session.profile ||
      typeof event.session_id !== 'string' ||
      !uuidPattern.test(event.session_id) ||
      typeof event.time !== 'number' ||
      !Number.isFinite(event.time)
    ) {
      return 0;
    }

    const response = await fetch(session.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: session.signal,
      body: JSON.stringify({
        respond_with: { user_id: session.profile },
        events: [
          {
            name: 'ss',
            user_id: session.profile,
            session_id: event.session_id,
            time: event.time,
            data: {},
          },
        ],
        api_key: session.apiKey,
        device_id: deviceId,
        time: Math.floor(Date.now() / 1000),
        sdk_metadata: ['npm'],
        sdk_version: '7.0.0',
      }),
    });
    await response.body?.cancel();
    return response.status;
  } catch {
    return 0;
  }
}
