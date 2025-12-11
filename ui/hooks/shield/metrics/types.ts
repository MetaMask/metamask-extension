import {
  SubscriptionStatus,
  PaymentType,
  RecurringInterval,
  ModalType,
  CohortName,
} from '@metamask/subscription-controller';
import { TransactionType } from '@metamask/transaction-controller';
import {
  EntryModalSourceEnum,
  ShieldCtaActionClickedEnum,
  ShieldCtaSourceEnum,
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
  ShieldSubscriptionRequestSubscriptionStateEnum,
  ShieldUnexpectedErrorEventLocationEnum,
} from '../../../../shared/constants/subscriptions';
import {
  DefaultSubscriptionPaymentOptions,
  ExistingSubscriptionEventParams,
} from '../../../../shared/types';

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
  marketingUtmParams?: Record<string, string>;

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
      subscriptionState: ShieldSubscriptionRequestSubscriptionStateEnum;

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

export type CaptureShieldMembershipCancelledEventParams =
  ExistingSubscriptionEventParams & {
    cancellationStatus: 'succeeded' | 'failed';
    errorMessage?: string;
    /**
     * The duration of the latest subscription in days.
     */
    latestSubscriptionDuration: number;
  };

export type CaptureShieldSubscriptionRestartRequestEventParams =
  ExistingSubscriptionEventParams & {
    requestStatus: 'completed' | 'failed';
    errorMessage?: string;
  };

/**
 * Triggered when the user has opened the crypto confirmation screen for a subscription or rejected the approval transaction.
 */
export type CaptureShieldCryptoConfirmationEventParams =
  CaptureShieldSubscriptionRequestParams & {
    /**
     * The status of the crypto confirmation screen.
     */
    confirmationScreenStatus: 'opened' | 'rejected';

    /**
     * Whether the user has insufficient gas to confirm the transaction.
     */
    hasInsufficientGas: boolean;

    gasSponsored: boolean;
  };

export type CaptureShieldCtaClickedEventParams = {
  source: ShieldCtaSourceEnum;

  ctaActionClicked: ShieldCtaActionClickedEnum;

  redirectToPage?: string;

  redirectToUrl?: string;

  /**
   * The UTM ID used if source is marketing campaign
   */
  marketingUtmParams?: Record<string, string>;
};

export type CaptureShieldClaimSubmissionEventParams = {
  /**
   * The status of the subscription at the time of claim submission
   */
  subscriptionStatus: SubscriptionStatus;

  /**
   * The number of attachments included in the claim submission
   */
  attachmentsCount: number;

  submissionStatus: 'started' | 'completed' | 'failed';

  errorMessage?: string;
};

/**
 * Capture the event when the user is assigned to a cohort based on eligibility rate.
 */
export type CaptureShieldEligibilityCohortAssignedEventParams = {
  cohort: CohortName;
  modalType: ModalType;
  numberOfEligibleCohorts: number;
};

/**
 * Capture the event when the user is timed out from a cohort.
 */
export type CaptureShieldEligibilityCohortTimeoutEventParams = {
  cohort: CohortName;
  numberOfEligibleCohorts: number;
};

/**
 * Capture the event when the user clicks on the error state.
 */
export type CaptureShieldErrorStateClickedEventParams =
  ExistingSubscriptionEventParams & {
    errorCause: string;
    actionClicked: ShieldErrorStateActionClickedEnum;
    location: ShieldErrorStateLocationEnum;
    view: ShieldErrorStateViewEnum;
  };

export type CaptureShieldUnexpectedErrorEventParams = {
  errorMessage: string;
  location: ShieldUnexpectedErrorEventLocationEnum;
};
