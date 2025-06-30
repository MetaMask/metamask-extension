import { useEffect, useState } from 'react';
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
import { getBridgeQuotes } from '../../../../ducks/bridge/selectors';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Hex, add0x, createProjectLogger } from '@metamask/utils';
import {
  estimateGasFee,
  setIntentQuoteForTransaction,
} from '../../../../store/actions';
import BigNumber from 'bignumber.js';
import { QuoteResponse } from '@metamask/bridge-controller';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { toHex } from '@metamask/controller-utils';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useIntentsNetworkFee } from './useIntentsNetworkFee';
import { INTENTS_FEE } from '../../../../helpers/constants/intents';

const log = createProjectLogger('intents');

const QUOTE_LOADING_TIMEOUT = 5000;

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
  const [quoteStart, setQuoteStart] = useState<number>(0);

  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    chainId: destChainId,
    txParams: { from },
  } = transasctionMeta;

  useEffect(() => {
    if (!sourceTokenAmount) {
      return;
    }

    dispatch(
      updateQuoteRequestParams(
        {
          srcTokenAddress: sourceTokenAddress,
          destTokenAddress: targetTokenAddress,
          srcTokenAmount: sourceTokenAmount,
          srcChainId: sourceChainId,
          destChainId,
          insufficientBal: true,
          walletAddress: from,
          destWalletAddress: from,
          slippage: 0.5,
        },
        {
          stx_enabled: false,
          token_symbol_source: '',
          token_symbol_destination: '',
          security_warnings: [],
        },
      ),
    );

    setQuoteStart(Date.now());
  }, [
    destChainId,
    dispatch,
    from,
    sourceTokenAmount,
    sourceChainId,
    sourceTokenAddress,
    targetTokenAddress,
  ]);

  useEffect(() => {
    return () => {
      dispatch(resetBridgeState());
    };
  }, [dispatch]);

  const quoteData = useSelector(getBridgeQuotes);
  const activeQuote = quoteData.activeQuote;

  log('Active quote', activeQuote);

  const isQuoteLoading =
    !activeQuote && Date.now() - quoteStart < QUOTE_LOADING_TIMEOUT;

  const { loading: gasFeeLoading, value: gasFee } =
    useIntentsNetworkFee(activeQuote);

  const [gasFeeFormatted] = useCurrencyDisplay(
    gasFee ?? '0x0',
    {
      currency,
      hideLabel: true,
    },
    toHex(sourceChainId),
  );

  useEffect(() => {
    setIntentQuoteForTransaction(transactionId, activeQuote);
  }, [transactionId, activeQuote]);

  const loading = gasFeeLoading || isQuoteLoading;

  return {
    gasFeeFormatted: activeQuote ? gasFeeFormatted : undefined,
    loading,
    sourceTokenAmount,
  };
}
