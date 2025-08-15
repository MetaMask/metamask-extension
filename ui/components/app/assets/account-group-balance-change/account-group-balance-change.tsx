import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TextColor } from '../../../../helpers/constants/design-system';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors';
import {
  selectSelectedGroupBalancePercentChange,
  selectSelectedGroupBalanceChange,
} from '../../../../selectors/assets';
import { renderPercentageWithNumber } from '../../../multichain/token-list-item/price/percentage-and-amount-change/percentage-and-amount-change';

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

export type AccountGroupBalanceChangeProps = {
  period: '1d' | '7d' | '30d';
};

// Self-contained component that fetches and formats portfolio change data
type AggregatedChange = {
  period: '1d' | '7d' | '30d';
  currentTotalInUserCurrency: number;
  previousTotalInUserCurrency: number;
  amountChangeInUserCurrency: number;
  percentChange: number;
  userCurrency: string;
};

export const AccountGroupBalanceChange: React.FC<
  AccountGroupBalanceChangeProps
> = ({ period }) => {
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  ) as boolean;
  const fiatCurrency = useSelector(getCurrentCurrency) as string;
  const locale = useSelector(getIntlLocale) as string;

  // Memoized selectors for the specified period
  const percentSelector = useMemo(
    () => selectSelectedGroupBalancePercentChange(period),
    [period],
  );
  const changeSelector = useMemo(
    () => selectSelectedGroupBalanceChange(period),
    [period],
  );

  // Get the data
  const portfolioPercent = useSelector(
    isMultichainAccountsState2Enabled ? percentSelector : () => 0,
  ) as number;
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
  ) as AggregatedChange;

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

  const percentNumber =
    typeof portfolioPercent === 'number' ? portfolioPercent : 0;
  const formattedPercent = formatValue(percentNumber, true);

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
