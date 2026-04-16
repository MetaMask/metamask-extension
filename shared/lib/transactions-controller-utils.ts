import BigNumber from 'bignumber.js';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';

import { EtherDenomination } from '../constants/common';
import { Numeric } from './Numeric';
import { isSwapsDefaultTokenSymbol } from './swaps.utils';

export const TOKEN_TRANSFER_LOG_TOPIC_HASH =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const TRANSACTION_NO_CONTRACT_ERROR_KEY = 'transactionErrorNoContract';

export const TRANSFER_SINFLE_LOG_TOPIC_HASH =
  '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';

export const TEN_SECONDS_IN_MILLISECONDS = 10_000;

export function calcGasTotal(
  gasLimit: string | number = '0',
  gasPrice: string | number = '0',
): string {
  return new Numeric(gasLimit, 16).times(new Numeric(gasPrice, 16)).toString();
}

/**
 * Given a number and specified precision, returns that number in base 10 with a maximum of precision
 * significant digits, but without any trailing zeros after the decimal point To be used when wishing
 * to display only as much digits to the user as necessary
 *
 * @param n - The number to format
 * @param precision - The maximum number of significant digits in the return value
 * @returns The number in decimal form, with <= precision significant digits and no decimal trailing zeros
 */
export function toPrecisionWithoutTrailingZeros(
  n: string | number | BigNumber,
  precision: number,
): string {
  return new BigNumber(n as string | number)
    .toPrecision(precision)
    .replace(/(\.[0-9]*[1-9])0*|(\.0*)/u, '$1');
}

/**
 * @param value - The token amount value
 * @param decimals - The number of decimals for the token
 * @returns The token amount as a BigNumber
 */
export function calcTokenAmount(
  value: string | number | BigNumber,
  decimals: number | undefined,
): BigNumber {
  const divisor = new BigNumber(10).pow(decimals ?? 0);
  return new BigNumber(String(value)).div(divisor);
}

export function getSwapsTokensReceivedFromTxMeta(
  tokenSymbol?: string,
  txMeta?: TransactionMeta | null,
  tokenAddress?: string | null,
  senderAddress?: string,
  tokenDecimals?: number | string,
  approvalTxMeta?: TransactionMeta | null,
  chainId?: string | number,
  precision: number | null = 6,
): string | null {
  const accountAddress = txMeta?.swapAndSendRecipient ?? senderAddress;

  const txReceipt = txMeta?.txReceipt;
  // The `type` property is not in the official TransactionReceipt type but is
  // set by MetaMask to reflect the EIP-2718 envelope type of the transaction.
  const txReceiptType = (txReceipt as { type?: string } | undefined)?.type;
  const networkAndAccountSupports1559 =
    txReceiptType === TransactionEnvelopeType.feeMarket;

  const isDefaultSwapsToken =
    tokenSymbol !== undefined &&
    chainId !== undefined &&
    (typeof chainId === 'number'
      ? chainId !== 0 &&
        !Number.isNaN(chainId) &&
        isSwapsDefaultTokenSymbol(tokenSymbol, `0x${chainId.toString(16)}`)
      : isSwapsDefaultTokenSymbol(tokenSymbol, chainId));

  if (isDefaultSwapsToken) {
    if (
      !txReceipt ||
      !txMeta ||
      !txMeta.postTxBalance ||
      !txMeta.preTxBalance
    ) {
      return null;
    }

    if (txMeta.swapMetaData && txMeta.preTxBalance === txMeta.postTxBalance) {
      // If preTxBalance and postTxBalance are equal, postTxBalance hasn't been updated on time
      // because of the RPC provider delay, so we return an estimated receiving amount instead.
      return txMeta.swapMetaData.token_to_amount as string;
    }

    let approvalTxGasCost = new Numeric('0x0', 16);
    if (approvalTxMeta && approvalTxMeta.txReceipt) {
      approvalTxGasCost = new Numeric(
        calcGasTotal(
          approvalTxMeta.txReceipt.gasUsed,
          networkAndAccountSupports1559
            ? approvalTxMeta.txReceipt.effectiveGasPrice // Base fee + priority fee.
            : approvalTxMeta.txParams?.gasPrice,
        ),
        16,
      );
    }

    const gasCost = calcGasTotal(
      txReceipt.gasUsed,
      networkAndAccountSupports1559
        ? txReceipt.effectiveGasPrice
        : txMeta.txParams?.gasPrice,
    );
    const totalGasCost = new Numeric(gasCost, 16).add(approvalTxGasCost);

    const preTxBalanceLessGasCost = new Numeric(txMeta.preTxBalance, 16).minus(
      totalGasCost,
    );

    const ethReceived = new Numeric(
      txMeta.postTxBalance,
      16,
      EtherDenomination.WEI,
    )
      .minus(preTxBalanceLessGasCost)
      .toDenomination(EtherDenomination.ETH)
      .toBase(10);

    const formatted =
      precision === null ? ethReceived : ethReceived.round(precision);
    return formatted.value.toFixed();
  }
  const txReceiptLogs = txReceipt?.logs;
  if (txReceiptLogs && txReceipt?.status !== '0x0') {
    // The `Log.topics` type in @metamask/transaction-controller is `string`
    // but in practice it is an array of hex strings per the Ethereum spec.
    type LogWithTopicsArray = {
      topics?: string[];
      address?: string;
      data?: string;
    };
    const tokenTransferLog = (txReceiptLogs as LogWithTopicsArray[]).find(
      (txReceiptLog) => {
        const isTokenTransfer =
          txReceiptLog.topics &&
          txReceiptLog.topics[0] === TOKEN_TRANSFER_LOG_TOPIC_HASH;
        const isTransferFromGivenToken =
          txReceiptLog.address?.toLowerCase() === tokenAddress?.toLowerCase();
        const isTransferFromGivenAddress =
          txReceiptLog.topics &&
          txReceiptLog.topics[2] &&
          (txReceiptLog.topics[2] === accountAddress ||
            txReceiptLog.topics[2].match(accountAddress?.slice(2) ?? ''));
        return (
          isTokenTransfer &&
          isTransferFromGivenToken &&
          isTransferFromGivenAddress
        );
      },
    );

    if (tokenTransferLog) {
      const tokenAmount = calcTokenAmount(
        tokenTransferLog.data ?? '0',
        tokenDecimals as number,
      );
      return precision === null
        ? tokenAmount.toFixed()
        : toPrecisionWithoutTrailingZeros(tokenAmount, precision);
    }
    return '';
  }
  return null;
}

export const TRANSACTION_ENVELOPE_TYPE_NAMES = {
  FEE_MARKET: 'fee-market',
  LEGACY: 'legacy',
};
