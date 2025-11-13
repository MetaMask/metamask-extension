import {
  getBillingCyclesForMetrics,
  getBillingIntervalForMetrics,
} from '../../../../shared/modules/shield';
import {
  CaptureShieldCtaClickedEventParams,
  CaptureShieldPaymentMethodChangeEventParams,
  CaptureShieldSubscriptionRequestParams,
  ExistingSubscriptionEventParams,
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

export function formatExistingSubscriptionEventProps(
  params: ExistingSubscriptionEventParams,
) {
  const selectedBillingInterval = getBillingIntervalForMetrics(
    params.billingInterval,
  );

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    subscription_status: params.subscriptionStatus,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_type: params.paymentType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    crypto_payment_chain: params.cryptoPaymentChain,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    crypto_payment_currency: params.cryptoPaymentCurrency,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    billing_interval: selectedBillingInterval,
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
    source: params.source,
    page: params.redirectToPage,
    url: params.redirectToUrl,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    cta_action_clicked: params.ctaActionClicked,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    marketing_utm_id: params.marketingUtmId,
  };
}
