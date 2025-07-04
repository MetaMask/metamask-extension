import { useEffect, useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { QuoteResponse } from '@metamask/bridge-controller';
import {
  getBridgeQuotes,
  setIntentQuoteForTransaction,
} from '../../../../store/actions';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useIntentsContext } from '../../context/intents/intents';
import { useConfirmContext } from '../../context/confirm';
import { useIntentsNetworkFee } from './useIntentsNetworkFee';
import { useIntentsSourceAmounts } from './useIntentsSourceAmounts';
import { useIntentsTargets } from './useIntentsTargets';

const log = createProjectLogger('intents');

export function useIntentsQuotes() {
  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    chainId: destChainId,
    txParams: { from },
  } = transasctionMeta;

  const { sourceToken, loading, setLoading, setSuccess } = useIntentsContext();
  const sourceAmounts = useIntentsSourceAmounts();
  const targets = useIntentsTargets();

  const sourceChainId = sourceToken?.chainId;
  const sourceTokenAddress = sourceToken?.address;

  const targetTokenAddresses = useMemo(
    () => targets.map((target) => target.targetTokenAddress),
    [targets],
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
    sourceAmounts,
    sourceChainId,
    sourceTokenAddress,
    destChainId,
    from,
    targetTokenAddresses,
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
  }, [transactionId, finalQuotes]);

  useEffect(() => {
    if ((quotesLoading || gasFeeLoading) && !loading) {
      setLoading?.(true);
    }

    if (!quotesLoading && !gasFeeLoading && loading) {
      setLoading?.(false);
    }
  }, [quotesLoading, gasFeeLoading, loading, setLoading]);

  useEffect(() => {
    if (finalQuotes?.length) {
      setSuccess?.(true);
    } else {
      setSuccess?.(false);
    }
  }, [finalQuotes, setSuccess]);

  return {
    networkFee,
    loading,
  };
}
