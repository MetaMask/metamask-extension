import { SubscriptionStatus, PaymentType, RecurringInterval } from "@metamask/subscription-controller";
import { TransactionType } from "viem";
import { EntryModalSourceEnum, ShieldEntryModalTypeEnum } from "../../../../shared/constants/subscriptions";

export type CaptureShieldEntryModalEventParams = {
  source: EntryModalSourceEnum;
  type: ShieldEntryModalTypeEnum;

  /**
   * The action clicked on the modal CTA button
   */
  modalCtaActionClicked: string;

  /**
   * The UTM ID used if source is marketing campaign
   */
  marketingUtmId?: string;

  /**
   * The type of transaction after which the entry modal is triggered
   */
  postTransactionType?: TransactionType;
}

export type CaptureShieldSubscriptionRequestParams = Omit<CaptureShieldEntryModalEventParams, 'modalCtaActionClicked'> & {
  /**
   * Current subscription status before the new subscription request was started (cancelled, expired, etc.)
   */
  subscriptionState: SubscriptionStatus;

  /**
   * The default options provided to the user in the UI.
   */
  defaultPaymentType: PaymentType;
  defaultPaymentCurrency: string;
  defaultBillingInterval: RecurringInterval;
  defaultPaymentChain?: string;

  /**
   * Actual options selected by the user for the new subscription request.
   */
  paymentType: PaymentType;
  paymentCurrency: string;
  isTrialSubscription: boolean;
  billingInterval: RecurringInterval;
  paymentChain?: string;
}

export type CaptureShieldSubscriptionRequestStartedEventParams = CaptureShieldSubscriptionRequestParams & {
  hasSufficientCryptoBalance: boolean;
}

export type CaptureShieldSubscriptionRequestCompletedEventParams = CaptureShieldSubscriptionRequestParams & {
  /**
   * Whether the gas for the crypto subscription was sponsored.
   */
  gasSponsored?: boolean;
}

export type CaptureShieldSubscriptionRequestFailedEventParams = CaptureShieldSubscriptionRequestParams & {
  errorMessage: string;
}
