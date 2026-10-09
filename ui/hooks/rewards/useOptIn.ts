import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
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
} from '../../../shared/constants/metametrics';
import {
  rewardsOptIn,
  rewardsLinkAccountsToSubscriptionCandidate,
  linkRewardToShieldSubscription,
} from '../../store/actions';
import { handleRewardsErrorMessage } from '../../components/app/rewards/utils/handleRewardsErrorMessage';
import { isHardwareAccount } from '../../components/app/rewards/utils/isHardwareAccount';
import { useI18nContext } from '../useI18nContext';
import { useDispatch } from '../../store/hooks';
import type { MetaMaskReduxDispatch } from '../../store/types';
import { EMPTY_ARRAY } from '../../selectors/shared';
import { usePrimaryWalletGroupAccounts } from './usePrimaryWalletGroupAccounts';

export type UseOptinResult = {
  /**
   * Function to initiate the optin process
   */
  optin: () => Promise<void>;

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

function chooseOptInAccounts(
  usePrimaryGroup: boolean,
  primaryAccounts: InternalAccount[],
  activeAccounts: InternalAccount[],
): {
  accountsToOptIn: InternalAccount[];
  accountsToLinkAfterOptIn: InternalAccount[];
} {
  if (usePrimaryGroup) {
    return {
      accountsToOptIn: primaryAccounts,
      accountsToLinkAfterOptIn: activeAccounts,
    };
  }
  return {
    accountsToOptIn: activeAccounts,
    accountsToLinkAfterOptIn: primaryAccounts,
  };
}

async function linkAccountsAfterOptIn(
  dispatch: MetaMaskReduxDispatch,
  accountsToLink: InternalAccount[],
  primaryAccounts: InternalAccount[],
): Promise<void> {
  if (accountsToLink.length === 0 || isHardwareAccount(accountsToLink[0])) {
    return;
  }
  try {
    await dispatch(
      rewardsLinkAccountsToSubscriptionCandidate(
        accountsToLink,
        primaryAccounts,
      ),
    );
  } catch {
    // Failed to link active group accounts.
  }
}

async function linkShieldRewardIfPresent(
  dispatch: MetaMaskReduxDispatch,
  rewardPoints: number | undefined,
  shieldSubscriptionId: string | undefined,
): Promise<void> {
  if (!rewardPoints || !shieldSubscriptionId) {
    return;
  }
  try {
    await dispatch(
      linkRewardToShieldSubscription(shieldSubscriptionId, rewardPoints),
    );
  } catch (error) {
    // Silently fail - reward linking should not block opt-in
    log.warn('Failed to link reward to shield subscription', error);
  }
}

export const useOptIn = (options?: UseOptInOptions): UseOptinResult => {
  const [optinError, setOptinError] = useState<string | null>(null);
  const dispatch = useDispatch();
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

  const handleOptIn = useCallback(async () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.RewardsOptInStarted)
        .addCategory(MetaMetricsEventCategory.Rewards)
        .build(),
    );

    let subscriptionId: string | null = null;

    try {
      setOptinLoading(true);
      setOptinError(null);

      const usePrimaryGroup =
        Boolean(primaryWalletAccountGroupId) &&
        primaryWalletGroupAccounts.length > 0;
      const { accountsToOptIn, accountsToLinkAfterOptIn } = chooseOptInAccounts(
        usePrimaryGroup,
        primaryWalletGroupAccounts,
        activeGroupAccounts,
      );

      subscriptionId = (await dispatch(
        rewardsOptIn({ accounts: accountsToOptIn }),
      )) as unknown as string | null;

      if (subscriptionId) {
        // Prevent more than 1 explicit sign request for opting in, in case of hardware wallet
        // Linking of other accounts for the hardware wallet can be handled later.
        await linkAccountsAfterOptIn(
          dispatch,
          accountsToLinkAfterOptIn,
          primaryWalletGroupAccounts,
        );

        trackEvent(
          createEventBuilder(MetaMetricsEventName.RewardsOptInCompleted)
            .addCategory(MetaMetricsEventCategory.Rewards)
            .build(),
        );

        await linkShieldRewardIfPresent(
          dispatch,
          options?.rewardPoints,
          options?.shieldSubscriptionId,
        );
      }
    } catch (error) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.RewardsOptInFailed)
          .addCategory(MetaMetricsEventCategory.Rewards)
          .build(),
      );

      const errorMessage = handleRewardsErrorMessage(error, t);
      setOptinError(errorMessage);
    }

    if (subscriptionId) {
      dispatch(setCandidateSubscriptionId(subscriptionId));
    }

    setOptinLoading(false);
  }, [
    trackEvent,
    createEventBuilder,
    primaryWalletAccountGroupId,
    primaryWalletGroupAccounts,
    activeGroupAccounts,
    dispatch,
    t,
    options?.rewardPoints,
    options?.shieldSubscriptionId,
  ]);

  const clearOptinError = useCallback(() => setOptinError(null), []);

  return {
    optin: handleOptIn,
    optinLoading,
    optinError,
    clearOptinError,
  };
};
