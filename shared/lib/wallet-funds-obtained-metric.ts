import {
  MultichainBalancesControllerState,
  TokenBalancesControllerState,
} from '@metamask/assets-controllers';
import {
  toCaipChainId,
  KnownCaipNamespace,
  hexToNumber,
} from '@metamask/utils';
import { MetaMetricsEventName } from '../constants/metametrics';

/**
 * Predefined buckets for categorizing USD amounts in analytics
 */
export const AmountBucket = {
  Low: '<$100',
  Medium: '$100-1000',
  High: '>$1000',
} as const;

/**
 * Categorizes a USD amount into predefined buckets for analytics purposes
 *
 * @param amount - The USD amount to categorize
 * @returns The bucket category that the amount falls into
 */
export const getAmountBucket = (amount: string): string => {
  const numAmount = Number(amount);
  if (numAmount < 100) {
    return AmountBucket.Low;
  }
  if (numAmount <= 1000) {
    return AmountBucket.Medium;
  }
  return AmountBucket.High;
};

/**
 * Gets an ISO string representing the current day at midnight (00:00:00.000)
 * in the local timezone
 *
 * @returns ISO formatted date string for midnight of the current day
 * @example
 * Returns something like "2025-10-16T07:00:00.000Z"
 */
export const getMidnightISOTimestamp = (): string => {
  const timestamp = new Date();
  timestamp.setHours(0, 0, 0, 0);
  return timestamp.toISOString();
};

/**
 * Checks if token balances (EVM) have any non-zero values
 *
 * @param tokenBalances - Object containing token balances state
 * @returns true if any non-zero balance is found
 */
export const hasNonZeroTokenBalance = (
  tokenBalances: TokenBalancesControllerState['tokenBalances'] = {},
): boolean => {
  for (const accountBalances of Object.values(tokenBalances)) {
    for (const chainBalances of Object.values(accountBalances || {})) {
      for (const balance of Object.values(chainBalances || {})) {
        if (hexToNumber(balance || '0x0') > 0) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * Checks if multichain balances (non-EVM) have any non-zero values
 *
 * @param multichainBalances - Object containing multichain balances state
 * @returns true if any non-zero balance is found
 */
export const hasNonZeroMultichainBalance = (
  multichainBalances: MultichainBalancesControllerState['balances'] = {},
): boolean => {
  for (const accountBalances of Object.values(multichainBalances)) {
    for (const chainBalances of Object.values(accountBalances || {})) {
      if (chainBalances?.amount && chainBalances.amount !== '0') {
        return true;
      }
    }
  }
  return false;
};

/**
 * Creates the event properties object for the WalletFundsObtained metric event
 *
 * @param params
 * @param params.chainId - The chain ID where funds were obtained
 * @param params.amountUsd - The USD value of the funds received
 * @returns Complete event object with event name, timestamp, and properties
 */
export const getWalletFundsObtainedEventProperties = ({
  chainId,
  amountUsd,
}: {
  chainId: number;
  amountUsd: string;
}) => {
  return {
    event: MetaMetricsEventName.WalletFundsObtained,
    timestamp: getMidnightISOTimestamp(),
    properties: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id_caip: toCaipChainId(
        KnownCaipNamespace.Eip155,
        chainId.toString(),
      ),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      funding_amount_usd: getAmountBucket(amountUsd),
    },
  };
};
