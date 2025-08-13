import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TextColor } from '../../../../../helpers/constants/design-system';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { getIsMultichainAccountsState2Enabled } from '../../../../../selectors';
import {
  selectSelectedGroupPortfolioPercentChange,
  selectSelectedGroupPortfolioChange,
} from '../../../../../selectors/assets';
import { renderPercentageWithNumber } from './percentage-and-amount-change';

// Simple inline implementations to avoid restricted imports
const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

const formatValue = (
  value: number | null | undefined,
  isPercentage: boolean,
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0%';
  }

  if (isPercentage) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  return value.toFixed(2);
};

export type PercentAndChangeAmountProps = {
  period: '1d' | '7d' | '30d';
};

// Self-contained component that fetches and formats portfolio change data
export const PercentAndChangeAmount: React.FC<PercentAndChangeAmountProps> = ({
  period,
}) => {
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const fiatCurrency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  // Memoized selectors for the specified period
  const percentSelector = useMemo(
    () => selectSelectedGroupPortfolioPercentChange(period),
    [period],
  );
  const changeSelector = useMemo(
    () => selectSelectedGroupPortfolioChange(period),
    [period],
  );

  // Get the data
  const portfolioPercent = useSelector(
    isMultichainAccountsState2Enabled ? percentSelector : () => 0,
  );
  const portfolioChange = useSelector(
    isMultichainAccountsState2Enabled
      ? changeSelector
      : () => ({
          period,
          currentTotalInUserCurrency: 0,
          previousTotalInUserCurrency: 0,
          amountChangeInUserCurrency: 0,
          percentChange: 0,
          userCurrency: 'usd',
        }),
  );

  // Early return if feature flag is off
  if (!isMultichainAccountsState2Enabled) {
    return null;
  }

  let color = TextColor.textDefault;
  if (isValidAmount(portfolioChange.amountChangeInUserCurrency)) {
    const amt = Number(portfolioChange.amountChangeInUserCurrency);
    if (amt > 0) {
      color = TextColor.successDefault;
    } else if (amt < 0) {
      color = TextColor.errorDefault;
    }
  } else if (isValidAmount(portfolioPercent)) {
    const pct = Number(portfolioPercent);
    if (pct > 0) {
      color = TextColor.successDefault;
    } else if (pct < 0) {
      color = TextColor.errorDefault;
    }
  }

  const formattedPercent = formatValue(portfolioPercent ?? null, true);

  let formattedAmount = '';
  if (isValidAmount(portfolioChange.amountChangeInUserCurrency)) {
    const amt = Number(portfolioChange.amountChangeInUserCurrency);
    const sign = amt >= 0 ? '+' : '';
    const options = {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    } as const;
    try {
      formattedAmount = `${sign}${Intl.NumberFormat(locale, {
        ...options,
        style: 'currency',
        currency: fiatCurrency,
      }).format(amt)} `;
    } catch {
      formattedAmount = `${sign}${Intl.NumberFormat(locale, {
        ...options,
        minimumFractionDigits: 2,
        style: 'decimal',
      }).format(amt)} `;
    }
  }

  return renderPercentageWithNumber(formattedPercent, formattedAmount, color);
};
