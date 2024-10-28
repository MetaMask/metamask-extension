import { useSelector } from 'react-redux';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import {
  getMultichainCurrencyImage,
  getMultichainBalances,
  getMultichainNetwork,
  getMultichainCurrentCurrency,
  getMultichainConversionRate,
} from '../selectors/multichain';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../shared/constants/multichain/assets';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { useMultichainSelector } from './useMultichainSelector';
import { useAccountTotalFiatBalance } from './useAccountTotalFiatBalance';

export const EMPTY_VALUES = {
  formattedFiat: '0',
  totalFiatBalance: '0',
  totalWeiBalance: '0',
  tokensWithBalances: [],
  loading: false,
  orderedTokenList: [],
};

export const useMultichainAccountTotalFiatBalance = (
  account: InternalAccount,
  shouldHideZeroBalanceTokens: boolean = false,
): {
  formattedFiat: string;
  totalFiatBalance: string;
  tokensWithBalances: {
    address: string;
    symbol: string;
    decimals: string;
    isERC721: boolean;
    image: string;
  }[];
  totalWeiBalance?: string;
  totalBalance?: string;
  loading: boolean;
  orderedTokenList: { iconUrl: string; symbol: string; fiatBalance: string }[];
} => {
  if (isEvmAccountType(account.type)) {
    return useAccountTotalFiatBalance(account, shouldHideZeroBalanceTokens);
  }

  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    account,
  );
  const { network } = useMultichainSelector(getMultichainNetwork, account);
  const { ticker } = network;
  const conversionRate = useMultichainSelector(
    getMultichainConversionRate,
    account,
  );
  const nativeCurrencyImage: string = useMultichainSelector(
    getMultichainCurrencyImage,
    account,
  );

  const balances = useSelector(getMultichainBalances);
  // TODO: find dynamic way to ensure balance is the highest denomination.
  const asset =
    MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19[
      ticker as keyof typeof MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19
    ];

  if (!balances[account.id]?.[asset]) {
    // FIXME: We might try to get the balance for a created account, but the
    // BalancesController might not have updated it yet!
    return EMPTY_VALUES;
  }
  const { amount: balance } = balances[account.id][asset];

  const totalFiatBalance =
    getTokenFiatAmount(
      1, // coin to native conversion rate is 1:1
      Number(conversionRate), // native to fiat conversion rate
      currentCurrency,
      balance,
      ticker,
      false,
      false,
    ) ?? '0'; // if the conversion fails, return 0

  // Create an object with native token info. NOTE: Native token info is fetched from a separate controller
  const nativeTokenValues = {
    iconUrl: nativeCurrencyImage,
    symbol: ticker,
    fiatBalance: totalFiatBalance,
  };

  // Fiat balance formatted in user's desired currency (ex: "$8.90")
  const formattedFiat = formatCurrency(totalFiatBalance, currentCurrency);

  return {
    formattedFiat,
    totalFiatBalance,
    totalBalance: balance,
    tokensWithBalances: [], // TODO: support tokens
    loading: false, // TODO: support tokens
    orderedTokenList: [nativeTokenValues], // TODO: support tokens
  };
};
