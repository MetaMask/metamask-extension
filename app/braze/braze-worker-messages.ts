import type { SyncBrazeUser } from '../../shared/lib/braze';

export type BrazeWorkerRequest = {
  id: number;
  profileId: string | null;
};

export type BrazeWorkerResponse =
  | { id: number; success: true }
  | { id: number; success: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Validate the worker's only incoming operation: synchronize an identity.
 *
 * @param value - A structured-cloned message.
 * @returns Whether the request is supported.
 */
export function isBrazeWorkerRequest(
  value: unknown,
): value is BrazeWorkerRequest {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.id) &&
    (value.profileId === null || typeof value.profileId === 'string')
  );
}

/**
 * Validate acknowledgements without accepting commands, HTML, or callbacks.
 *
 * @param value - A structured-cloned message.
 * @returns Whether the response is supported.
 */
export function isBrazeWorkerResponse(
  value: unknown,
): value is BrazeWorkerResponse {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.id) &&
    (value.success === true ||
      (value.success === false && typeof value.error === 'string'))
  );
}

/**
 * Apply the one supported worker operation and return an acknowledgement.
 * SDK errors never become instructions or SDK-authored response content.
 *
 * @param value - A structured-cloned message.
 * @param host - The worker's SDK host, loaded after environment installation.
 * @returns An acknowledgement, or undefined for unsupported messages.
 */
export async function handleBrazeWorkerRequest(
  value: unknown,
  host: Promise<SyncBrazeUser>,
): Promise<BrazeWorkerResponse | undefined> {
  if (!isBrazeWorkerRequest(value)) {
    return undefined;
  }
  const { id, profileId } = value;
  try {
    const syncUser = await host;
    await syncUser(profileId);
    return { id, success: true };
  } catch {
    return { id, success: false, error: 'Braze worker sync failed' };
  }
}
