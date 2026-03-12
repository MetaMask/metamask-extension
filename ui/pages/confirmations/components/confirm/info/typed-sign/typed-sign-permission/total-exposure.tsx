import React from 'react';

import { BigNumber } from 'bignumber.js';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
} from '@metamask/design-system-react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import Name from '../../../../../../../components/app/name';
import { NativeAmountRow } from './native-amount-row';
import { TokenAmountRow } from './token-amount-row';

const MAX_UINT256 =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * Parses an amount string (hex or decimal) to BigNumber.
 * When value is defined (Hex), returns BigNumber; when value is undefined (or null), returns null.
 *
 * @param value - Hex string (0x-prefix) or decimal string; undefined/null treated as absent
 * @returns BigNumber when value is Hex, or null when value is undefined or null
 */
function toAmountBn(value: Hex): BigNumber;
function toAmountBn(value: Hex | undefined | null): BigNumber | null;
function toAmountBn(value: Hex | undefined | null): BigNumber | null {
  if (value === undefined || value === null) {
    return null;
  }
  return value.startsWith('0x')
    ? new BigNumber(value, 16)
    : new BigNumber(value);
}

/**
 * Computes total exposure for a stream permission.
 *
 * Formula (aligned with gator-permissions-snap deriveExposureForStreamingPermission):
 * - When expiry is set: exposureAtExpiry = (initialAmount ?? 0) + amountPerSecond * max(0, expiry - startTime)
 * - When both maxAmount and exposureAtExpiry exist: total = min(maxAmount, exposureAtExpiry)
 * - Otherwise: total = maxAmount ?? exposureAtExpiry ?? null
 * - Special case: maxAmount === MAX_UINT256 is treated as unlimited (returns null).
 *
 * @param params - Parameters required to compute total exposure (amounts as Hex strings)
 * @param params.initialAmount
 * @param params.maxAmount
 * @param params.amountPerSecond
 * @param params.startTime
 * @param params.expiry
 * @returns BigNumber for the total exposure, or null if unlimited
 */
export function computeTotalExposure(params: {
  initialAmount?: Hex | null | undefined;
  maxAmount?: Hex | null | undefined;
  amountPerSecond: Hex;
  startTime: number;
  expiry: number | null;
}): BigNumber | null {
  const { initialAmount, maxAmount, amountPerSecond, startTime, expiry } =
    params;

  let exposureAtExpiry: BigNumber | null = null;
  if (expiry !== null) {
    const elapsedSeconds = expiry - startTime;
    const initial = initialAmount
      ? toAmountBn(initialAmount)
      : new BigNumber(0);
    const rateBn = toAmountBn(amountPerSecond);
    const streamed =
      elapsedSeconds > 0 && rateBn
        ? rateBn.times(elapsedSeconds)
        : new BigNumber(0);
    exposureAtExpiry = initial.plus(streamed);
  }

  // max amount is unlimited
  if (maxAmount === MAX_UINT256) {
    return null;
  }

  const maxAmountBn = toAmountBn(maxAmount);

  if (exposureAtExpiry !== null && maxAmountBn !== null) {
    return BigNumber.min(maxAmountBn, exposureAtExpiry);
  }
  return maxAmountBn ?? exposureAtExpiry ?? null;
}

/** Base stream params required to compute total exposure. Amounts are hex or decimal strings. */
export type TotalExposureStreamParams = {
  /** Initial amount (hex or decimal string). */
  initialAmount?: Hex | null | undefined;
  /** Max amount cap (hex or decimal string). */
  maxAmount?: Hex | null | undefined;
  /** Stream rate per second (hex or decimal string). */
  amountPerSecond: Hex;
  /** Stream start time (Unix seconds). */
  startTime: number;
  /** Expiry time (Unix seconds), or null if no expiry. */
  expiry: number | null;
};

/** Props when displaying total exposure for an ERC20 token. */
export type TotalExposureErc20Props = TotalExposureStreamParams & {
  variant: 'erc20';
  /** Token contract address (for symbol display). */
  tokenAddress: Hex;
  /** Chain ID for the token. */
  chainId: Hex;
  /** Token decimals (undefined while loading). */
  decimals: number | undefined;
};

/** Props when displaying total exposure for a native token. */
export type TotalExposureNativeProps = TotalExposureStreamParams & {
  variant: 'native';
  /** Native token symbol (e.g. ETH). */
  symbol: string;
  /** Token decimals. */
  decimals: number;
  /** Optional network/token image URL. */
  imageUrl?: string;
};

/**
 * Props for the TotalExposure component.
 * Use variant 'erc20' for ERC20 streams, 'native' for native token streams.
 */
export type TotalExposureProps =
  | TotalExposureErc20Props
  | TotalExposureNativeProps;

/**
 * Component for displaying total exposure for a stream permission.
 * Shows the computed total (min of max amount and exposure at expiry) when bounded,
 * or "Unlimited" when neither max amount nor expiry is set.
 * Supports ERC20 (token address + chainId) and native (symbol + imageUrl) display.
 *
 * @param props - The component props (stream params + variant-specific display props)
 * @returns JSX element containing the total exposure row
 */
export const TotalExposure: React.FC<TotalExposureProps> = (props) => {
  const t = useI18nContext();
  const { initialAmount, maxAmount, amountPerSecond, startTime, expiry } =
    props;

  const totalExposure = computeTotalExposure({
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    expiry,
  });

  if (totalExposure === null) {
    if (props.variant === 'erc20') {
      return (
        <ConfirmInfoRow label={t('confirmFieldTotalExposure')}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            {t('unlimited')}
            <Name
              value={props.tokenAddress}
              type={NameType.ETHEREUM_ADDRESS}
              preferContractSymbol
              variation={props.chainId}
            />
          </Box>
        </ConfirmInfoRow>
      );
    }

    return (
      <ConfirmInfoRow label={t('confirmFieldTotalExposure')}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          alignItems={BoxAlignItems.Center}
        >
          {t('unlimited')}
          <Text>{props.symbol}</Text>
        </Box>
      </ConfirmInfoRow>
    );
  }

  if (props.variant === 'erc20') {
    return (
      <TokenAmountRow
        label={t('confirmFieldTotalExposure')}
        value={totalExposure}
        decimals={props.decimals}
        tokenAddress={props.tokenAddress}
        chainId={props.chainId}
      />
    );
  }
  return (
    <NativeAmountRow
      label={t('confirmFieldTotalExposure')}
      value={totalExposure}
      symbol={props.symbol}
      decimals={props.decimals}
      imageUrl={props.imageUrl}
    />
  );
};
