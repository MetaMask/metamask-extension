import {
  CANCEL_TYPES,
  CancelType,
  PAYMENT_TYPES,
  ProductType,
  RECURRING_INTERVALS,
  Subscription,
} from '@metamask/subscription-controller';
import { getIsShieldSubscriptionActive } from '../../lib/shield';
import { DefaultSubscriptionPaymentOptions } from '../../types/metametrics';
// eslint-disable-next-line import/no-restricted-paths
import { PreferencesController } from '../../../app/scripts/controllers/preferences-controller';
// eslint-disable-next-line import/no-restricted-paths
import MetaMetricsController from '../../../app/scripts/controllers/metametrics-controller';
import { SETTINGS_ROUTE } from '../../lib/deep-links/routes/route';
import { SHIELD_QUERY_PARAMS } from '../../lib/deep-links/routes/shield';
import { loadShieldConfig } from './config';

export async function getShieldGatewayConfig(
  getToken: () => Promise<string>,
  getShieldSubscription: () => Subscription | undefined,
  url: string,
  opts?: {
    origin?: string;
  },
): Promise<{ newUrl: string; authorization: string | undefined }> {
  const shieldConfig = loadShieldConfig();
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

  const host = shieldConfig.gatewayUrl;
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

/**
 * Get the default subscription payment options displayed to the user in the Shield plan page.
 * Since we can't access the UI here, we get from the AppStateController.
 *
 * @param defaultOption - The default option.
 * @returns The default subscription payment options.
 */
export function getDefaultSubscriptionPaymentOptions(
  defaultOption?: DefaultSubscriptionPaymentOptions,
) {
  const defaultBillingInterval =
    defaultOption?.defaultBillingInterval || RECURRING_INTERVALS.year;
  const defaultPaymentType =
    defaultOption?.defaultPaymentType || PAYMENT_TYPES.byCard;
  const defaultPaymentCurrency = defaultOption?.defaultPaymentCurrency || 'USD';
  const defaultPaymentChain = defaultOption?.defaultPaymentChain;
  return {
    defaultBillingInterval,
    defaultPaymentType,
    defaultPaymentCurrency,
    defaultPaymentChain,
  };
}

/**
 * Check if a product is an already trialed subscription
 *
 * @param trialProducts - The trial products.
 * @param product - The product.
 * @returns True if the product is a trialed subscription, false otherwise.
 */
export function getIsTrialedSubscription(
  trialProducts: ProductType[],
  product: ProductType,
): boolean {
  return Boolean(trialProducts?.includes(product));
}

/**
 * Check if subscription cancellation is not allowed based on cancel type
 *
 * @param cancelType - The cancel type from the subscription.
 * @returns True if cancellation is not allowed, false otherwise.
 */
export function getIsSubscriptionCancelNotAllowed(
  cancelType: CancelType,
): boolean {
  return (
    cancelType === CANCEL_TYPES.NOT_ALLOWED ||
    cancelType === CANCEL_TYPES.NOT_ALLOWED_PENDING_VERIFICATION
  );
}

/**
 * Update the preferences after a shield subscription is active
 *
 * @param metaMetricsController - MetaMetricsController instance.
 * @param preferencesController - PreferencesController instance.
 */
export function updatePreferencesAndMetricsForShieldSubscription(
  metaMetricsController: MetaMetricsController,
  preferencesController: PreferencesController,
) {
  // shield subscribers have to turn on metametrics
  metaMetricsController.setParticipateInMetaMetrics(true);
  // shield subscribers have to turn on security alerts
  preferencesController.setSecurityAlertsEnabled(true);
  // shield subscribers have to turn on phishing detection
  preferencesController.setUsePhishDetect(true);
  // shield subscribers have to turn on transaction simulations
  preferencesController.setUseTransactionSimulations(true);
}

/**
 * Get the shield in app navigation from an external link.
 * This function is used to navigate to the shield page from an external link instead of opening a new tab
 * TODO: clean this once we have better control of how deeplink are opened
 *
 * @param externalLink - The external link.
 * @returns The shield in app navigation.
 */
export function getShieldInAppNavigationFromExternalLink(
  externalLink: string,
): string {
  const url = new URL(externalLink);
  const params = url.searchParams.toString();
  return `${SETTINGS_ROUTE}?${SHIELD_QUERY_PARAMS.showShieldEntryModal}=true${params ? `&${params}` : ''}`;
}
