export type RewardsMoneyHttpFailure = {
  status?: number;
  bodyText?: string;
  retryAfterSeconds?: number;
};

/**
 * `RewardsMoneyHttpError` copies status, body, and `Retry-After` onto
 * `error.data`. After the background RPC boundary that bag is on
 * `error.data.cause` and `error.data.cause.data`.
 *
 * @param value - One of those bags.
 * @returns The bag when it carries an HTTP status.
 */
function httpFailureBag(value: unknown): RewardsMoneyHttpFailure | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const bag = value as RewardsMoneyHttpFailure;
  if (typeof bag.status !== 'number') {
    return undefined;
  }
  return bag;
}

/**
 * Reads a Rewards Money HTTP failure from whichever bag survived the RPC.
 *
 * @param error - The thrown error.
 * @returns The HTTP status, body text, and wait, when present.
 */
export function readRewardsMoneyHttpFailure(
  error: unknown,
): RewardsMoneyHttpFailure {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return {};
  }
  const { data } = error as {
    data?: RewardsMoneyHttpFailure & {
      cause?: RewardsMoneyHttpFailure & { data?: RewardsMoneyHttpFailure };
    };
  };
  const bag =
    httpFailureBag(data) ??
    httpFailureBag(data?.cause) ??
    httpFailureBag(data?.cause?.data);
  if (!bag) {
    return {};
  }
  const retryAfterSeconds =
    typeof bag.retryAfterSeconds === 'number' && bag.retryAfterSeconds > 0
      ? bag.retryAfterSeconds
      : undefined;
  return { status: bag.status, bodyText: bag.bodyText, retryAfterSeconds };
}

/**
 * A `429` or `503` that reached the UI. The data service has already retried
 * a wait of 5 seconds or less once.
 *
 * @param error - The thrown error, including the serialized RPC bag.
 * @returns Whether Accept should ask the user to try again.
 */
export function isBusyRewardsMoneyRead(error: unknown): boolean {
  const { status } = readRewardsMoneyHttpFailure(error);
  return status === 429 || status === 503;
}
