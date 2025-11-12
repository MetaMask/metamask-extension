import { useCallback, useContext } from "react"
import { MetaMetricsContext } from "../../../contexts/metametrics"
import { MetaMetricsEventCategory, MetaMetricsEventName } from "../../../../shared/constants/metametrics";
import { useSelector } from "react-redux";
import { getMetaMaskHdKeyrings, getSelectedAccount } from "../../../selectors";
import { CaptureShieldEntryModalEventParams, CaptureShieldSubscriptionRequestCompletedEventParams, CaptureShieldSubscriptionRequestFailedEventParams, CaptureShieldSubscriptionRequestStartedEventParams } from "./types";
import { formatDefaultShieldSubscriptionRequestEventProps } from "./utils";
import { useAccountTotalFiatBalance } from "../../useAccountTotalFiatBalance";
import { getUserAccountTypeAndCategory, getUserBalanceCategory } from "../../../../shared/modules/shield";

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
  const captureShieldEntryModalEvent = useCallback((params: CaptureShieldEntryModalEventParams) => {
    const userAccountTypeAndCategory = getUserAccountTypeAndCategory(selectedAccount, hdKeyingsMetadata);

    trackEvent({
      event: MetaMetricsEventName.ShieldEntryModal,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...userAccountTypeAndCategory,
        user_balance_category: getUserBalanceCategory(Number(totalFiatBalance)),
        source: params.source,
        modal_type: params.type,
        modal_cta_action_clicked: params.modalCtaActionClicked,
        marketing_utm_id: params.marketingUtmId,
        post_transaction_type: params.postTransactionType,
      },
    });
  }, [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance]);

  /**
   * Capture the event when the Shield subscription request is started.
   */
  const captureShieldSubscriptionRequestStartedEvent = useCallback((params: CaptureShieldSubscriptionRequestStartedEventParams) => {
    const userAccountTypeAndCategory = getUserAccountTypeAndCategory(selectedAccount, hdKeyingsMetadata);
    const formattedParams = formatDefaultShieldSubscriptionRequestEventProps(params);

    trackEvent({
      event: MetaMetricsEventName.ShieldSubscriptionRequestStarted,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...userAccountTypeAndCategory,
        user_balance_category: getUserBalanceCategory(Number(totalFiatBalance)),
        ...formattedParams,
        has_sufficient_crypto_balance: params.hasSufficientCryptoBalance,
      },
    });
  }, [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance]);

  /**
   * Capture the event when the Shield subscription request is completed.
   */
  const captureShieldSubscriptionRequestCompletedEvent = useCallback((params: CaptureShieldSubscriptionRequestCompletedEventParams) => {
    const userAccountTypeAndCategory = getUserAccountTypeAndCategory(selectedAccount, hdKeyingsMetadata);
    const formattedParams = formatDefaultShieldSubscriptionRequestEventProps(params);

    trackEvent({
      event: MetaMetricsEventName.ShieldSubscriptionRequestCompleted,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...userAccountTypeAndCategory,
        user_balance_category: getUserBalanceCategory(Number(totalFiatBalance)),
        ...formattedParams,
        gas_sponsored: Boolean(params.gasSponsored),
      },
    });
  }, [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance]);

  /**
   * Capture the event when the Shield subscription request fails.
   */
  const captureShieldSubscriptionRequestFailedEvent = useCallback((params: CaptureShieldSubscriptionRequestFailedEventParams) => {
    const userAccountTypeAndCategory = getUserAccountTypeAndCategory(selectedAccount, hdKeyingsMetadata);
    const formattedParams = formatDefaultShieldSubscriptionRequestEventProps(params);

    trackEvent({
      event: MetaMetricsEventName.ShieldSubscriptionRequestFailed,
      category: MetaMetricsEventCategory.Shield,
      properties: {
        ...userAccountTypeAndCategory,
        user_balance_category: getUserBalanceCategory(Number(totalFiatBalance)),
        ...formattedParams,
        error_message: params.errorMessage,
      },
    });
  }, [trackEvent, selectedAccount, hdKeyingsMetadata, totalFiatBalance]);

  return {
    captureShieldEntryModalEvent,
    captureShieldSubscriptionRequestStartedEvent,
    captureShieldSubscriptionRequestCompletedEvent,
    captureShieldSubscriptionRequestFailedEvent,
  };
}
