import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isSubsidizedSource } from '../../utils/relay-fixed-spread';
import { selectRelayFixedSpread } from '../../selectors/feature-flags';
import { NoFeeTag } from '../../components/UI/no-fee-tag';
import { type TokenTagRenderer } from '../../components/UI/asset';
import { type Asset } from '../../types/send';

/**
 * Identifies payment tokens that incur no Relay fixed-spread fee for
 * Money Account deposits. A token is no-fee when it is a subsidised source
 * in the `confirmations_relay_fixed_spread` remote feature flag.
 */
export function usePayWithNoFeeToken(): {
  isNoFeeToken: (address: string, chainId: string) => boolean;
  renderNoFeeTag: TokenTagRenderer;
} {
  const relayFixedSpread = useSelector(selectRelayFixedSpread);

  const isNoFeeToken = useCallback(
    (address: string, chainId: string): boolean => {
      if (!address || !chainId) {
        return false;
      }

      return isSubsidizedSource(relayFixedSpread, {
        address,
        chainId: String(chainId),
      });
    },
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
