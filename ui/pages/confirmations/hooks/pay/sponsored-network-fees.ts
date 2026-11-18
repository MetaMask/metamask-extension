import { BigNumber } from 'bignumber.js';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';

export type SponsoredNetworkFeeFlags = {
  /**
   * Parent transaction has `isGasFeeSponsored` for a supported money/mUSD type.
   * Target-network estimates are MetaMask-sponsored in this case.
   */
  isTargetNetworkSponsored: boolean;
  /**
   * Source-network gas is MetaMask-sponsored. The pay controller only zeroes
   * source gas when the pay-token chain matches the parent transaction chain;
   * cross-chain deposits keep a user-paid `fees.sourceNetwork`.
   */
  isSourceNetworkSponsored: boolean;
};

/**
 * User-paid portion of Transaction Pay network fees (source + target), after
 * removing legs MetaMask sponsors.
 *
 * @param fees - Pay fee totals.
 * @param flags - Which network legs are sponsored.
 * @param flags.isSourceNetworkSponsored
 * @param flags.isTargetNetworkSponsored
 * @returns USD amount the user pays for network gas.
 */
export function getUserPaidNetworkFeeUsd(
  fees: TransactionPayTotals['fees'] | undefined,
  {
    isSourceNetworkSponsored,
    isTargetNetworkSponsored,
  }: SponsoredNetworkFeeFlags,
): BigNumber {
  let networkFee = new BigNumber(0);

  if (!isSourceNetworkSponsored) {
    networkFee = networkFee.plus(fees?.sourceNetwork?.estimate?.usd ?? '0');
  }

  if (!isTargetNetworkSponsored) {
    networkFee = networkFee.plus(fees?.targetNetwork?.usd ?? '0');
  }

  return networkFee;
}
