import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import { useAccountTotalFiatBalance } from '../../useAccountTotalFiatBalance';
import {
  formatExistingSubscriptionEventProps,
  getShieldCommonTrackingProps,
  getShieldMarketingTrackingProps,
} from '../../../../shared/modules/shield';
import { MetaMaskReduxDispatch } from '../../../store/store';
import { setShieldSubscriptionMetricsProps } from '../../../store/actions';
import { EntryModalSourceEnum } from '../../../../shared/constants/subscriptions';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import {
  CaptureShieldPaymentMethodChangeEventParams,
  ExistingSubscriptionEventParams,
} from '../../../../shared/types';
import {
  CaptureShieldClaimSubmissionEventParams,
  CaptureShieldCryptoConfirmationEventParams,
  CaptureShieldCtaClickedEventParams,
  CaptureShieldEligibilityCohortAssignedEventParams,
  CaptureShieldEligibilityCohortTimeoutEventParams,
  CaptureShieldEntryModalEventParams,
  CaptureShieldErrorStateClickedEventParams,
  CaptureShieldMembershipCancelledEventParams,
  CaptureShieldSubscriptionRequestParams,
  CaptureShieldSubscriptionRestartRequestEventParams,
  CaptureShieldUnexpectedErrorEventParams,
} from './types';
import {
  formatCaptureShieldCtaClickedEventProps,
  formatCaptureShieldEligibilityCohortEventsProps,
  formatCaptureShieldPaymentMethodChangeEventProps,
  formatDefaultShieldSubscriptionRequestEventProps,
} from './utils';

export const useSubscriptionMetrics = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const trackEvent = useContext(MetaMetricsContext);
  const evmInternalAccount = useSelector((state) =>
    // Account address will be the same for all EVM accounts
    getInternalAccountBySelectedAccountGroupAndCaip(state, 'eip155:1'),
  );
  const selectedAccount = evmInternalAccount;
  const hdKeyingsMetadata = useSelector(getMetaMaskHdKeyrings);
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    selectedAccount,
    true, // hide zero balance tokens
    true, // use USD conversion rate instead of the current currency
  );

  /**
   * Set the Shield subscription metrics properties to the background.
   *
   * Since some of the properties are not accessible in the background directly, we need to set them from the UI.
   *
   * @param props - The Shield subscription metrics properties.
   * @param props.source - The source of the Shield subscription metrics.
   */
  const setShieldSubscriptionMetricsPropsToBackground = useCallback(
    async (props: {
      marketingUtmParams?: Record<string, string>;
      source: EntryModalSourceEnum;
      rewardPoints?: number;
    }) => {
      await dispatch(
        setShieldSubscriptionMetricsProps({
          marketingUtmParams: props.marketingUtmParams,
          source: props.source,
          userBalanceInUSD: Number(totalFiatBalance),
          rewardPoints: props.rewardPoints,
        }),
      );
    },
    [dispatch, totalFiatBalance],
  );

  const captureShieldEligibilityCohortEvent = useCallback(
    async (
      params:
        | CaptureShieldEligibilityCohortAssignedEventParams
        | CaptureShieldEligibilityCohortTimeoutEventParams,
      event: MetaMetricsEventName,
    ) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams = formatCaptureShieldEligibilityCohortEventsProps(
        params,
        Number(totalFiatBalance),
      );
      trackEvent({
        event,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the Shield entry modal is viewed and the user clicks CTA actions.
   */
  const captureShieldEntryModalEvent = useCallback(
    (params: CaptureShieldEntryModalEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );

      trackEvent({
        event: MetaMetricsEventName.ShieldEntryModal,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...getShieldMarketingTrackingProps(params.marketingUtmParams),
          source: params.source,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          modal_type: params.type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          modal_cta_action_clicked: params.modalCtaActionClicked,
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
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams =
        formatDefaultShieldSubscriptionRequestEventProps(params);

      trackEvent({
        event: MetaMetricsEventName.ShieldSubscriptionRequest,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the subscription restart request is triggered.
   */
  const captureShieldSubscriptionRestartRequestEvent = useCallback(
    (params: CaptureShieldSubscriptionRestartRequestEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldMembershipRestartRequest,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: params.requestStatus,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: params.errorMessage,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the Shield membership is cancelled.
   */
  const captureShieldMembershipCancelledEvent = useCallback(
    (params: CaptureShieldMembershipCancelledEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldMembershipCancelled,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
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
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the payment method is changed whilst the membership is active.
   */
  const captureShieldPaymentMethodChangeEvent = useCallback(
    (params: CaptureShieldPaymentMethodChangeEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams =
        formatCaptureShieldPaymentMethodChangeEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldPaymentMethodChange,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: params.changeStatus,
          error: params.errorMessage,
        },
      });
    },
    [selectedAccount, hdKeyingsMetadata, totalFiatBalance, trackEvent],
  );

  /**
   * Capture the various events when the shield membership is active.
   *
   * @param params - The parameters for the event.
   * @param event - The name of the event to capture.
   */
  const captureCommonExistingShieldSubscriptionEvents = useCallback(
    (params: ExistingSubscriptionEventParams, event: MetaMetricsEventName) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  const captureShieldCryptoConfirmationEvent = useCallback(
    (params: CaptureShieldCryptoConfirmationEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );

      const formattedParams =
        formatDefaultShieldSubscriptionRequestEventProps(params);

      trackEvent({
        event: MetaMetricsEventName.ShieldSubscriptionCryptoConfirmation,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_insufficient_gas: params.hasInsufficientGas,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  const captureShieldCtaClickedEvent = useCallback(
    (params: CaptureShieldCtaClickedEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams = formatCaptureShieldCtaClickedEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldCtaClicked,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  const captureShieldClaimSubmissionEvent = useCallback(
    (params: CaptureShieldClaimSubmissionEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      trackEvent({
        event: MetaMetricsEventName.ShieldClaimSubmission,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
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
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when the user clicks on the error state.
   */
  const captureShieldErrorStateClickedEvent = useCallback(
    (params: CaptureShieldErrorStateClickedEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldMembershipErrorStateClicked,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          ...formattedParams,
          type: params.errorCause,
          action: params.actionClicked,
          location: params.location,
          view: params.view,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  /**
   * Capture the event when an unexpected error occurs.
   */
  const captureShieldUnexpectedErrorEvent = useCallback(
    (params: CaptureShieldUnexpectedErrorEventParams) => {
      const commonTrackingProps = getShieldCommonTrackingProps(
        selectedAccount,
        hdKeyingsMetadata,
        Number(totalFiatBalance),
      );
      trackEvent({
        event: MetaMetricsEventName.ShieldSubscriptionUnexpectedErrorEvent,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...commonTrackingProps,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: params.errorMessage,
          location: params.location,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance],
  );

  return {
    setShieldSubscriptionMetricsPropsToBackground,
    captureShieldEntryModalEvent,
    captureShieldSubscriptionRequestEvent,
    captureShieldMembershipCancelledEvent,
    captureShieldPaymentMethodChangeEvent,
    captureShieldCtaClickedEvent,
    captureShieldClaimSubmissionEvent,
    captureShieldCryptoConfirmationEvent,
    captureShieldEligibilityCohortEvent,
    captureCommonExistingShieldSubscriptionEvents,
    captureShieldErrorStateClickedEvent,
    captureShieldSubscriptionRestartRequestEvent,
    captureShieldUnexpectedErrorEvent,
  };
};
