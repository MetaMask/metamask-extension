import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useConfirmContext } from '../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  getBridgeQuotes,
  setIntentQuoteForTransaction,
} from '../../../../store/actions';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useIntentsNetworkFee } from './useIntentsNetworkFee';
import { QuoteResponse } from '@metamask/bridge-controller';

const log = createProjectLogger('intents');

export function useIntentsQuote({
  sourceChainId,
  sourceTokenAddress,
  sourceTokenAmounts,
  targetTokenAddresses,
}: {
  sourceChainId: Hex;
  sourceTokenAmounts: string[] | undefined;
  sourceTokenAddress: Hex;
  targetTokenAddresses: Hex[];
}) {
  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    chainId: destChainId,
    txParams: { from },
  } = transasctionMeta;

  const {
    pending: quotesLoading,
    error,
    value: quotes,
  } = useAsyncResult(async () => {
    if (!sourceTokenAmounts?.length) {
      return [];
    }

    const requests = sourceTokenAmounts.map((sourceTokenAmount, index) => ({
      from: from as Hex,
      sourceChainId,
      sourceTokenAddress,
      sourceTokenAmount,
      targetChainId: destChainId,
      targetTokenAddress: targetTokenAddresses[index],
    }));

    return getBridgeQuotes(requests);
  }, [
    JSON.stringify(sourceTokenAmounts),
    sourceChainId,
    JSON.stringify(sourceTokenAddress),
    destChainId,
    from,
    JSON.stringify(targetTokenAddresses),
  ]);

  if (error) {
    throw error;
  }

  log('Quotes', transactionId, quotes);

  const finalQuotes = quotes?.some((quote) => !quote)
    ? undefined
    : (quotes as QuoteResponse[]);

  const { loading: gasFeeLoading, networkFee } =
    useIntentsNetworkFee(finalQuotes);

  useEffect(() => {
    log('Saving quotes', transactionId, finalQuotes);
    setIntentQuoteForTransaction(transactionId, finalQuotes ?? null);
  }, [transactionId, JSON.stringify(finalQuotes)]);

  const loading = gasFeeLoading || quotesLoading;

  return {
    networkFee,
    loading,
  };
}
