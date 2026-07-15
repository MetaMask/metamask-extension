import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import log from 'loglevel';
import {
  getSelectedAccountGroup,
  getInternalAccountsFromGroupById,
} from '../../selectors/multichain-accounts/account-tree';
import { setCandidateSubscriptionId } from '../../ducks/rewards';
import { useAnalytics } from '../useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import {
  rewardsOptIn,
  rewardsLinkAccountsToSubscriptionCandidate,
  updateMetaMetricsTraits,
  linkRewardToShieldSubscription,
} from '../../store/actions';
import { handleRewardsErrorMessage } from '../../components/app/rewards/utils/handleRewardsErrorMessage';
import { isHardwareAccount } from '../../components/app/rewards/utils/isHardwareAccount';
import { useI18nContext } from '../useI18nContext';
import { useAppDispatch } from '../../store/hooks';
import { EMPTY_ARRAY } from '../../selectors/shared';
import { usePrimaryWalletGroupAccounts } from './usePrimaryWalletGroupAccounts';

export type UseOptinResult = {
  /**
   * Function to initiate the optin process
   */
  optin: (referralCode?: string) => Promise<void>;

  /**
   * Loading state for optin operation
   */
  optinLoading: boolean;
  /**
   * Error message from optin process
   */
  optinError: string | null;
  /**
   * Function to clear the optin error
   */
  clearOptinError: () => void;
};

type UseOptInOptions = {
  rewardPoints?: number;
  shieldSubscriptionId?: string;
};

export const useOptIn = (options?: UseOptInOptions): UseOptinResult => {
  const [optinError, setOptinError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const [optinLoading, setOptinLoading] = useState<boolean>(false);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext();
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);

  // Get accounts for active (selected) account group
  const activeGroupAccounts = useSelector((state) =>
    selectedAccountGroupId
      ? getInternalAccountsFromGroupById(
          state,
          selectedAccountGroupId as AccountGroupId,
        )
      : EMPTY_ARRAY,
  );

  // Get accounts for the primary account group
  const {
    accounts: primaryWalletGroupAccounts,
    accountGroupId: primaryWalletAccountGroupId,
  } = usePrimaryWalletGroupAccounts();

  const handleOptIn = useCallback(
    async (referralCode?: string) => {
      const referred = Boolean(referralCode);
      const metricsProps = {
        referred,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        referral_code_used: referralCode,
      };
      trackEvent(
        createEventBuilder(MetaMetricsEventName.RewardsOptInStarted)
          .addCategory(MetaMetricsEventCategory.Rewards)
          .addProperties(metricsProps)
          .build(),
      );

      let subscriptionId: string | null = null;

      try {
        setOptinLoading(true);
        setOptinError(null);

        // First, opt in with side effect accounts
        const accountsToOptIn =
          primaryWalletAccountGroupId && primaryWalletGroupAccounts.length > 0
            ? primaryWalletGroupAccounts
            : activeGroupAccounts;

        const accountsToLinkAfterOptIn =
          primaryWalletAccountGroupId && primaryWalletGroupAccounts.length > 0
            ? activeGroupAccounts
            : primaryWalletGroupAccounts;

        subscriptionId = (await dispatch(
          rewardsOptIn({ accounts: accountsToOptIn, referralCode }),
        )) as unknown as string | null;

        if (subscriptionId) {
          // Prevent more than 1 explicit sign request for opting in, in case of hardware wallet
          // Linking of other accounts for the hardware wallet can be handled later.
          if (
            accountsToLinkAfterOptIn.length > 0 &&
            !isHardwareAccount(accountsToLinkAfterOptIn[0])
          ) {
            try {
              await dispatch(
                rewardsLinkAccountsToSubscriptionCandidate(
                  accountsToLinkAfterOptIn,
                  primaryWalletGroupAccounts,
                ),
              );
            } catch {
              // Failed to link active group accounts.
            }
          }

          trackEvent(
            createEventBuilder(MetaMetricsEventName.RewardsOptInCompleted)
              .addCategory(MetaMetricsEventCategory.Rewards)
              .addProperties(metricsProps)
              .build(),
          );

          // Update user traits
          try {
            await updateMetaMetricsTraits({
              [MetaMetricsUserTrait.HasRewardsOptedIn]: 'on',
              ...(referralCode && {
                [MetaMetricsUserTrait.RewardsReferred]: true,
                [MetaMetricsUserTrait.RewardsReferralCodeUsed]: referralCode,
              }),
            });
          } catch {
            // Silently fail - traits update should not block opt-in
          }

          // Link the reward to the shield subscription if opt in from the shield subscription
          if (options?.rewardPoints && options?.shieldSubscriptionId) {
            try {
              await dispatch(
                linkRewardToShieldSubscription(
                  options.shieldSubscriptionId,
                  options.rewardPoints,
                ),
              );
            } catch (error) {
              // Silently fail - reward linking should not block opt-in
              log.warn('Failed to link reward to shield subscription', error);
            }
          }
        }
      } catch (error) {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.RewardsOptInFailed)
            .addCategory(MetaMetricsEventCategory.Rewards)
            .addProperties(metricsProps)
            .build(),
        );

        const errorMessage = handleRewardsErrorMessage(error, t);
        setOptinError(errorMessage);
      }

      if (subscriptionId) {
        dispatch(setCandidateSubscriptionId(subscriptionId));
      }

      setOptinLoading(false);
    },
    [
      trackEvent,
      createEventBuilder,
      primaryWalletAccountGroupId,
      primaryWalletGroupAccounts,
      activeGroupAccounts,
      dispatch,
      t,
      options?.rewardPoints,
      options?.shieldSubscriptionId,
    ],
  );

  const clearOptinError = useCallback(() => setOptinError(null), []);

  return {
    optin: handleOptIn,
    optinLoading,
    optinError,
    clearOptinError,
  };
};
