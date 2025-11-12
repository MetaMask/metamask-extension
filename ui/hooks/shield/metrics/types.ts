import { SubscriptionStatus, PaymentType, RecurringInterval } from "@metamask/subscription-controller";
import { EntryModalSourceEnum, ShieldEntryModalTypeEnum } from "../../../../shared/constants/subscriptions";
import { DefaultSubscriptionPaymentOptions } from "../../../../shared/types";
import { TransactionType } from "@metamask/transaction-controller";

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

export type CaptureShieldSubscriptionRequestParams = DefaultSubscriptionPaymentOptions & Omit<CaptureShieldEntryModalEventParams, 'modalCtaActionClicked'> & {
  /**
   * Current subscription status before the new subscription request was started (cancelled, expired, etc.)
   */
  subscriptionState: SubscriptionStatus | 'none';

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
  hasSufficientCryptoBalance?: boolean;
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
