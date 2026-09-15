import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { EtherDenomination } from '../../../../shared/constants/common';
import { sumHexes } from '../../../../shared/lib/conversion.utils';
import { Numeric } from '../../../../shared/lib/Numeric';
import { isTransactionGasFeeSponsored } from '../../../../shared/lib/transaction-gas-fee.utils';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';

function parseFiniteNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Gets the combined network and provider fee recorded by MetaMask Pay.
 *
 * @param tx - Transaction metadata to read.
 * @returns The combined fee in USD, or undefined when no valid fee exists.
 */
export function getMoneyPayFeeUsd(tx: TransactionMeta): number | undefined {
  const networkFee = parseFiniteNumber(tx.metamaskPay?.networkFeeFiat);
  const bridgeFee = parseFiniteNumber(tx.metamaskPay?.bridgeFeeFiat);

  return networkFee === undefined && bridgeFee === undefined
    ? undefined
    : (networkFee ?? 0) + (bridgeFee ?? 0);
}

/**
 * Calculates a transaction's receipt gas cost in USD.
 *
 * @param tx - Transaction metadata containing gas data.
 * @param nativeUsdRate - USD exchange rate for the chain's native token.
 * @returns The gas cost in USD, or undefined when it cannot be calculated.
 */
export function getMoneyGasFeeUsd(
  tx: TransactionMeta,
  nativeUsdRate: number | undefined,
): number | undefined {
  if (
    nativeUsdRate === undefined ||
    !Number.isFinite(nativeUsdRate) ||
    nativeUsdRate <= 0
  ) {
    return undefined;
  }

  const gasUsed = tx.txReceipt?.gasUsed;
  const gasPrice = tx.txReceipt?.effectiveGasPrice ?? tx.txParams?.gasPrice;
  if (typeof gasUsed !== 'string' || !gasPrice) {
    return undefined;
  }

  let hexGasTotal = getHexGasTotal({
    gasLimit: gasUsed,
    gasPrice,
  });
  const layer1GasFee = tx.txReceipt?.l1Fee ?? tx.layer1GasFee;
  if (layer1GasFee && layer1GasFee !== '0x0') {
    hexGasTotal = sumHexes(hexGasTotal, layer1GasFee);
  }

  if (hexGasTotal === '0x0') {
    return undefined;
  }

  const feeUsd = new Numeric(hexGasTotal, 16, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.ETH)
    .toBase(10)
    .applyConversionRate(nativeUsdRate)
    .toNumber();

  return Number.isFinite(feeUsd) ? feeUsd : undefined;
}

/**
 * Whether the Money transaction's network fee should be presented as paid by
 * MetaMask. Money accounts are MetaMask-created smart accounts, so the
 * hardware-wallet gate in {@link isTransactionGasFeeSponsored} is left at its
 * default (`false`).
 *
 * @param tx - Transaction metadata to inspect.
 * @returns Whether the network fee is MetaMask-sponsored for display.
 */
export function isMoneyNetworkFeePaidByMetaMask(tx: TransactionMeta): boolean {
  return Boolean(isTransactionGasFeeSponsored({ transaction: tx }));
}

/**
 * Gets a Money transaction fee, preferring the MetaMask Pay quote and falling
 * back to the confirmed receipt gas cost.
 *
 * When the network fee is MetaMask-sponsored, receipt gas is never billed to
 * the user — only any recorded provider (bridge) fee is returned.
 *
 * @param tx - Transaction metadata to inspect.
 * @param nativeUsdRate - USD exchange rate for the chain's native token.
 * @returns The transaction fee in USD, or undefined when unavailable.
 */
export function getMoneyTransactionFeeUsd(
  tx: TransactionMeta,
  nativeUsdRate: number | undefined,
): number | undefined {
  const networkFee = parseFiniteNumber(tx.metamaskPay?.networkFeeFiat);
  const bridgeFee = parseFiniteNumber(tx.metamaskPay?.bridgeFeeFiat);
  const isNetworkFeeSponsored = isMoneyNetworkFeePaidByMetaMask(tx);

  if (networkFee !== undefined) {
    // Sponsored network gas must not inflate the fee the user is shown.
    return (isNetworkFeeSponsored ? 0 : networkFee) + (bridgeFee ?? 0);
  }

  if (isNetworkFeeSponsored) {
    return bridgeFee ?? 0;
  }

  const gasFee = getMoneyGasFeeUsd(tx, nativeUsdRate);
  if (gasFee !== undefined) {
    return gasFee + (bridgeFee ?? 0);
  }

  return bridgeFee;
}

/**
 * Gets the total recorded by MetaMask Pay for a Money transaction.
 *
 * When the network fee is MetaMask-sponsored, any recorded `networkFeeFiat`
 * embedded in `totalFiat` is subtracted so the Total row matches the fee the
 * user actually pays.
 *
 * @param tx - Transaction metadata to inspect.
 * @returns The transaction total in USD, or undefined when unavailable.
 */
export function getMoneyTransactionTotalUsd(
  tx: TransactionMeta,
): number | undefined {
  const isWithdraw = hasTransactionType(tx, [
    TransactionType.moneyAccountWithdraw,
  ]);
  const value = isWithdraw
    ? tx.metamaskPay?.targetFiat
    : tx.metamaskPay?.totalFiat;

  const total = parseFiniteNumber(value);
  if (total === undefined) {
    return undefined;
  }

  // Withdrawals use targetFiat (destination amount), which does not embed fees.
  if (isWithdraw || !isMoneyNetworkFeePaidByMetaMask(tx)) {
    return total;
  }

  const networkFee = parseFiniteNumber(tx.metamaskPay?.networkFeeFiat) ?? 0;
  return Math.max(0, total - networkFee);
}
