import {
  RECURRING_INTERVALS,
  Subscription,
} from '@metamask/subscription-controller';
import { getIsShieldSubscriptionActive } from '../lib/shield';

export async function getShieldGatewayConfig(
  getToken: () => Promise<string>,
  getShieldSubscription: () => Subscription | undefined,
  url: string,
  opts?: {
    origin?: string;
  },
): Promise<{ newUrl: string; authorization: string | undefined }> {
  const shieldSubscription = getShieldSubscription();
  const isShieldSubscriptionActive = shieldSubscription
    ? getIsShieldSubscriptionActive(shieldSubscription)
    : false;

  if (!isShieldSubscriptionActive) {
    return {
      newUrl: url,
      authorization: undefined,
    };
  }

  const host = process.env.SHIELD_GATEWAY_URL;
  if (!host) {
    throw new Error('Shield gateway URL is not set');
  }

  try {
    let newUrl = `${host}/proxy?url=${encodeURIComponent(url)}`;
    const origin = opts?.origin;
    if (origin) {
      newUrl += `&origin=${encodeURIComponent(origin)}`;
    }

    let authorization = await getToken();
    if (authorization && !authorization.startsWith(`Bearer`)) {
      authorization = `Bearer ${authorization}`;
    }

    return {
      newUrl,
      authorization,
    };
  } catch (error) {
    console.error('Failed to get bearer token', error);
    return {
      newUrl: url,
      authorization: undefined,
    };
  }
}

/**
 * Calculate the remaining billing cycles for a subscription
 *
 * @param params
 * @param params.currentPeriodEnd - The current period end date.
 * @param params.endDate - The end date.
 * @param params.interval - The interval.
 * @returns The remaining billing cycles.
 */
export function calculateSubscriptionRemainingBillingCycles({
  currentPeriodEnd,
  endDate,
  interval,
}: {
  currentPeriodEnd: Date;
  endDate: Date;
  interval: (typeof RECURRING_INTERVALS)[keyof typeof RECURRING_INTERVALS];
}): number {
  if (interval === RECURRING_INTERVALS.month) {
    const yearDiff = endDate.getFullYear() - currentPeriodEnd.getFullYear();
    const monthDiff = endDate.getMonth() - currentPeriodEnd.getMonth();
    // Assume the period end and endDate have the same day of the month and time
    // Current period is inclusive, so we need to add 1
    return yearDiff * 12 + monthDiff + 1;
  }
  const yearDiff = endDate.getFullYear() - currentPeriodEnd.getFullYear();
  // Assume the period end and endDate have the same month, day of the month and time
  // Current period is inclusive, so we need to add 1
  return yearDiff + 1;
}
