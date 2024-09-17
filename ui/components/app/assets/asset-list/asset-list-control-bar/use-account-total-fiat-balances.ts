import React, { useEffect, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import {
  getConfirmationExchangeRates,
  getCurrentCurrency,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../../selectors';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../../helpers/utils/util';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { getConversionRate } from '../../../../../ducks/metamask/metamask';
import { getTokenFiatAmount } from '../../../../../helpers/utils/token-util';
import SortControl from '../sort-control';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { sortAssets } from '../../util/sort';
import { useNativeTokenBalance } from '../native-token/use-native-token-balance';
import { getMultichainCurrencyImage } from '../../../../../selectors/multichain';

export const useAccountTotalFiatBalancesHook = () => {
  // Selectors from the Redux store
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  // Token sort config, replacing `any` with a more appropriate type
  const tokenSortConfig = useSelector((state: any) => {
    return state.metamask.preferences.tokenSortConfig;
  });

  // Fetching exchange rates from the Redux store
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);

  // Merging exchange rates
  const mergedRates = {
    ...contractExchangeRates,
    ...confirmationExchangeRates,
  };

  // Getting total fiat balance for the account
  const accountTotalFiatBalance = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  return {
    accountTotalFiatBalance,
    mergedRates,
    loading: accountTotalFiatBalance.loading,
  };
};
