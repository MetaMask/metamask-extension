import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetBridgeState,
  updateQuoteRequestParams,
} from '../../../../ducks/bridge/actions';
import { useConfirmContext } from '../../context/confirm';
import {
  FeeMarketGasFeeEstimates,
  GasFeeEstimateLevel,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Hex, add0x, createProjectLogger } from '@metamask/utils';
import {
  estimateGasFee,
  getBridgeQuotes,
  setIntentQuoteForTransaction,
} from '../../../../store/actions';
import BigNumber from 'bignumber.js';
import { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { toHex } from '@metamask/controller-utils';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useIntentsNetworkFee } from './useIntentsNetworkFee';
import {
  INTENTS_FEE,
  NATIVE_TOKEN_ADDRESS,
} from '../../../../helpers/constants/intents';

const log = createProjectLogger('intents');

const QUOTE_LOADING_TIMEOUT = 10000;

export function useIntentsQuote({
  sourceChainId,
  sourceTokenAddress,
  sourceTokenAmount,
  targetTokenAddress,
}: {
  sourceChainId: Hex;
  sourceTokenAmount?: string;
  sourceTokenAddress: Hex;
  targetTokenAddress: Hex;
}) {
  const dispatch = useDispatch();
  const currency = useSelector(getCurrentCurrency);

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
    if (!sourceTokenAmount) {
      return [];
    }

    return getBridgeQuotes([
      {
        from: from as Hex,
        sourceChainId,
        sourceTokenAddress,
        sourceTokenAmount: sourceTokenAmount,
        targetChainId: destChainId,
        targetTokenAddress,
      },
      {
        from: from as Hex,
        sourceChainId,
        sourceTokenAddress,
        sourceTokenAmount: '1000000', // 0.00001 ETH
        targetChainId: destChainId,
        targetTokenAddress: NATIVE_TOKEN_ADDRESS,
      },
    ]);
  }, [
    sourceTokenAmount,
    sourceChainId,
    sourceTokenAddress,
    destChainId,
    from,
    targetTokenAddress,
  ]);

  if (error) {
    throw error;
  }

  const mainQuote = quotes?.[0];
  const gasQuote = quotes?.[1];

  log('Main quote', mainQuote, mainQuote?.quote?.destAsset?.address);
  log('Gas quote', gasQuote, gasQuote?.quote?.destAsset?.address);

  const { loading: gasFeeLoading, value: gasFee } =
    useIntentsNetworkFee(mainQuote);

  const [gasFeeFormatted] = useCurrencyDisplay(
    gasFee ?? '0x0',
    {
      currency,
      hideLabel: true,
    },
    toHex(sourceChainId),
  );

  const result = useMemo(
    () =>
      mainQuote || gasQuote
        ? {
            main: mainQuote ?? null,
            gas: gasQuote ?? null,
          }
        : null,
    [mainQuote, gasQuote],
  );

  useEffect(() => {
    log('Saving quotes', transactionId, result);
    setIntentQuoteForTransaction(transactionId, result);
  }, [transactionId, result]);

  const loading = gasFeeLoading || quotesLoading;

  return {
    gasFeeFormatted: mainQuote ? gasFeeFormatted : undefined,
    loading,
    sourceTokenAmount,
  };
}
