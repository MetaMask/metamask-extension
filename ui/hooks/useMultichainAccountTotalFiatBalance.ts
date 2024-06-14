import { useSelector } from 'react-redux';
import {
  getMultichainCoinRates,
  getMultichainCurrencyImage,
  getMultichainBalances,
  getMultichainNetwork,
} from '../selectors/multichain';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../shared/constants/multichain/networks';
import { getTokenFiatAmount } from '../helpers/utils/token-util';

export const useMultichainAccountTotalFiatBalance = (
  account: InternalAccount,
): {
  formattedFiat: string;
  totalFiatBalance: string;
  tokensWithBalances: any[];
  loading: boolean;
  orderedTokenList: any[];
  error: string | null;
} => {
  if (isEvmAccountType(account.type)) {
    return {
      formattedFiat: '0',
      totalFiatBalance: '0',
      tokensWithBalances: [],
      loading: false,
      orderedTokenList: [],
      error: null,
    };
  }

  // The fiat denomination to display
  // TODO: fix me when we have a know how to deal with non usd currencies.
  const currentCurrency = 'usd';
  const { network } = useSelector(getMultichainNetwork);

  // get rate from rate controller
  const multichainCoinRates = useSelector(getMultichainCoinRates);
  // rates uses the lower case ticker
  const { conversionRate } = multichainCoinRates[network.ticker.toLowerCase()];
  // chainId will be defined here if it is a multichain account
  const nativeCurrencyImage: string = useSelector(getMultichainCurrencyImage);

  const userBalance = useSelector(getMultichainBalances);
  console.log('USER BALANCE', userBalance);
  console.log('network.ticker', network.ticker);
  console.log('caip19', MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19[
        network.ticker as keyof typeof MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19
      ]);
  // TODO: find dynamic way to ensure balance is the highest denomination.
  const { amount, unit } =
    userBalance[
      MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19[
        network.ticker as keyof typeof MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19
      ]
    ];

  const totalFiatBalance =
    getTokenFiatAmount(
      1, //coin to native conversion rate is 1:1
      Number(conversionRate), // native to fiat conversion rate
      currentCurrency,
      amount,
      network.ticker,
      false,
      false,
    ) ?? '0'; // if the conversion fails, return 0

  // Create an object with native token info. NOTE: Native token info is fetched from a separate controller
  const nativeTokenValues = {
    iconUrl: nativeCurrencyImage,
    symbol: network.ticker,
    fiatBalance: totalFiatBalance,
  };

  // Fiat balance formatted in user's desired currency (ex: "$8.90")
  const formattedFiat = formatCurrency(totalFiatBalance, currentCurrency);

  return {
    formattedFiat,
    totalFiatBalance,
    tokensWithBalances: [], // TODO: support tokens
    loading: false, // TODO: support tokens
    orderedTokenList: [nativeTokenValues], // TODO: support tokens
    error: null,
  };
};
