import React from 'react';
import { useSelector } from 'react-redux';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Text } from '../../component-library';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../selectors';
import { SizeNumber } from '../../component-library/box/box.types';
import { BalanceChange, FIAT_UNAVAILABLE, FiatAmountAvailable } from './types';

const textStyle = {
  color: TextColor.textAlternative,
  variant: TextVariant.bodySm,
  paddingRight: 2 as SizeNumber,
};

const FiatNotAvailableDisplay: React.FC = () => {
  const t = useI18nContext();
  return <Text {...textStyle}>{t('simulationPreviewFiatNotAvailable')}</Text>;
};

/**
 * Returns a function that formats a fiat amount as a localized string.
 */
const useFiatFormatter = () => {
  const locale = useSelector(getCurrentLocale);
  const fiatCurrency = useSelector(getCurrentCurrency);

  return (fiatAmount: FiatAmountAvailable) => {
    return Intl.NumberFormat(locale, {
      style: 'currency',
      currency: fiatCurrency,
    }).format(fiatAmount);
  };
};

export function calculateTotalFiat(balanceChanges: BalanceChange[]): number {
  return balanceChanges.reduce((total, { fiatAmount }) => {
    return fiatAmount === FIAT_UNAVAILABLE ? total : total + fiatAmount;
  }, 0);
}

/**
 * Displays the fiat value of a single balance change.
 *
 * @param props
 * @param props.fiatAmount
 */
export const IndividualFiatDisplay: React.FC<BalanceChange> = ({
  fiatAmount,
}) => {
  const fiatFormatter = useFiatFormatter();

  if (fiatAmount === FIAT_UNAVAILABLE) {
    return <FiatNotAvailableDisplay />;
  }
  return <Text {...textStyle}>{fiatFormatter(Math.abs(fiatAmount))}</Text>;
};

/**
 * Displays the total fiat value of a list of balance changes.
 *
 * @param props
 * @param props.balanceChanges
 */
export const TotalFiatDisplay: React.FC<{
  balanceChanges: BalanceChange[];
}> = ({ balanceChanges }) => {
  const t = useI18nContext();
  const fiatFormatter = useFiatFormatter();
  const totalFiat = calculateTotalFiat(balanceChanges);

  return totalFiat === 0 ? (
    <FiatNotAvailableDisplay />
  ) : (
    <Text {...textStyle}>
      {t('simulationPreviewTotalFiat', [fiatFormatter(Math.abs(totalFiat))])}
    </Text>
  );
};
