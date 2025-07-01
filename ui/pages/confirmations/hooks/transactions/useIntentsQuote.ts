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
import { useIntentSourceAmounts } from './useIntentSourceAmount';
import { useIntentsContext } from '../../context/intents/intents';
import { useIntentsTargets } from './useIntentsTarget';

const log = createProjectLogger('intents');

export function useIntentsQuote() {
  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    chainId: destChainId,
    txParams: { from },
  } = transasctionMeta;

  const { sourceToken, loading, setLoading } = useIntentsContext();
  const sourceAmounts = useIntentSourceAmounts();
  const targets = useIntentsTargets();

  const sourceChainId = sourceToken?.chainId;
  const sourceTokenAddress = sourceToken?.address;

  const targetTokenAddresses = targets.map(
    (target) => target.targetTokenAddress,
  );

  const {
    pending: quotesLoading,
    error,
    value: quotes,
  } = useAsyncResult(async () => {
    if (!sourceAmounts?.length || !sourceChainId || !sourceTokenAddress) {
      return [];
    }

    log('Fetching quotes', transactionId);

    const requests = sourceAmounts.map((sourceAmount, index) => ({
      from: from as Hex,
      sourceChainId,
      sourceTokenAddress,
      sourceTokenAmount: sourceAmount.sourceTokenAmountRaw,
      targetChainId: destChainId,
      targetTokenAddress: targetTokenAddresses[index],
    }));

    return getBridgeQuotes(requests);
  }, [
    JSON.stringify(sourceAmounts),
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

  useEffect(() => {
    if ((quotesLoading || gasFeeLoading) && !loading) {
      setLoading?.(true);
    }

    if (!quotesLoading && !gasFeeLoading && loading) {
      setLoading?.(false);
    }
  }, [quotesLoading, gasFeeLoading, loading, setLoading]);

  return {
    networkFee,
    loading,
  };
}
