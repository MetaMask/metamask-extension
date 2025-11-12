import {
  getBillingCyclesForMetrics,
  getBillingIntervalForMetrics,
} from '../../../../shared/modules/shield';
import { CaptureShieldSubscriptionRequestParams } from './types';

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
