import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getPrivacyMode,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { selectBalanceChangeBySelectedAccountGroup } from '../../../../selectors/assets';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';
import { determineBalanceColor, isValidAmount } from './get-display-balance';

export const useAccountGroupBalanceDisplay = (period: BalanceChangePeriod) => {
  const privacyMode = useSelector(getPrivacyMode);
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

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

  // True while the balance data hasn't arrived yet (networks unavailable + no amount change).
  const isLoading =
    !anyEnabledNetworksAreAvailable &&
    isZeroAmount(amountChangeInUserCurrency ?? 0);

  return {
    privacyMode,
    color,
    amountChange: amountChangeInUserCurrency ?? 0,
    percentChange: (percentChange ?? 0) / 100,
    portfolioChange,
    isLoading,
  };
};
