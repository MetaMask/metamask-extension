import { useCallback, useState, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import log from 'loglevel';
import {
  getSelectedAccountGroup,
  getInternalAccountsFromGroupById,
} from '../../selectors/multichain-accounts/account-tree';
import { setCandidateSubscriptionId } from '../../ducks/rewards';
import { MetaMetricsContext } from '../../contexts/metametrics';
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
import { useI18nContext } from '../useI18nContext';
import { getHardwareWalletName } from '../../ducks/bridge/selectors';
import { useRequestHardwareWalletAccess } from './useRequestHardwareWalletAccess';
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
  const dispatch = useDispatch();
  const hardwareWalletName = useSelector(getHardwareWalletName);
  const [optinLoading, setOptinLoading] = useState<boolean>(false);
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);

  // Hardware wallet detection and access
  const { requestHardwareWalletAccess, isHardwareWalletAccount } =
    useRequestHardwareWalletAccess();


  // Get accounts for active (selected) account group
  const activeGroupAccounts = useSelector((state) =>
    selectedAccountGroupId
      ? getInternalAccountsFromGroupById(
          state,
          selectedAccountGroupId as AccountGroupId,
        )
      : [],
  );

  // Get accounts for the primary account group
  const { accounts: primaryWalletGroupAccounts, accountGroupId: primaryWalletAccountGroupId } = usePrimaryWalletGroupAccounts();

  const handleOptIn = useCallback(
    async (referralCode?: string) => {
      const referred = Boolean(referralCode);
      const metricsProps = {
        referred,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        referral_code_used: referralCode,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_hardware_wallet: isHardwareWalletAccount,
      };
      trackEvent({
        category: MetaMetricsEventCategory.Rewards,
        event: MetaMetricsEventName.RewardsOptInStarted,
        properties: metricsProps,
      });

      let subscriptionId: string | null = null;

      try {
        setOptinLoading(true);
        setOptinError(null);

        // For hardware wallets, request USB/HID access first (must be in user gesture context)
        if (isHardwareWalletAccount) {
          const accessGranted = await requestHardwareWalletAccess();
          if (!accessGranted) {
            setOptinError(
              t('hardwareWalletSubmissionWarningStep1', [hardwareWalletName]),
            );
            setOptinLoading(false);
            trackEvent({
              category: MetaMetricsEventCategory.Rewards,
              event: MetaMetricsEventName.RewardsOptInFailed,
              properties: {
                ...metricsProps,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                failure_reason: 'hardware_wallet_access_denied',
              },
            });
            return;
          }
        }

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
          if (accountsToLinkAfterOptIn.length > 0 && !isHardwareWalletAccount) {
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

          trackEvent({
            category: MetaMetricsEventCategory.Rewards,
            event: MetaMetricsEventName.RewardsOptInCompleted,
            properties: metricsProps,
          });

          // Update user traits
          try {
            await dispatch(
              updateMetaMetricsTraits({
                [MetaMetricsUserTrait.HasRewardsOptedIn]: 'on',
                ...(referralCode && {
                  [MetaMetricsUserTrait.RewardsReferred]: true,
                  [MetaMetricsUserTrait.RewardsReferralCodeUsed]: referralCode,
                }),
              }),
            );
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
        trackEvent({
          category: MetaMetricsEventCategory.Rewards,
          event: MetaMetricsEventName.RewardsOptInFailed,
          properties: metricsProps,
        });

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
      primaryWalletAccountGroupId,
      primaryWalletGroupAccounts,
      activeGroupAccounts,
      dispatch,
      t,
      options?.rewardPoints,
      options?.shieldSubscriptionId,
      isHardwareWalletAccount,
      requestHardwareWalletAccess,
      hardwareWalletName,
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
