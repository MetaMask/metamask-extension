import {
  SubscriptionStatus,
  PaymentType,
  RecurringInterval,
  ModalType,
} from '@metamask/subscription-controller';
import { TransactionType } from '@metamask/transaction-controller';
import {
  EntryModalSourceEnum,
  ShieldCtaActionClickedEnum,
  ShieldCtaSourceEnum,
} from '../../../../shared/constants/subscriptions';
import { DefaultSubscriptionPaymentOptions } from '../../../../shared/types';

export type CaptureShieldEntryModalEventParams = {
  source: EntryModalSourceEnum;
  type: ModalType;

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
};

export type CaptureShieldSubscriptionRequestParams =
  DefaultSubscriptionPaymentOptions &
    Omit<CaptureShieldEntryModalEventParams, 'modalCtaActionClicked'> & {
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

      /**
       * For crypto subscriptions
       */
      paymentChain?: string;
      hasSufficientCryptoBalance?: boolean;
      gasSponsored?: boolean;

      errorMessage?: string;

      requestStatus: 'started' | 'completed' | 'failed';
    };

export type ExistingSubscriptionEventParams = {
  /**
   * Current subscription status before restarting the subscription. (e.g. cancelled, expired, etc.)
   */
  subscriptionStatus: SubscriptionStatus;

  /**
   * The payment type used for the previous subscription.
   */
  paymentType: PaymentType;

  /**
   * The billing interval used for the previous subscription.
   */
  billingInterval: RecurringInterval;

  /**
   * The crypto payment chain used for the previous subscription.
   */
  cryptoPaymentChain?: string;

  /**
   * The crypto payment currency used for the previous subscription.
   */
  cryptoPaymentCurrency?: string;
};

export type CaptureShieldSubscriptionRestartRequestParams =
  ExistingSubscriptionEventParams & {
    errorMessage?: string;

    restartStatus: 'succeeded' | 'failed';
  };

export type CaptureShieldMembershipCancelledEventParams =
  ExistingSubscriptionEventParams & {
    cancellationStatus: 'succeeded' | 'failed';
    errorMessage?: string;
    /**
     * The duration of the latest subscription in days.
     */
    latestSubscriptionDuration: number;
  };

/**
 * Capture the event when the payment method is changed whilst the membership is active.
 */
export type CaptureShieldPaymentMethodChangeEventParams =
  ExistingSubscriptionEventParams & {
    newPaymentType: PaymentType;
    newBillingInterval: RecurringInterval;
    newCryptoPaymentChain?: string;
    newCryptoPaymentCurrency?: string;
    changeStatus: 'succeeded' | 'failed';
    errorMessage?: string;
  };

/**
 * Capture the event when the payment method is retried after unsuccessful deduction attempt.
 */
export type CaptureShieldPaymentMethodRetriedEventParams =
  ExistingSubscriptionEventParams;

/**
 * Capture the event when payment failed due to insufficient allowance or users want to renew subscription that is ending soon.
 */
export type CaptureShieldPaymentMethodUpdatedEventParams =
  ExistingSubscriptionEventParams;

export type CaptureShieldBillingHistoryOpenedEventParams =
  ExistingSubscriptionEventParams;

export type CaptureShieldCtaClickedEventParams = {
  source: ShieldCtaSourceEnum;

  ctaActionClicked: ShieldCtaActionClickedEnum;

  redirectToPage?: string;

  redirectToUrl?: string;

  /**
   * The UTM ID used if source is marketing campaign
   */
  marketingUtmId?: string;
};
