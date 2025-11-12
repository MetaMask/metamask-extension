import {
  SubscriptionStatus,
  PaymentType,
  RecurringInterval,
  ModalType,
} from '@metamask/subscription-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { EntryModalSourceEnum } from '../../../../shared/constants/subscriptions';
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

export type CaptureShieldSubscriptionRestartRequestParams = {
  /**
   * Current subscription status before restarting the subscription. (e.g. cancelled, expired, etc.)
   */
  subscriptionStatus: SubscriptionStatus;

  errorMessage?: string;

  restartStatus: 'succeeded' | 'failed';

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
