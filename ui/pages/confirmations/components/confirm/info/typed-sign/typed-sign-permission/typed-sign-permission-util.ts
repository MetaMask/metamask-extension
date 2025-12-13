'use no memo';

import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  DAY,
  HOUR,
  WEEK,
  SECOND,
  FORTNIGHT,
  MONTH,
  YEAR,
} from '../../../../../../../../shared/constants/time';
import { selectNetworkConfigurationByChainId } from '../../../../../../../selectors';
import { getTokenByAccountAndAddressAndChainId } from '../../../../../../../selectors/assets';
import type { useI18nContext } from '../../../../../../../hooks/useI18nContext';

/**
 * Formats a period duration in seconds to a human-readable string.
 * Converts common durations (daily, weekly) to readable labels, otherwise shows seconds.
 *
 * @param i18nContext
 * @param periodSeconds - The duration in seconds to format
 * @returns A formatted string representing the duration (e.g., "Daily", "Weekly", "3600 seconds")
 */
export const formatPeriodDuration = (
  i18nContext: ReturnType<typeof useI18nContext>,
  periodSeconds: number,
) => {
  if (periodSeconds === 0) {
    throw new Error('Cannot format period duration of 0 seconds');
  }

  if (periodSeconds < 0) {
    throw new Error('Cannot format negative period duration');
  }

  // multiply by 1000 to convert to milliseconds
  const periodMilliseconds = periodSeconds * SECOND;

  switch (periodMilliseconds) {
    case HOUR:
      return i18nContext('confirmFieldPeriodDurationHourly');
    case DAY:
      return i18nContext('confirmFieldPeriodDurationDaily');
    case WEEK:
      return i18nContext('confirmFieldPeriodDurationWeekly');
    case FORTNIGHT:
      return i18nContext('confirmFieldPeriodDurationBiWeekly');
    case MONTH:
      return i18nContext('confirmFieldPeriodDurationMonthly');
    case YEAR:
      return i18nContext('confirmFieldPeriodDurationYearly');
    default:
      // this should never happen, but we return the period in seconds as a fallback
      return `${periodSeconds} ${i18nContext('confirmFieldPeriodDurationSeconds')}`;
  }
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

/**
 * Returns the localized description for a given permission type.
 *
 * @param i18nContext - i18n function
 * @param permissionType - decoded permission type identifier
 * @returns Localized description string
 */
export const getPermissionDescription = (
  i18nContext: ReturnType<typeof useI18nContext>,
  permissionType?: string,
): string => {
  switch (permissionType) {
    case 'erc20-token-revocation':
      return i18nContext('confirmTitleDescERC20Revocation');
    default:
      return i18nContext('confirmTitleDescPermission');
  }
};
