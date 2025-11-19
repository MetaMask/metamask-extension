import { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getInternalAccountsFromGroupById } from '../../selectors/multichain-accounts/account-tree';
import {
  rewardsGetOptInStatus,
  rewardsIsOptInSupported,
  rewardsLinkAccountsToSubscriptionCandidate,
} from '../../store/actions';
import { OptInStatusDto } from '../../../shared/types/rewards';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getAccountTypeCategory } from '../../pages/multichain-accounts/account-details/account-type-utils';

type LinkStatusReport = {
  success: boolean;
  byAddress: Record<string, boolean>;
};

type UseLinkAccountGroupResult = {
  linkAccountGroup: () => Promise<LinkStatusReport>;
  isLoading: boolean;
  isError: boolean;
};

export const useLinkAccountGroup = (
  accountGroupId?: AccountGroupId,
): UseLinkAccountGroupResult => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const internalAccountsForGroup = useSelector((state) =>
    accountGroupId
      ? getInternalAccountsFromGroupById(state, accountGroupId)
      : [],
  );

  const trackEvent = useContext(MetaMetricsContext);

  const triggerAccountLinkingEvent = useCallback(
    (event: MetaMetricsEventName, account: InternalAccount) => {
      const accountMetricProps = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: getAccountTypeCategory(account),
      };
      trackEvent({
        category: MetaMetricsEventCategory.Rewards,
        event,
        properties: accountMetricProps,
      });
    },
    [trackEvent],
  );

  const linkAccountGroup = useCallback(async (): Promise<LinkStatusReport> => {
    if (!internalAccountsForGroup) {
      return {
        success: false,
        byAddress: {},
      };
    }

    setIsLoading(true);
    setIsError(false);

    const byAddress: Record<string, boolean> = {};
    try {
      // Determine supported accounts by awaiting async support checks
      const supportChecks = await Promise.all(
        internalAccountsForGroup.map(
          (account) =>
            dispatch(
              rewardsIsOptInSupported({ account }),
            ) as unknown as Promise<boolean>,
        ),
      );

      const supportedAccounts = internalAccountsForGroup.filter(
        (_account, index) => Boolean(supportChecks[index]),
      );

      if (supportedAccounts.length === 0) {
        setIsError(true);
        return {
          success: false,
          byAddress,
        };
      }

      // Initialize all accounts as not linked
      supportedAccounts.forEach((account) => {
        byAddress[account.address] = false;
      });

      // Only process eligible accounts for opt-in status check
      const addresses = supportedAccounts.map((account) => account.address);
      const optInResponse: OptInStatusDto = (await dispatch(
        rewardsGetOptInStatus({ addresses }),
      )) as unknown as OptInStatusDto;

      // Map opt-in status for eligible accounts only
      supportedAccounts.forEach((account, index) => {
        if (optInResponse.ois[index]) {
          byAddress[account.address] = true;
        }
      });

      const accountsToLink = supportedAccounts.filter(
        (_, index) => optInResponse.ois[index] === false,
      );

      if (accountsToLink.length === 0) {
        return { success: true, byAddress };
      }

      // Emit started events for all accounts before calling the function
      for (const account of accountsToLink) {
        triggerAccountLinkingEvent(
          MetaMetricsEventName.RewardsAccountLinkingStarted,
          account,
        );
      }

      try {
        const results = (await dispatch(
          rewardsLinkAccountsToSubscriptionCandidate(accountsToLink),
        )) as unknown as { account: InternalAccount; success: boolean }[];

        // Process results and emit completion/failure events
        for (const result of results) {
          byAddress[result.account.address] = result.success;
          if (result.success) {
            triggerAccountLinkingEvent(
              MetaMetricsEventName.RewardsAccountLinkingCompleted,
              result.account,
            );
          } else {
            triggerAccountLinkingEvent(
              MetaMetricsEventName.RewardsAccountLinkingFailed,
              result.account,
            );
          }
        }
      } catch (err) {
        // Mark all accounts as failed and emit failure events
        for (const account of accountsToLink) {
          byAddress[account.address] = false;
          triggerAccountLinkingEvent(
            MetaMetricsEventName.RewardsAccountLinkingFailed,
            account,
          );
        }
      }

      const fullySucceeded = Object.values(byAddress).every((status) => status);
      if (fullySucceeded) {
        return { success: true, byAddress };
      }

      setIsError(true);
      return { success: false, byAddress };
    } catch {
      setIsError(true);
      return { success: false, byAddress: {} };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, internalAccountsForGroup, triggerAccountLinkingEvent]);

  return {
    linkAccountGroup,
    isLoading,
    isError,
  };
};
