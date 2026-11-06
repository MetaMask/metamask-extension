export const MONEY_REFERRAL_ROUTE = '/referral-invite';

export type MoneyReferralEntryType = 'deeplink' | 'restored_context';

/**
 * A captured link waits for the security decision before its invite can be
 * taken. Only `authorized` contexts may become an offer.
 */
export type MoneyReferralContextStatus = 'awaiting_continue' | 'authorized';

export type MoneyReferralContext = {
  id: string;
  url: string;
  code: string;
  entryType: MoneyReferralEntryType;
  status: MoneyReferralContextStatus;
};

/** A taken context plus whether this client may actually offer it. */
export type MoneyReferralOffer = MoneyReferralContext & {
  canOffer: boolean;
};

/**
 * Reads a Money code without sanitizing an invalid value into another code.
 *
 * @param url - Original link, before route filtering or canonicalization.
 * @returns The normalized code, or null for an unsupported/ambiguous value.
 */
export function getMoneyReferralCode(url: URL): string | null {
  if (
    url.hostname !== 'link.metamask.io' ||
    !['https:', 'http:'].includes(url.protocol)
  ) {
    return null;
  }
  const values = url.searchParams.getAll('ref');
  if (values.length !== 1) {
    return null;
  }
  const code = values[0].trim().toUpperCase();
  return /^[A-Z0-9]{3,24}$/u.test(code) ? code : null;
}

/**
 * Builds a handoff with the original URL for navigation if memory is lost.
 * The URL must still pass the normal deep-link parser at the destination.
 *
 * @param context - Captured referral context.
 * @returns An internal route, never an arbitrary external continuation.
 */
export function buildMoneyReferralRoute(
  context: Pick<MoneyReferralContext, 'id' | 'url'>,
): string {
  return `${MONEY_REFERRAL_ROUTE}?${new URLSearchParams({
    context: context.id,
    u: context.url,
  })}`;
}
