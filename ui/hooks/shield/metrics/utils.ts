import { CaptureShieldSubscriptionRequestParams } from "./types";
import { getBillingCyclesForMetrics, getBillingIntervalForMetrics } from "../../../../shared/modules/shield";

export function formatDefaultShieldSubscriptionRequestEventProps(params: CaptureShieldSubscriptionRequestParams) {
  const defaultBillingInterval = getBillingIntervalForMetrics(params.defaultBillingInterval);
  const selectedBillingInterval = getBillingIntervalForMetrics(params.billingInterval);
  const billingCycles = getBillingCyclesForMetrics(params.billingInterval);

  return {
    subscription_state: params.subscriptionState,
    default_payment_type: params.defaultPaymentType,
    default_payment_currency: params.defaultPaymentCurrency,
    default_billing_interval: defaultBillingInterval,
    default_payment_chain: params.defaultPaymentChain,
    payment_type: params.paymentType,
    payment_currency: params.paymentCurrency,
    is_trial: params.isTrialSubscription,
    billing_interval: selectedBillingInterval,
    billing_cycles: billingCycles,
    payment_chain: params.paymentChain,
  };
}
