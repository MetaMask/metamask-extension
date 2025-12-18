import {
  formatExistingSubscriptionEventProps,
  getBillingCyclesForMetrics,
  getBillingIntervalForMetrics,
  getShieldMarketingTrackingProps,
  getUserBalanceCategory,
} from '../../../../shared/modules/shield';
import { CaptureShieldPaymentMethodChangeEventParams } from '../../../../shared/types';
import {
  CaptureShieldCtaClickedEventParams,
  CaptureShieldEligibilityCohortAssignedEventParams,
  CaptureShieldEligibilityCohortTimeoutEventParams,
  CaptureShieldSubscriptionRequestParams,
} from './types';

export function formatDefaultShieldSubscriptionRequestEventProps(
  params: CaptureShieldSubscriptionRequestParams,
) {
  const defaultBillingInterval = getBillingIntervalForMetrics(
    params.defaultBillingInterval,
  );
  const selectedBillingInterval = getBillingIntervalForMetrics(
    params.billingInterval,
  );
  const billingCycles = getBillingCyclesForMetrics(params.billingInterval);

  return {
    ...getShieldMarketingTrackingProps(params.marketingUtmParams),
    source: params.source,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    post_transaction_type: params.postTransactionType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    subscription_state: params.subscriptionState,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_payment_type: params.defaultPaymentType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_payment_currency: params.defaultPaymentCurrency,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_billing_interval: defaultBillingInterval,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_payment_chain: params.defaultPaymentChain,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_type: params.paymentType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_currency: params.paymentCurrency,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_trial: params.isTrialSubscription,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    billing_interval: selectedBillingInterval,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    billing_cycles: billingCycles,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_chain: params.paymentChain,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    has_sufficient_crypto_balance: params.hasSufficientCryptoBalance,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_sponsored: params.gasSponsored,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    error_message: params.errorMessage,
    status: params.requestStatus,
  };
}

export function formatCaptureShieldPaymentMethodChangeEventProps(
  params: CaptureShieldPaymentMethodChangeEventParams,
) {
  const existingSubscriptionEventProps =
    formatExistingSubscriptionEventProps(params);
  const newBillingInterval = getBillingIntervalForMetrics(
    params.newBillingInterval,
  );

  return {
    ...existingSubscriptionEventProps,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    new_payment_type: params.newPaymentType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    new_billing_interval: newBillingInterval,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    new_crypto_payment_chain: params.newCryptoPaymentChain,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    new_payment_currency: params.newPaymentCurrency,
  };
}

export function formatCaptureShieldCtaClickedEventProps(
  params: CaptureShieldCtaClickedEventParams,
) {
  return {
    ...getShieldMarketingTrackingProps(params.marketingUtmParams),
    source: params.source,
    page: params.redirectToPage,
    url: params.redirectToUrl,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    cta_action_clicked: params.ctaActionClicked,
  };
}

/**
 * Format the properties for the Shield eligibility cohort assigned and timeout events.
 *
 * @param params - The parameters for the Shield eligibility cohort assigned and timeout events.
 * @param totalFiatBalance - The total fiat balance of the user.
 * @returns The formatted properties.
 */
export function formatCaptureShieldEligibilityCohortEventsProps(
  params:
    | CaptureShieldEligibilityCohortAssignedEventParams
    | CaptureShieldEligibilityCohortTimeoutEventParams,
  totalFiatBalance: number,
) {
  const props: Record<string, string | number> = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    multi_chain_balance_category: getUserBalanceCategory(
      Number(totalFiatBalance),
    ),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    number_of_eligible_cohorts: params.numberOfEligibleCohorts,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    assigned_cohort: params.cohort,
  };

  if ('modalType' in params) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    props.modal_type = params.modalType;
  }

  return props;
}
