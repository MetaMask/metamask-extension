import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetBridgeState,
  updateQuoteRequestParams,
} from '../../../../ducks/bridge/actions';
import { useConfirmContext } from '../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { getBridgeQuotes } from '../../../../ducks/bridge/selectors';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Hex } from '@metamask/utils';
import { setIntentQuoteForTransaction } from '../../../../store/actions';
import { useIntentSourceAmount } from './useIntentSourceAmount';

const QUOTE_LOADING_TIMEOUT = 5000;

export function useIntentsQuote({
  srcChainId,
  tokenAddress,
}: {
  srcChainId: Hex;
  tokenAddress?: Hex;
}) {
  const dispatch = useDispatch();
  const currency = useSelector(getCurrentCurrency);
  const [quoteStart, setQuoteStart] = useState<number>(0);

  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    chainId: destChainId,
    txParams: { from, value },
  } = transasctionMeta;

  const {
    loading: sourceAmountLoading,
    sourceTokenAmountRaw,
    sourceTokenAmountFormatted,
  } = useIntentSourceAmount({
    chainId: srcChainId,
    nativeValue: (value as Hex) ?? '0x0',
    tokenAddress,
  }) ?? {};

  useEffect(() => {
    if (!sourceTokenAmountRaw) {
      return;
    }

    dispatch(
      updateQuoteRequestParams(
        {
          srcTokenAddress: tokenAddress,
          destTokenAddress: '0x0000000000000000000000000000000000000000',
          srcTokenAmount: sourceTokenAmountRaw,
          srcChainId,
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
    sourceTokenAmountRaw,
    srcChainId,
    tokenAddress,
  ]);

  useEffect(() => {
    return () => {
      dispatch(resetBridgeState());
    };
  }, [dispatch]);

  const quoteData = useSelector(getBridgeQuotes);
  const activeQuote = quoteData.activeQuote;

  const isQuoteLoading =
    !activeQuote && Date.now() - quoteStart < QUOTE_LOADING_TIMEOUT;

  const networkFeeFiat =
    quoteData.activeQuote?.totalNetworkFee?.valueInCurrency;

  const networkFeeFiatFormatted = networkFeeFiat
    ? formatCurrency(networkFeeFiat, currency, 2)
    : undefined;

  useEffect(() => {
    setIntentQuoteForTransaction(transactionId, activeQuote);
  }, [transactionId, activeQuote]);

  const loading = sourceAmountLoading || isQuoteLoading;

  if (
    sourceTokenAmountFormatted === undefined ||
    networkFeeFiatFormatted === undefined
  ) {
    return {
      loading,
    };
  }

  return {
    loading,
    sourceTokenAmountFormatted,
    networkFeeFiatFormatted,
  };
}
