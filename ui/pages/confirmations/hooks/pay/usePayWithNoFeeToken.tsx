import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isSubsidizedSource } from '../../utils/relay-fixed-spread';
import type { RelayFixedSpreadConfig } from '../../utils/relay-fixed-spread';
import { selectRelayFixedSpread } from '../../selectors/feature-flags';
import { NoFeeTag } from '../../components/UI/no-fee-tag';
import { type TokenTagRenderer } from '../../components/UI/asset';
import { type Asset } from '../../types/send';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { MUSD_TOKEN_ADDRESS } from '../../constants/musd';

/**
 * Monad mUSD → Monad mUSD needs no swap or bridge, so the fixed-spread flag
 * omits that same-token route. Depositing it still incurs no Relay fee.
 *
 * @param address - Token contract address.
 * @param chainId - Token chain ID.
 * @returns Whether the token is Monad mUSD.
 */
const isMonadMusd = (address: string, chainId: string) =>
  chainId.toLowerCase() === CHAIN_IDS.MONAD.toLowerCase() &&
  address.toLowerCase() === MUSD_TOKEN_ADDRESS.toLowerCase();

/**
 * Whether a payment token incurs no Relay fixed-spread fee for Money Account
 * deposits. True when it is a subsidised source in
 * `confirmations_relay_fixed_spread`, or when it is Monad mUSD itself.
 *
 * Shared by the Pay-with picker label and automatic token selection so both
 * agree on which balances are no-fee.
 *
 * @param relayFixedSpread - Parsed fixed-spread feature-flag config.
 * @param address - Token contract address.
 * @param chainId - Token chain ID.
 * @returns Whether the token is treated as no-fee.
 */
export function isNoFeePayToken(
  relayFixedSpread: RelayFixedSpreadConfig,
  address: string,
  chainId: string,
): boolean {
  if (!address || !chainId) {
    return false;
  }

  return (
    isMonadMusd(address, chainId) ||
    isSubsidizedSource(relayFixedSpread, {
      address,
      chainId: String(chainId),
    })
  );
}

/**
 * Identifies payment tokens that incur no Relay fixed-spread fee for
 * Money Account deposits. A token is no-fee when it is a subsidised source
 * in the `confirmations_relay_fixed_spread` remote feature flag, or when it
 * is Monad mUSD itself.
 */
export function usePayWithNoFeeToken(): {
  isNoFeeToken: (address: string, chainId: string) => boolean;
  renderNoFeeTag: TokenTagRenderer;
} {
  const relayFixedSpread = useSelector(selectRelayFixedSpread);

  const isNoFeeToken = useCallback(
    (address: string, chainId: string): boolean =>
      isNoFeePayToken(relayFixedSpread, address, chainId),
    [relayFixedSpread],
  );

  const renderNoFeeTag: TokenTagRenderer = useCallback(
    (token: Asset) => {
      if (!token.address || !token.chainId) {
        return null;
      }

      if (!isNoFeeToken(token.address, String(token.chainId))) {
        return null;
      }

      return <NoFeeTag />;
    },
    [isNoFeeToken],
  );

  return { isNoFeeToken, renderNoFeeTag };
}
