import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getInternalAccount,
  getInternalAccounts,
  getNonEvmCoinRates,
} from '../selectors';
import { sumDecimals } from '../../shared/modules/conversion.utils';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { useTokenTracker } from './useTokenTracker';
import { useEqualityCheck } from './useEqualityCheck';
import {
  NON_EVM_CHAIN_IDS,
  NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../shared/constants/non-evm-network';
import { isEvmAccountType } from '@metamask/keyring-api';

const evmNamespace = 'eip155';

type BlockchainAccount = {
  address: string;
  chainId: string; // can be caip2 or caip namespace
  parentId: string;
  isTestnet: boolean;
};

export const useNonEvmAccountTotalFiatBalance = (
  accountId: string,
  shouldHideZeroBalanceTokens: boolean,
): {
  formattedFiat: string;
  totalFiatBalance: string;
  tokensWithBalances: any[];
  loading: boolean;
  orderedTokenList: any[];
  error: string | null;
} => {
  const internalAccount = useSelector(getInternalAccounts)
    .filter((account) => account.id === accountId)
    .pop();

  if (!internalAccount || isEvmAccountType(internalAccount.type)) {
    return {
      formattedFiat: '0',
      totalFiatBalance: '0',
      tokensWithBalances: [],
      loading: false,
      orderedTokenList: [],
      error: null,
    };
  }

  // FIX: hardcoded to bitcoin until caip is in InternalAccounts
  const caip2 = 'bip122:000000000019d6689c085ae165831e93';

  // The fiat denomination to display
  const currentCurrency = useSelector(getCurrentCurrency);

  // get rate from rate controller
  const nonEvmRates = useSelector(getNonEvmCoinRates);
  const conversionRate = nonEvmRates['btc'];
  const nativeCurrencyImage: string = NON_EVM_CHAIN_ID_TOKEN_IMAGE_MAP[caip2];

  const balance = '0';

  // Total native and token fiat balance as a string (ex: "8.90")
  const totalFiatBalance = sumDecimals(balance).toString(); // TODO: support tokens

  // Create an object with native token info. NOTE: Native token info is fetched from a separate controller
  const nativeTokenValues = {
    iconUrl: nativeCurrencyImage,
    symbol: 'BTC',
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
