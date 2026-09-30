import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import {
  isSubsidizedRoute,
  isSubsidizedSource,
} from '../../utils/relay-fixed-spread';
import type { RelayFixedSpreadConfig } from '../../utils/relay-fixed-spread';
import { selectRelayFixedSpread } from '../../selectors/feature-flags';
import { NoFeeTag } from '../../components/UI/no-fee-tag';
import { type TokenTagRenderer } from '../../components/UI/asset';
import { type Asset } from '../../types/send';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { MUSD_TOKEN_ADDRESS } from '../../constants/musd';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

/** The Money Account vault token; withdrawals always convert FROM this. */
const MONAD_MUSD_SOURCE = {
  address: MUSD_TOKEN_ADDRESS,
  chainId: CHAIN_IDS.MONAD,
};

/**
 * Monad mUSD → Monad mUSD needs no swap or bridge, so the fixed-spread flag
 * omits that same-token route. Depositing or withdrawing it still incurs no
 * Relay fee.
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
 * Identifies tokens that incur no Relay fixed-spread fee.
 *
 * For deposits the picker token is the source, so a token is no-fee when it
 * is a subsidised source (or Monad mUSD itself). For a Money Account
 * withdrawal the picker token is the destination and the source is always
 * Monad mUSD, so the match is directional: a subsidised route FROM Monad
 * mUSD INTO the token, or Monad mUSD itself.
 */
export function usePayWithNoFeeToken(): {
  isNoFeeToken: (address: string, chainId: string) => boolean;
  renderNoFeeTag: TokenTagRenderer;
} {
  const relayFixedSpread = useSelector(selectRelayFixedSpread);
  const transactionMeta = useTransactionMetadataRequestOptional();
  const isMoneyWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);

  const isNoFeeToken = useCallback(
    (address: string, chainId: string): boolean => {
      if (isMoneyWithdraw) {
        if (!address || !chainId) {
          return false;
        }

        return (
          isMonadMusd(address, chainId) ||
          isSubsidizedRoute(relayFixedSpread, MONAD_MUSD_SOURCE, {
            address,
            chainId: String(chainId),
          })
        );
      }

      return isNoFeePayToken(relayFixedSpread, address, chainId);
    },
    [isMoneyWithdraw, relayFixedSpread],
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
