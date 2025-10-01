import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  DAY,
  MINUTE,
  HOUR,
  WEEK,
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
  let periodMilliseconds = periodSeconds * 1000;

  if (periodMilliseconds === WEEK) {
    return 'Every week';
  }

  if (periodMilliseconds === DAY) {
    return 'Every day';
  }

  const periods: string[] = [];

  if (periodMilliseconds > WEEK) {
    const weekCount = Math.floor(periodMilliseconds / WEEK);
    periods.push(`${weekCount} week${weekCount > 1 ? 's' : ''}`);
    periodMilliseconds %= WEEK;
  }

  if (periodMilliseconds > DAY) {
    const dayCount = Math.floor(periodMilliseconds / DAY);
    periods.push(`${dayCount} day${dayCount > 1 ? 's' : ''}`);
    periodMilliseconds %= DAY;
  }

  if (periodMilliseconds > HOUR) {
    const hourCount = Math.floor(periodMilliseconds / HOUR);
    periods.push(`${hourCount} hour${hourCount > 1 ? 's' : ''}`);
    periodMilliseconds %= HOUR;
  }

  if (periodMilliseconds > MINUTE) {
    const minuteCount = Math.floor(periodMilliseconds / MINUTE);
    periods.push(`${minuteCount} minute${minuteCount > 1 ? 's' : ''}`);
    periodMilliseconds %= MINUTE;
  }

  if (periodMilliseconds > 0) {
    const secondsCount = Math.floor(periodMilliseconds / 1000);
    periods.push(`${secondsCount} second${secondsCount > 1 ? 's' : ''}`);
    periodMilliseconds %= 1000;
  }

  const result = periods.reduce((acc, period, index) => {
    // only add 'and' for the final period part, and only if there's more than one period
    const isFirstPeriod = index === 0;
    const hasAnd = !isFirstPeriod && index === periods.length - 1;

    const separatorIfNeeded = hasAnd ? ' and ' : ', ';

    const separator = isFirstPeriod ? '' : separatorIfNeeded;

    return `${acc}${separator} ${period}`;
  }, '');

  return `Every ${result}`;
};

export const getErc20TokenDetails = ({
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

export const getNativeTokenLabel = (chainId: Hex): string => {
  const { nativeCurrency: symbol, name } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  return symbol || name;
};
