import { useCallback, useContext, useState, useRef, useEffect } from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useDispatch } from 'react-redux';
import {
  rewardsGetOptInStatus,
  rewardsIsOptInSupported,
  rewardsLinkAccountsToSubscriptionCandidate,
} from '../../store/actions';
import { OptInStatusDto } from '../../../shared/types/rewards';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getAccountTypeCategory } from '../../pages/multichain-accounts/account-details/account-type-utils';
import { setRewardsAccountLinkedTimestamp } from '../../ducks/rewards';

type UseLinkAccountAddressResult = {
  linkAccountAddress: (account: InternalAccount) => Promise<boolean>;
  isLoading: boolean;
  isError: boolean;
};

export const useLinkAccountAddress = (): UseLinkAccountAddressResult => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const linkAccountAddress = useCallback(
    async (account: InternalAccount): Promise<boolean> => {
      if (!isMountedRef.current) {
        return false;
      }
      setIsLoading(true);
      setIsError(false);

      try {
        // Check if account supports opt-in
        const isSupported = (await dispatch(
          rewardsIsOptInSupported({ account }),
        )) as unknown as boolean;

        if (!isMountedRef.current) {
          return false;
        }

        if (!isSupported) {
          setIsError(true);
          return false;
        }

        // Check opt-in status
        const optInResponse = (await dispatch(
          rewardsGetOptInStatus({ addresses: [account.address] }),
        )) as unknown as OptInStatusDto;

        if (!isMountedRef.current) {
          return false;
        }

        // If already opted in, return success
        if (optInResponse.ois[0]) {
          return true;
        }

        // Emit started event
        triggerAccountLinkingEvent(
          MetaMetricsEventName.RewardsAccountLinkingStarted,
          account,
        );

        try {
          // Link the account
          const results = (await dispatch(
            rewardsLinkAccountsToSubscriptionCandidate([account]),
          )) as unknown as { account: InternalAccount; success: boolean }[];

          if (!isMountedRef.current) {
            return false;
          }

          const result = results[0];
          if (result?.success) {
            triggerAccountLinkingEvent(
              MetaMetricsEventName.RewardsAccountLinkingCompleted,
              account,
            );
            dispatch(setRewardsAccountLinkedTimestamp(Date.now()));
            return true;
          }

          triggerAccountLinkingEvent(
            MetaMetricsEventName.RewardsAccountLinkingFailed,
            account,
          );

          setIsError(true);
          return false;
        } catch (err) {
          if (!isMountedRef.current) {
            return false;
          }

          triggerAccountLinkingEvent(
            MetaMetricsEventName.RewardsAccountLinkingFailed,
            account,
          );

          setIsError(true);
          return false;
        }
      } catch (err) {
        if (!isMountedRef.current) {
          return false;
        }

        setIsError(true);
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [triggerAccountLinkingEvent, dispatch],
  );

  return {
    linkAccountAddress,
    isLoading,
    isError,
  };
};
