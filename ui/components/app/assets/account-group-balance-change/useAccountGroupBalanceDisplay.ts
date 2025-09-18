import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { getPrivacyMode } from '../../../../selectors';
import { selectBalanceChangeBySelectedAccountGroup } from '../../../../selectors/assets';
import {
  determineBalanceColor,
  formatAmountChange,
  formatPercentageChange,
  isValidAmount,
} from './get-display-balance';

export const useAccountGroupBalanceDisplay = (period: BalanceChangePeriod) => {
  const fiatCurrency: string = useSelector(getCurrentCurrency);
  const locale: string = useSelector(getIntlLocale);
  const privacyMode = useSelector(getPrivacyMode);

  // Memoized selector for the specified period
  const changeSelector = useMemo(
    () => selectBalanceChangeBySelectedAccountGroup(period),
    [period],
  );

  // Get the data
  const portfolioChange = useSelector(changeSelector);

  const valueChange: number | undefined = [
    isValidAmount(portfolioChange?.amountChangeInUserCurrency) &&
      portfolioChange.amountChangeInUserCurrency,
    isValidAmount(portfolioChange?.percentChange) &&
      portfolioChange.percentChange,
  ].find((v): v is number => v !== false);

  const color = useMemo(
    () => determineBalanceColor(valueChange, privacyMode),
    [valueChange, privacyMode],
  );

  const displayAmountChange = useMemo(
    () =>
      formatAmountChange(
        portfolioChange?.amountChangeInUserCurrency,
        fiatCurrency,
        locale,
      ),
    [portfolioChange?.amountChangeInUserCurrency, fiatCurrency, locale],
  );

  const displayPercentChange = useMemo(
    () => formatPercentageChange(portfolioChange?.percentChange, locale),
    [portfolioChange?.percentChange, locale],
  );

  return {
    privacyMode,
    color,
    displayAmountChange,
    displayPercentChange,
  };
};
