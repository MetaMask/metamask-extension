import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getPrivacyMode } from '../../../../selectors';
import { selectBalanceChangeBySelectedAccountGroup } from '../../../../selectors/assets';
import { determineBalanceColor, isValidAmount } from './get-display-balance';

export const useAccountGroupBalanceDisplay = (period: BalanceChangePeriod) => {
  const privacyMode = useSelector(getPrivacyMode);

  // Memoized selector for the specified period
  const changeSelector = useMemo(
    () => selectBalanceChangeBySelectedAccountGroup(period),
    [period],
  );

  // Get the data
  const portfolioChange = useSelector(changeSelector);
  const { amountChangeInUserCurrency, percentChange } = portfolioChange ?? {};

  const valueChange: number | undefined = [
    isValidAmount(amountChangeInUserCurrency) && amountChangeInUserCurrency,
    isValidAmount(percentChange) && percentChange,
  ].find((v): v is number => v !== false);

  const color = useMemo(
    () => determineBalanceColor(valueChange, privacyMode),
    [valueChange, privacyMode],
  );

  return {
    privacyMode,
    color,
    amountChange: amountChangeInUserCurrency ?? 0,
    percentChange: (percentChange ?? 0) / 100,
  };
};
