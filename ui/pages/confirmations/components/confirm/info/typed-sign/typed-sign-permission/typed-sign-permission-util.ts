import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  DAY,
  MINUTE,
  HOUR,
  WEEK,
  SECOND,
  FORTNIGHT,
  MONTH,
  YEAR,
} from '../../../../../../../../shared/constants/time';
import { selectNetworkConfigurationByChainId } from '../../../../../../../selectors';
import { getTokenByAccountAndAddressAndChainId } from '../../../../../../../selectors/assets';

/**
 * Formats a period duration in seconds to a human-readable string.
 * Converts common durations (daily, weekly) to readable labels, otherwise shows seconds.
 *
 * @param periodSeconds - The duration in seconds to format
 * @returns A formatted string representing the duration (e.g., "Daily", "Weekly", "3600 seconds")
 */
export const formatPeriodDuration = (periodSeconds: number) => {
  if (periodSeconds === 0) {
    throw new Error('Cannot format period duration of 0 seconds');
  }

  // multiply by 1000 to convert to milliseconds
  let periodMilliseconds = periodSeconds * SECOND;

  switch (periodMilliseconds) {
    case HOUR:
      return 'Hourly';
    case DAY:
      return 'Daily';
    case WEEK:
      return 'Weekly';
    case FORTNIGHT:
      return 'Bi-Weekly';
    case MONTH:
      return 'Monthly';
    case YEAR:
      return 'Yearly';
    default:
      break;
  }

  const periods: string[] = [];

  if (periodMilliseconds >= WEEK) {
    const weekCount = Math.floor(periodMilliseconds / WEEK);
    periods.push(`${weekCount} week${weekCount > 1 ? 's' : ''}`);
    periodMilliseconds %= WEEK;
  }

  if (periodMilliseconds >= DAY) {
    const dayCount = Math.floor(periodMilliseconds / DAY);
    periods.push(`${dayCount} day${dayCount > 1 ? 's' : ''}`);
    periodMilliseconds %= DAY;
  }

  if (periodMilliseconds >= HOUR) {
    const hourCount = Math.floor(periodMilliseconds / HOUR);
    periods.push(`${hourCount} hour${hourCount > 1 ? 's' : ''}`);
    periodMilliseconds %= HOUR;
  }

  if (periodMilliseconds >= MINUTE) {
    const minuteCount = Math.floor(periodMilliseconds / MINUTE);
    periods.push(`${minuteCount} minute${minuteCount > 1 ? 's' : ''}`);
    periodMilliseconds %= MINUTE;
  }

  if (periodMilliseconds > 0) {
    const secondsCount = Math.floor(periodMilliseconds / SECOND);
    periods.push(`${secondsCount} second${secondsCount > 1 ? 's' : ''}`);
  }

  const result = periods.reduce((acc, period, index) => {
    // only add 'and' for the final period part, and only if there's more than one period
    const isFirstPeriod = index === 0;
    const hasAnd = !isFirstPeriod && index === periods.length - 1;

    const separatorIfNeeded = hasAnd ? ' and ' : ', ';

    const separator = isFirstPeriod ? '' : separatorIfNeeded;

    return `${acc}${separator}${period}`;
  }, '');

  return `Every ${result}`;
};

/**
 * Retrieves ERC-20 token details (label and decimals) for a given token address and chain ID.
 *
 * Uses the Redux selector to fetch the token object from state. The label is determined by
 * preferring the token's name, falling back to its symbol if the name is not available.
 *
 * @param params - An object containing:
 * @param params.tokenAddress - The hexadecimal address of the ERC-20 token.
 * @param params.chainId - The hexadecimal chain ID where the token resides.
 * @returns the token details
 */
export const useErc20TokenDetails = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: Hex;
}): {
  label: string | undefined;
  decimals: number | undefined;
} => {
  const token = useSelector((state) =>
    getTokenByAccountAndAddressAndChainId(
      state,
      undefined, // Defaults to the selected account
      tokenAddress,
      chainId as Hex,
    ),
  );

  return {
    label: token?.name || token?.symbol,
    decimals: token?.decimals,
  };
};

/**
 * Retrieves the native token label (symbol or name) for a given chain ID.
 *
 * Uses the Redux selector to fetch the network configuration from state.
 *
 * @param chainId - The hexadecimal chain ID.
 * @returns The native token label (symbol or name), or undefined if not found.
 */
export const useNativeTokenLabel = (chainId: Hex): string => {
  const config = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  return config?.nativeCurrency ?? 'NATIVE';
};
