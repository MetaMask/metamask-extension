import { useCallback, useState, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import {
  getMultichainAccountsByWalletId,
  getWalletIdAndNameByAccountAddress,
  getSelectedAccountGroup,
} from '../../selectors/multichain-accounts/account-tree';
import { setCandidateSubscriptionId } from '../../ducks/rewards';
import { getIsMultichainAccountsState2Enabled } from '../../selectors/multichain-accounts';
import { getSelectedAccount } from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import { rewardsOptIn, updateMetaMetricsTraits } from '../../store/actions';
import { handleRewardsErrorMessage } from '../../components/app/rewards/utils/handleRewardsErrorMessage';
import { useI18nContext } from '../useI18nContext';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';
import { useLinkAccountGroup } from './useLinkAccountGroup';

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

export const useOptIn = (): UseOptinResult => {
  const [optinError, setOptinError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const [optinLoading, setOptinLoading] = useState<boolean>(false);
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const selectedAccount = useSelector(getSelectedAccount);
  const { id: walletId } = useSelector((state) =>
    getWalletIdAndNameByAccountAddress(state, selectedAccount.address),
  ) || { walletId: undefined };

  const accountGroupsByWallet = useSelector((state: MultichainAccountsState) =>
    walletId
      ? getMultichainAccountsByWalletId(state, walletId as AccountWalletId)
      : {},
  );

  // Link the first account group in the wallet if it's not the selected account group.
  const sideEffectAccountGroupIdToLink = useMemo(
    () =>
      accountGroupsByWallet ? Object.keys(accountGroupsByWallet)[0] : undefined,
    [accountGroupsByWallet],
  );

  const { linkAccountGroup } = useLinkAccountGroup(
    sideEffectAccountGroupIdToLink as AccountGroupId | undefined,
  );

  const handleOptIn = useCallback(
    async (referralCode?: string) => {
      const referred = Boolean(referralCode);
      const metricsProps = {
        referred,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        referral_code_used: referralCode,
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

        subscriptionId = (await dispatch(
          rewardsOptIn({ referralCode }),
        )) as unknown as string | null;

        if (subscriptionId) {
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

      if (
        isMultichainAccountsState2Enabled &&
        sideEffectAccountGroupIdToLink &&
        sideEffectAccountGroupIdToLink !== selectedAccountGroupId &&
        subscriptionId
      ) {
        try {
          await linkAccountGroup();
        } catch {
          // Failed to link first account group in same wallet.
        }
      }

      if (subscriptionId) {
        dispatch(setCandidateSubscriptionId(subscriptionId));
      }

      setOptinLoading(false);
    },
    [
      trackEvent,
      isMultichainAccountsState2Enabled,
      sideEffectAccountGroupIdToLink,
      dispatch,
      t,
      linkAccountGroup,
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
