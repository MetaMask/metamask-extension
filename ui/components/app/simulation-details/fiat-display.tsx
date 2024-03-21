import React from 'react';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Text } from '../../component-library';
import { SizeNumber } from '../../component-library/box/box.types';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { BalanceChange, FIAT_UNAVAILABLE, FiatAmount } from './types';

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
 * Displays the fiat value of a single balance change.
 *
 * @param props
 * @param props.fiatAmount
 */
export const IndividualFiatDisplay: React.FC<{ fiatAmount: FiatAmount }> = ({
  fiatAmount,
}) => {
  const fiatFormatter = useFiatFormatter();
  if (fiatAmount === FIAT_UNAVAILABLE) {
    return <FiatNotAvailableDisplay />;
  }
  const absFiat = Math.abs(fiatAmount);

  return <Text {...textStyle}>{fiatFormatter(absFiat)}</Text>;
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

  const totalFiat = balanceChanges.reduce((total, { fiatAmount }) => {
    return fiatAmount === FIAT_UNAVAILABLE ? total : total + fiatAmount;
  }, 0);

  return totalFiat === 0 ? (
    <FiatNotAvailableDisplay />
  ) : (
    <Text {...textStyle}>
      {t('simulationPreviewTotalFiat', [fiatFormatter(Math.abs(totalFiat))])}
    </Text>
  );
};
