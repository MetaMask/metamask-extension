import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuoteRequestParams } from '../../../../ducks/bridge/actions';
import { useConfirmContext } from '../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { getBridgeQuotes } from '../../../../ducks/bridge/selectors';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  getConversionRate,
  getCurrentCurrency,
} from '../../../../ducks/metamask/metamask';
import BigNumber from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { setIntentQuoteForTransaction } from '../../../../store/actions';

const SOURCE_TOKEN_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC

export function useIntentsData() {
  const dispatch = useDispatch();
  const currency = useSelector(getCurrentCurrency);
  const nativeConversionRate = useSelector(getConversionRate);

  const { currentConfirmation: transasctionMeta } =
    useConfirmContext<TransactionMeta>();

  const {
    chainId,
    id: transactionId,
    txParams: { from, value },
  } = transasctionMeta;

  const targetFiat = new BigNumber(value ?? '0x0', 16)
    .shift(-18)
    .mul(nativeConversionRate);

  const { value: sourceFiatRate } = useAsyncResult(
    () => fetchTokenFiatRates(currency, SOURCE_TOKEN_ADDRESS, chainId),
    [currency, chainId],
  );

  const sourceTokenAmount = targetFiat.div(sourceFiatRate ?? 1);
  const sourceTokenAmountFormatted = sourceTokenAmount.toFixed(2);
  const sourceTokenAmountRaw = new BigNumber(sourceTokenAmount)
    .shift(6)
    .toFixed(0);

  useEffect(() => {
    dispatch(
      updateQuoteRequestParams(
        {
          srcTokenAddress: SOURCE_TOKEN_ADDRESS,
          destTokenAddress: '0x0000000000000000000000000000000000000000',
          srcTokenAmount: sourceTokenAmountRaw,
          srcChainId: chainId,
          destChainId: chainId,
          insufficientBal: true,
          walletAddress: from,
          destWalletAddress: from,
        },
        {
          stx_enabled: false,
          token_symbol_source: 'USDC',
          token_symbol_destination: 'ETH',
          security_warnings: [],
        },
      ),
    );
  }, [chainId, dispatch, from]);

  const quoteData = useSelector(getBridgeQuotes);

  const networkFeeFiat =
    quoteData.activeQuote?.totalNetworkFee?.valueInCurrency ?? '0';

  const networkFeeFiatFormatted = formatCurrency(networkFeeFiat, currency, 2);

  useEffect(() => {
    setIntentQuoteForTransaction(transactionId, quoteData.activeQuote);
  }, [transactionId, quoteData.activeQuote]);

  return {
    sourceTokenAmountFormatted,
    networkFeeFiatFormatted,
  };
}

async function fetchTokenFiatRates(
  fiatCurrency: string,
  erc20TokenAddress: Hex,
  chainId: Hex,
): Promise<number> {
  const tokenRates = await fetchTokenExchangeRates(
    fiatCurrency,
    [erc20TokenAddress],
    chainId,
  );

  return (
    Object.entries(tokenRates).find(
      ([address]) => address.toLowerCase() === erc20TokenAddress.toLowerCase(),
    )?.[1] ?? 1.0
  );
}
