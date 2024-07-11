import BigNumber from 'bignumber.js';
import { MethodRegistry } from 'eth-method-registry';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';

import { EtherDenomination } from '../constants/common';
import { Numeric } from '../modules/Numeric';
import { isSwapsDefaultTokenSymbol } from '../modules/swaps.utils';
import { getMethodFrom4Byte } from './four-byte';

export const TOKEN_TRANSFER_LOG_TOPIC_HASH =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const TRANSACTION_NO_CONTRACT_ERROR_KEY = 'transactionErrorNoContract';

export const TRANSFER_SINFLE_LOG_TOPIC_HASH =
  '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';

export const TEN_SECONDS_IN_MILLISECONDS = 10_000;

export function calcGasTotal(gasLimit = '0', gasPrice = '0') {
  return new Numeric(gasLimit, 16).times(new Numeric(gasPrice, 16)).toString();
}

/**
 * Given a number and specified precision, returns that number in base 10 with a maximum of precision
 * significant digits, but without any trailing zeros after the decimal point To be used when wishing
 * to display only as much digits to the user as necessary
 *
 * @param {string | number | BigNumber} n - The number to format
 * @param {number} precision - The maximum number of significant digits in the return value
 * @returns {string} The number in decimal form, with <= precision significant digits and no decimal trailing zeros
 */
export function toPrecisionWithoutTrailingZeros(n, precision) {
  return new BigNumber(n)
    .toPrecision(precision)
    .replace(/(\.[0-9]*[1-9])0*|(\.0*)/u, '$1');
}

export function calcTokenAmount(value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0));
  return new BigNumber(String(value)).div(multiplier);
}

export function getSwapsTokensReceivedFromTxMeta(
  tokenSymbol,
  txMeta,
  tokenAddress,
  senderAddress,
  tokenDecimals,
  approvalTxMeta,
  chainId,
) {
  const accountAddress = txMeta?.swapAndSendRecipient ?? senderAddress;

  const txReceipt = txMeta?.txReceipt;
  const networkAndAccountSupports1559 =
    txMeta?.txReceipt?.type === TransactionEnvelopeType.feeMarket;
  if (isSwapsDefaultTokenSymbol(tokenSymbol, chainId)) {
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
      return txMeta.swapMetaData.token_to_amount;
    }

    let approvalTxGasCost = new Numeric('0x0', 16);
    if (approvalTxMeta && approvalTxMeta.txReceipt) {
      approvalTxGasCost = new Numeric(
        calcGasTotal(
          approvalTxMeta.txReceipt.gasUsed,
          networkAndAccountSupports1559
            ? approvalTxMeta.txReceipt.effectiveGasPrice // Base fee + priority fee.
            : approvalTxMeta.txParams.gasPrice,
        ),
        16,
      );
    }

    const gasCost = calcGasTotal(
      txReceipt.gasUsed,
      networkAndAccountSupports1559
        ? txReceipt.effectiveGasPrice
        : txMeta.txParams.gasPrice,
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
      .toBase(10)
      .round(6);
    return ethReceived.toString();
  }
  const txReceiptLogs = txReceipt?.logs;
  if (txReceiptLogs && txReceipt?.status !== '0x0') {
    const tokenTransferLog = txReceiptLogs.find((txReceiptLog) => {
      const isTokenTransfer =
        txReceiptLog.topics &&
        txReceiptLog.topics[0] === TOKEN_TRANSFER_LOG_TOPIC_HASH;
      const isTransferFromGivenToken = txReceiptLog.address === tokenAddress;
      const isTransferFromGivenAddress =
        txReceiptLog.topics &&
        txReceiptLog.topics[2] &&
        txReceiptLog.topics[2].match(accountAddress?.slice(2));
      return (
        isTokenTransfer &&
        isTransferFromGivenToken &&
        isTransferFromGivenAddress
      );
    });
    return tokenTransferLog
      ? toPrecisionWithoutTrailingZeros(
          calcTokenAmount(tokenTransferLog.data, tokenDecimals).toString(10),
          6,
        )
      : '';
  }
  return null;
}

export const TRANSACTION_ENVELOPE_TYPE_NAMES = {
  FEE_MARKET: 'fee-market',
  LEGACY: 'legacy',
};

let registry;

/**
 * Attempts to return the method data from the MethodRegistry library, the message registry library and the token abi, in that order of preference
 *
 * @param {string} fourBytePrefix - The prefix from the method code associated with the data
 * @param {boolean} allow4ByteRequests - Whether or not to allow 4byte.directory requests, toggled by the user in privacy settings
 * @param {object} provider - Provider for current network
 * @returns {object}
 */
export async function getMethodDataAsync(
  fourBytePrefix,
  allow4ByteRequests,
  provider,
) {
  try {
    let fourByteSig = null;
    if (allow4ByteRequests) {
      fourByteSig = await getMethodFrom4Byte(fourBytePrefix).catch((e) => {
        console.error(e);
        return null;
      });
    }

    if (!registry) {
      registry = new MethodRegistry({
        provider: provider ?? global.ethereumProvider,
      });
    }

    if (!fourByteSig) {
      return {};
    }

    const parsedResult = registry.parse(fourByteSig);

    return {
      name: parsedResult.name,
      params: parsedResult.args,
    };
  } catch (error) {
    console.error(error);
    return {};
  }
}
