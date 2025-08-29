import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TextColor } from '../../../../helpers/constants/design-system';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors';
import { selectBalanceChangeBySelectedAccountGroup } from '../../../../selectors/assets';
import { renderPercentageWithNumber } from '../../../multichain/token-list-item/price/percentage-and-amount-change/percentage-and-amount-change';
import { formatWithThreshold } from '../util/formatWithThreshold';

// Simple inline implementations to avoid restricted imports
const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

// removed: replaced by formatWithThreshold-based formatting

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

  // Memoized selector for the specified period
  const changeSelector = useMemo(
    () => selectBalanceChangeBySelectedAccountGroup(period),
    [period],
  );

  // Get the data
  const portfolioChange = useSelector(
    isMultichainAccountsState2Enabled ? changeSelector : () => null,
  ) as AggregatedChange | null;
  const portfolioPercent = portfolioChange?.percentChange ?? 0;

  // Early return if feature flag is off
  if (!isMultichainAccountsState2Enabled) {
    return null;
  }

  let color = TextColor.textDefault;
  if (
    portfolioChange &&
    isValidAmount(portfolioChange.amountChangeInUserCurrency)
  ) {
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
  const percentSign = percentNumber >= 0 ? '+' : '-';
  const localizedPercent = formatWithThreshold(
    Math.abs(percentNumber) / 100,
    0.0001,
    locale,
    {
      style: 'percent',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    },
  );
  const formattedPercentWithParens = `(${percentSign}${localizedPercent})`;

  let formattedAmount = '';
  if (
    portfolioChange &&
    isValidAmount(portfolioChange.amountChangeInUserCurrency)
  ) {
    const amt = Number(portfolioChange.amountChangeInUserCurrency);
    const sign = amt >= 0 ? '+' : '-';
    const localizedAmount = formatWithThreshold(Math.abs(amt), 0.01, locale, {
      style: 'currency',
      currency: fiatCurrency,
    });
    formattedAmount = `${sign}${localizedAmount} `;
  }

  return renderPercentageWithNumber(
    formattedPercentWithParens,
    formattedAmount,
    color,
  );
};
