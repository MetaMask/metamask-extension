import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@metamask/react-data-query';
import type {
  InterestOptions,
  InterestResponse,
  InterestWindow,
} from '@metamask/money-account-api-data-service';
import { MoneyAccountApiDataServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { selectMoneyAccountVaultConfig } from '../../selectors/money/money-account-feature-flags';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';

const LAST_30_DAYS_WINDOW: InterestWindow = '30d';
const SINCE_INCEPTION_WINDOW: InterestWindow = 'since_inception';

export type UseMoneyAccountInterestOptions = {
  enabled?: boolean;
};

export type UseMoneyAccountInterestResult = {
  last30DaysQuery: UseQueryResult<InterestResponse>;
  sinceInceptionQuery: UseQueryResult<InterestResponse>;
};

/**
 * Fetches realized Money Account interest for the Earnings section.
 *
 * @param options - Query controls.
 * @param options.enabled - Whether both interest queries may run.
 * @returns The 30-day and since-inception interest queries.
 */
export function useMoneyAccountInterest({
  enabled = true,
}: UseMoneyAccountInterestOptions = {}): UseMoneyAccountInterestResult {
  const { primaryMoneyAccount } = useMoneyAccountInfo();
  const vaultConfig = useSelector(selectMoneyAccountVaultConfig);
  const address = primaryMoneyAccount?.address;
  const vaultAddress = vaultConfig?.boringVault;
  const chainId = vaultConfig ? Number(vaultConfig.chainId) : undefined;
  const hasValidInputs = Boolean(
    address &&
    vaultAddress &&
    chainId !== undefined &&
    Number.isSafeInteger(chainId),
  );
  const isEnabled = enabled && hasValidInputs;

  const commonOptions = useMemo<Omit<InterestOptions, 'window'> | undefined>(
    () =>
      vaultAddress && chainId !== undefined && Number.isSafeInteger(chainId)
        ? { vaultAddress, chainId }
        : undefined,
    [chainId, vaultAddress],
  );

  const last30DaysQuery = useQuery<InterestResponse>({
    queryKey: [
      MoneyAccountApiDataServiceQueryKeys.FETCH_INTEREST,
      address ?? '',
      {
        ...commonOptions,
        window: LAST_30_DAYS_WINDOW,
      },
    ],
    enabled: isEnabled,
  });

  const sinceInceptionQuery = useQuery<InterestResponse>({
    queryKey: [
      MoneyAccountApiDataServiceQueryKeys.FETCH_INTEREST,
      address ?? '',
      {
        ...commonOptions,
        window: SINCE_INCEPTION_WINDOW,
      },
    ],
    enabled: isEnabled,
  });

  return { last30DaysQuery, sinceInceptionQuery };
}

export default useMoneyAccountInterest;
