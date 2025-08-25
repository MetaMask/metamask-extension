import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Text } from '../../../../components/component-library';
import { SizeNumber } from '../../../../components/component-library/box/box.types';
import Tooltip from '../../../../components/ui/tooltip';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getShouldShowFiat } from '../../../../selectors';
import { FIAT_UNAVAILABLE, FiatAmount } from './types';

const textStyle = {
  color: TextColor.textAlternative,
  variant: TextVariant.bodySm,
  paddingRight: 2 as SizeNumber,
  textAlign: 'right' as TextAlign,
} as const;

const FiatNotAvailableDisplay: React.FC = () => {
  const t = useI18nContext();
  return <Text {...textStyle}>{t('simulationDetailsFiatNotAvailable')}</Text>;
};

export function calculateTotalFiat(fiatAmounts: FiatAmount[]): number {
  return fiatAmounts.reduce((total: number, fiat) => {
    return total + (fiat === FIAT_UNAVAILABLE ? 0 : fiat);
  }, 0);
}

/**
 * Displays the fiat value of a single balance change.
 *
 * @param props - The props object.
 * @param props.fiatAmount - The fiat amount to display.
 * @param props.shorten - Whether to shorten the fiat amount.
 */
export const IndividualFiatDisplay: React.FC<{
  fiatAmount: FiatAmount;
  shorten?: boolean;
}> = ({ fiatAmount, shorten = false }) => {
  const shouldShowFiat = useSelector(getShouldShowFiat);
  const fiatFormatter = useFiatFormatter();

  if (!shouldShowFiat) {
    return null;
  }

  if (fiatAmount === FIAT_UNAVAILABLE) {
    return null;
  }
  const absFiat = Math.abs(fiatAmount);
  const isNonZeroSmallValue =
    absFiat &&
    new BigNumber(String(absFiat)).lt(new BigNumber(0.01)) &&
    new BigNumber(String(absFiat)).greaterThan(new BigNumber(0));
  const fiatDisplayValue = isNonZeroSmallValue
    ? `< ${fiatFormatter(0.01, { shorten })}`
    : fiatFormatter(absFiat, { shorten });

  return shorten ? (
    <Tooltip position="bottom" title={fiatDisplayValue} interactive>
      <Text {...textStyle} data-testid="individual-fiat-display">
        {fiatDisplayValue}
      </Text>
    </Tooltip>
  ) : (
    <Text {...textStyle} data-testid="individual-fiat-display">
      {fiatDisplayValue}
    </Text>
  );
};

/**
 * Displays the total fiat value of a list of balance changes.
 *
 * @param props
 * @param props.fiatAmounts
 */
export const TotalFiatDisplay: React.FC<{
  fiatAmounts: FiatAmount[];
}> = ({ fiatAmounts }) => {
  const shouldShowFiat = useSelector(getShouldShowFiat);
  const t = useI18nContext();
  const fiatFormatter = useFiatFormatter();
  const totalFiat = calculateTotalFiat(fiatAmounts);

  if (!shouldShowFiat) {
    return null;
  }

  const totalFiatShorten = fiatFormatter(Math.abs(totalFiat), {
    shorten: true,
    truncatedCharLimit: 20,
    truncatedStartChars: 17,
  });

  return totalFiat === 0 ? (
    <FiatNotAvailableDisplay />
  ) : (
    <Text {...textStyle}>
      {t('simulationDetailsTotalFiat', [totalFiatShorten])}
    </Text>
  );
};
