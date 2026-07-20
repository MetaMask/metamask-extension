import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { getSwapsTokensReceivedFromTxMeta } from '../../shared/lib/transactions-controller-utils';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from '../../shared/lib/swaps.utils';
import { getCurrentChainId } from '../../shared/lib/selectors/networks';
import type { SwapsTokenObject } from '../../shared/constants/swaps';
import { useTokenFiatAmount } from './useTokenFiatAmount';

type SwappedTokenValue = {
  /** a primary currency string formatted for display */
  swapTokenValue: string | boolean | undefined;
  /** a secondary currency string formatted for display */
  swapTokenFiatAmount: string | undefined;
  /** true if user is on the asset page for the destination/received asset in a swap */
  isViewingReceivedTokenFromSwap: boolean;
  /** true if the swap token value is negative */
  isNegative: boolean;
};

type SwapTransactionGroup = {
  primaryTransaction: {
    destinationTokenSymbol?: string;
    swapTokenValue?: string;
    sourceTokenAddress?: string;
    sourceTokenSymbol?: string;
    [key: string]: unknown;
  };
  initialTransaction: {
    type?: string;
    txParams?: { from?: string };
    [key: string]: unknown;
  };
};

/**
 * A Swap transaction group's primaryTransaction contains details of the swap,
 * including the source (from) and destination (to) token type (ETH, DAI, etc..)
 * When viewing an asset page that is not for the current chain's default token, we
 * need to determine if that asset is the token that was received (destination) from
 * the swap. In that circumstance we would want to show the primaryCurrency in the
 * activity list that is most relevant for that token (- 1000 DAI, for example, when
 * swapping DAI for ETH).
 *
 * @param transactionGroup - Group of transactions by nonce
 * @param currentAsset - The current asset the user is looking at
 * @returns SwappedTokenValue
 */
export function useSwappedTokenValue(
  transactionGroup: SwapTransactionGroup,
  currentAsset: SwapsTokenObject,
): SwappedTokenValue {
  const { symbol, decimals, address } = currentAsset;
  const { primaryTransaction, initialTransaction } = transactionGroup;
  const { type } = initialTransaction;
  const { from: senderAddress } = initialTransaction.txParams || {};
  const chainId = useSelector(getCurrentChainId);

  const isViewingReceivedTokenFromSwap =
    type === TransactionType.swap &&
    (currentAsset?.symbol === primaryTransaction.destinationTokenSymbol ||
      (isSwapsDefaultTokenAddress(currentAsset.address, chainId) &&
        isSwapsDefaultTokenSymbol(
          primaryTransaction.destinationTokenSymbol,
          chainId,
        )));

  const swapTokenValue =
    [TransactionType.swap].includes(type as TransactionType) &&
    isViewingReceivedTokenFromSwap
      ? getSwapsTokensReceivedFromTxMeta(
          primaryTransaction.destinationTokenSymbol,
          initialTransaction as Parameters<
            typeof getSwapsTokensReceivedFromTxMeta
          >[1],
          address,
          senderAddress,
          decimals,
          null,
          chainId,
        )
      : [TransactionType.swap, TransactionType.swapAndSend].includes(
            type as TransactionType,
          ) && primaryTransaction.swapTokenValue;

  const isNegative =
    typeof swapTokenValue === 'string'
      ? Math.sign(Number(swapTokenValue)) === -1
      : false;

  const _swapTokenFiatAmount = useTokenFiatAmount(
    address,
    swapTokenValue as string || '',
    symbol,
  );
  const _swapAndSendTokenFiatAmount = useTokenFiatAmount(
    primaryTransaction.sourceTokenAddress,
    swapTokenValue as string,
    primaryTransaction.sourceTokenSymbol,
  );

  let swapTokenFiatAmount: string | undefined;
  if (swapTokenValue) {
    if (isViewingReceivedTokenFromSwap) {
      swapTokenFiatAmount = _swapTokenFiatAmount;
    } else if (type === TransactionType.swapAndSend) {
      swapTokenFiatAmount = _swapAndSendTokenFiatAmount;
    }
  }

  return {
    swapTokenValue,
    swapTokenFiatAmount,
    isViewingReceivedTokenFromSwap,
    isNegative,
  };
}
