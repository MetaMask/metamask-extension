import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  MERKL_CLAIM_CHAIN_ID,
  MERKL_DISTRIBUTOR_ADDRESS,
  MERKL_CLAIM_METHOD_ID,
  MUSD_TOKEN_ADDRESS,
} from '../constants';
import { decodeMerklClaimParams } from '../../../../hooks/musd/transaction-amount-utils';

/**
 * Whether a transaction is an mUSD Merkl claim on Linea for UI/analytics purposes.
 *
 * Matches distributor `to`, `claim(...)` selector, Linea chain, and mUSD as the
 * reward token in calldata — stricter than activity `resolveTransactionType`
 * (which only checks `to` + method id) by requiring Linea and mUSD token.
 *
 * @param tx - The transaction metadata
 * @returns True when the tx is a qualifying mUSD Merkl claim on Linea
 */
export function isMerklClaimTransaction(tx: TransactionMeta): boolean {
  const to = tx.txParams?.to?.toLowerCase();
  if (to !== MERKL_DISTRIBUTOR_ADDRESS.toLowerCase()) {
    return false;
  }

  const data = tx.txParams?.data;
  if (
    !(data?.toLowerCase() ?? '').startsWith(MERKL_CLAIM_METHOD_ID.toLowerCase())
  ) {
    return false;
  }

  const chainId = tx.chainId?.toLowerCase();
  if (!chainId || chainId !== MERKL_CLAIM_CHAIN_ID.toLowerCase()) {
    return false;
  }

  const params = decodeMerklClaimParams(data);
  if (!params) {
    return false;
  }

  return params.tokenAddress.toLowerCase() === MUSD_TOKEN_ADDRESS.toLowerCase();
}
