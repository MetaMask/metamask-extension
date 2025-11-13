import { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getMetaMaskHdKeyrings, getSelectedAccount } from '../../../selectors';
import { useAccountTotalFiatBalance } from '../../useAccountTotalFiatBalance';
import {
  getUserAccountTypeAndCategory,
  getUserBalanceCategory,
} from '../../../../shared/modules/shield';
import {
  CaptureShieldBillingHistoryOpenedEventParams,
  CaptureShieldClaimSubmissionEventParams,
  CaptureShieldCryptoConfirmationEventParams,
  CaptureShieldCtaClickedEventParams,
  CaptureShieldEntryModalEventParams,
  CaptureShieldMembershipCancelledEventParams,
  CaptureShieldPaymentMethodChangeEventParams,
  CaptureShieldPaymentMethodRetriedEventParams,
  CaptureShieldPaymentMethodUpdatedEventParams,
  CaptureShieldSubscriptionRequestParams,
} from './types';
import {
  formatCaptureShieldCtaClickedEventProps,
  formatCaptureShieldPaymentMethodChangeEventProps,
  formatDefaultShieldSubscriptionRequestEventProps,
  formatExistingSubscriptionEventProps,
} from './utils';

export const useSubscriptionMetrics = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const selectedAccount = useSelector(getSelectedAccount);
  const hdKeyingsMetadata = useSelector(getMetaMaskHdKeyrings);
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    true, // hide zero balance tokens
    true, // use USD conversion rate instead of the current currency
  );

  /**
   * Capture the event when the Shield entry modal is viewed and the user clicks CTA actions.
   */
  const captureShieldEntryModalEvent = useCallback(
    (params: CaptureShieldEntryModalEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );

      trackEvent({
        event: MetaMetricsEventName.ShieldEntryModal,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          user_balance_category: getUserBalanceCategory(
            Number(totalFiatBalance),
          ),
          source: params.source,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          modal_type: params.type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          modal_cta_action_clicked: params.modalCtaActionClicked,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          marketing_utm_id: params.marketingUtmId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          post_transaction_type: params.postTransactionType,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the Shield subscription request is started.
   */
  const captureShieldSubscriptionRequestEvent = useCallback(
    (params: CaptureShieldSubscriptionRequestParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams =
        formatDefaultShieldSubscriptionRequestEventProps(params);

      trackEvent({
        event: MetaMetricsEventName.ShieldSubscriptionRequest,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          user_balance_category: getUserBalanceCategory(
            Number(totalFiatBalance),
          ),
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the payment method is retried after unsuccessful deduction attempt.
   */
  const captureShieldPaymentMethodRetriedEvent = useCallback(
    (params: CaptureShieldPaymentMethodRetriedEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldPaymentMethodRetried,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  const captureShieldMembershipCancelledEvent = useCallback(
    (params: CaptureShieldMembershipCancelledEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldMembershipCancelled,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: params.cancellationStatus,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: params.errorMessage,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          latest_subscription_duration: params.latestSubscriptionDuration,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  /**
   * Capture the event when the payment method is changed whilst the membership is active.
   */
  const captureShieldPaymentMethodChangeEvent = useCallback(
    (params: CaptureShieldPaymentMethodChangeEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams =
        formatCaptureShieldPaymentMethodChangeEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldPaymentMethodChange,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: params.changeStatus,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: params.errorMessage,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  /**
   * Capture the event when payment failed due to insufficient allowance or users want to renew subscription that is ending soon.
   */
  const captureShieldPaymentMethodUpdatedEvent = useCallback(
    (params: CaptureShieldPaymentMethodUpdatedEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldPaymentMethodUpdated,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  /**
   * Capture the event when the billing history is opened.
   */
  const captureShieldBillingHistoryOpenedEvent = useCallback(
    (params: CaptureShieldBillingHistoryOpenedEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldBillingHistoryOpened,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  const captureShieldCryptoConfirmationEvent = useCallback(
    (params: CaptureShieldCryptoConfirmationEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );

      const formattedParams =
        formatDefaultShieldSubscriptionRequestEventProps(params);

      trackEvent({
        event: MetaMetricsEventName.ShieldSubscriptionCryptoConfirmation,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_insufficient_gas: params.hasInsufficientGas,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  const captureShieldCtaClickedEvent = useCallback(
    (params: CaptureShieldCtaClickedEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams = formatCaptureShieldCtaClickedEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldCtaClicked,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  const captureShieldClaimSubmissionEvent = useCallback(
    (params: CaptureShieldClaimSubmissionEventParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      trackEvent({
        event: MetaMetricsEventName.ShieldClaimSubmission,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          subscription_status: params.subscriptionStatus,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          attachments_count: params.attachmentsCount,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          submission_status: params.submissionStatus,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: params.errorMessage,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

  return {
    captureShieldEntryModalEvent,
    captureShieldSubscriptionRequestEvent,
    captureShieldBillingHistoryOpenedEvent,
    captureShieldMembershipCancelledEvent,
    captureShieldPaymentMethodChangeEvent,
    captureShieldPaymentMethodRetriedEvent,
    captureShieldPaymentMethodUpdatedEvent,
    captureShieldCtaClickedEvent,
    captureShieldClaimSubmissionEvent,
    captureShieldCryptoConfirmationEvent,
  };
};
