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
  CaptureShieldEntryModalEventParams,
  CaptureShieldSubscriptionRequestParams,
  CaptureShieldSubscriptionRestartRequestParams,
} from './types';
import {
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

  const captureShieldSubscriptionRestartRequestEvent = useCallback(
    (params: CaptureShieldSubscriptionRestartRequestParams) => {
      const userAccountTypeAndCategory = getUserAccountTypeAndCategory(
        selectedAccount,
        hdKeyingsMetadata,
      );
      const formattedParams = formatExistingSubscriptionEventProps(params);
      trackEvent({
        event: MetaMetricsEventName.ShieldSubscriptionRestartRequest,
        category: MetaMetricsEventCategory.Shield,
        properties: {
          ...userAccountTypeAndCategory,
          ...formattedParams,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: params.errorMessage,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: params.restartStatus,
        },
      });
    },
    [trackEvent, selectedAccount, hdKeyingsMetadata],
  );

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

  return {
    captureShieldEntryModalEvent,
    captureShieldSubscriptionRequestEvent,
    captureShieldSubscriptionRestartRequestEvent,
    captureShieldBillingHistoryOpenedEvent,
  };
};
