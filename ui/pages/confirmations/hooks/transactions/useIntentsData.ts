import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  resetBridgeState,
  updateQuoteRequestParams,
} from '../../../../ducks/bridge/actions';
import { useConfirmContext } from '../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { getBridgeQuotes } from '../../../../ducks/bridge/selectors';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  getConversionRate,
  getCurrentCurrency,
} from '../../../../ducks/metamask/metamask';
import BigNumber from 'bignumber.js';
import { Hex, Json, createProjectLogger } from '@metamask/utils';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../hooks/useAsync';
import {
  getTokenStandardAndDetailsByChain,
  setIntentQuoteForTransaction,
} from '../../../../store/actions';
import { fetchErc20Decimals } from '../../utils/token';
import {
  getConfirmationExchangeRates,
  getCurrencyRates,
  getMarketData,
  getTokenExchangeRates,
} from '../../../../selectors';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { useIntentSourceAmount } from './useIntentSourceAmount';

const log = createProjectLogger('intents-data');

export function useIntentsData({
  srcChainId,
  tokenAddress,
}: {
  srcChainId: Hex;
  tokenAddress?: Hex;
}) {
  const dispatch = useDispatch();
  const currency = useSelector(getCurrentCurrency);

  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    chainId: destChainId,
    txParams: { from, value },
  } = transasctionMeta;

  const { sourceTokenAmountRaw, sourceTokenAmountFormatted } =
    useIntentSourceAmount({
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

  log('Active Quote', activeQuote);

  const networkFeeFiat =
    quoteData.activeQuote?.totalNetworkFee?.valueInCurrency ?? '0';

  const networkFeeFiatFormatted = formatCurrency(networkFeeFiat, currency, 2);

  useEffect(() => {
    setIntentQuoteForTransaction(transactionId, activeQuote);
  }, [transactionId, activeQuote]);

  return {
    sourceTokenAmountFormatted,
    networkFeeFiatFormatted,
  };
}
