import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
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
import { Hex, Json, createProjectLogger } from '@metamask/utils';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { setIntentQuoteForTransaction } from '../../../../store/actions';
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

const log = createProjectLogger('intents-data');

export function useIntentsData({ tokenAddress }: { tokenAddress?: Hex } = {}) {
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

  const tokenFiatAmount = useTokenFiatAmount(
    tokenAddress ?? undefined,
    value ?? '0x0',
    '',
    {},
    true,
  );

  const { value: decimals } = useAsyncResult(async () => {
    if (!tokenAddress) {
      return undefined;
    }

    return fetchErc20Decimals(tokenAddress);
  }, [tokenAddress]);

  const sourceFiatRate = useTokenFiatRate(tokenAddress ?? '0x0', chainId);

  log('Source Fiat Rate', sourceFiatRate?.toString(), tokenAddress);

  const sourceTokenAmount = targetFiat.div(sourceFiatRate ?? 1);

  const sourceTokenAmountFormatted = sourceFiatRate
    ? sourceTokenAmount.toFixed(2)
    : undefined;

  const sourceTokenAmountRaw = new BigNumber(sourceTokenAmount)
    .shift(decimals ?? 0)
    .toFixed(0);

  useEffect(() => {
    if (!tokenAddress) {
      return;
    }

    dispatch(
      updateQuoteRequestParams(
        {
          srcTokenAddress: tokenAddress,
          destTokenAddress: '0x0000000000000000000000000000000000000000',
          srcTokenAmount: sourceTokenAmountRaw,
          srcChainId: chainId,
          destChainId: chainId,
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
  }, [chainId, dispatch, from, sourceTokenAmountRaw, tokenAddress]);

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

function useTokenFiatRate(tokenAddress: Hex, chainId: Hex) {
  const allMarketData = useSelector(getMarketData);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const contractMarketData =
    chainId && allMarketData[chainId]
      ? Object.entries(allMarketData[chainId]).reduce<Record<string, Json>>(
          (acc, [address, marketData]) => {
            acc[address] = (marketData as any)?.price ?? null;
            return acc;
          },
          {},
        )
      : null;

  const tokenMarketData = chainId ? contractMarketData : contractExchangeRates;
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);

  const mergedRates = {
    ...tokenMarketData,
    ...confirmationExchangeRates,
  };

  const currencyRates = useSelector(getCurrencyRates);
  const conversionRate = useSelector(getConversionRate);

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const tokenConversionRate = chainId
    ? currencyRates?.[networkConfigurationsByChainId[chainId]?.nativeCurrency]
        ?.conversionRate
    : conversionRate;

  const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
    isEqualCaseInsensitive(key, tokenAddress),
  );

  const tokenExchangeRate =
    contractExchangeTokenKey && mergedRates[contractExchangeTokenKey];

  if (!tokenExchangeRate || !tokenConversionRate) {
    return undefined;
  }

  return new BigNumber(tokenExchangeRate.toString()).mul(tokenConversionRate);
}
