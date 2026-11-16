import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import type { CrosshairData } from './advanced-chart-iframe';

export type OHLCVBarProps = {
  /** OHLC(V) of the bar under the crosshair. */
  data: CrosshairData;
  /** Currency the values are priced in (e.g. 'USD'). */
  currency: string;
  /**
   * Percent change vs the period baseline (e.g. `5.25` for +5.25%). When
   * omitted, the Change row is hidden. Mirrors the price header's percentage.
   */
  changePercent?: number;
  'data-testid'?: string;
};

type LabelValueRow = {
  label: string;
  value: string;
  valueColor?: TextColor;
};

/**
 * Colour for the change value: green when up, red when down, muted/default
 * otherwise. Mirrors `getPercentChangeColor` in `token-price-header.tsx` so the
 * crosshair readout and the resting header agree.
 *
 * @param value - The percent change, or undefined when unavailable.
 * @returns The design-system text colour for the value.
 */
const getChangeColor = (value: number | undefined): TextColor => {
  if (value === undefined || Number.isNaN(value)) {
    return TextColor.TextAlternative;
  }
  if (value === 0) {
    return TextColor.TextDefault;
  }
  return value > 0 ? TextColor.SuccessDefault : TextColor.ErrorDefault;
};

const LabelValue = ({ label, value, valueColor }: LabelValueRow) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    gap={2}
  >
    <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
      {label}
    </Text>
    <Text
      variant={TextVariant.BodySm}
      fontWeight={FontWeight.Medium}
      color={valueColor ?? TextColor.TextDefault}
      ellipsis
    >
      {value}
    </Text>
  </Box>
);

const Column = ({ rows }: { rows: LabelValueRow[] }) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    alignItems={BoxAlignItems.Start}
    gap={2}
  >
    {rows.map((row) => (
      <LabelValue key={row.label} {...row} />
    ))}
  </Box>
);

/**
 * Two-column OHLCV readout shown in place of the price header while the user
 * scrubs the candle chart's crosshair. Ports mobile's `OHLCVBar` variant/style:
 * left column Open/Close/(Volume), right column Low/High/(Change).
 *
 * @param props - Component props.
 * @param props.data - OHLC(V) of the bar under the crosshair.
 * @param props.currency - Currency the values are priced in.
 * @param props.changePercent - Percent change vs the period baseline.
 * @param props.data-testid - Optional test id applied to the container.
 * @returns The rendered OHLCV bar.
 */
export const OHLCVBar = ({
  data,
  currency,
  changePercent,
  'data-testid': dataTestId,
}: OHLCVBarProps) => {
  const t = useI18nContext();
  const { formatCurrencyTokenPrice, formatNumber } = useFormatters();

  const fmtPrice = (n: number) => formatCurrencyTokenPrice(n, currency);

  const leftRows: LabelValueRow[] = [
    { label: t('chartOhlcvOpen'), value: fmtPrice(data.open) },
    { label: t('chartOhlcvClose'), value: fmtPrice(data.close) },
  ];
  if (data.volume !== undefined) {
    leftRows.push({
      label: t('chartOhlcvVolume'),
      value:
        Number(data.volume) === 0
          ? '—'
          : formatNumber(data.volume, {
              notation: 'compact',
              maximumFractionDigits: 2,
            }),
    });
  }

  const rightRows: LabelValueRow[] = [
    { label: t('chartOhlcvLow'), value: fmtPrice(data.low) },
    { label: t('chartOhlcvHigh'), value: fmtPrice(data.high) },
  ];
  if (changePercent !== undefined && !Number.isNaN(changePercent)) {
    rightRows.push({
      label: t('chartOhlcvChange'),
      value: formatNumber(changePercent / 100, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always',
      }),
      valueColor: getChangeColor(changePercent),
    });
  }

  return (
    <Box
      data-testid={dataTestId}
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Start}
      className="px-4 pt-2 pb-2 w-full max-w-[320px]"
    >
      <Column rows={leftRows} />
      <Column rows={rightRows} />
    </Box>
  );
};

export default OHLCVBar;
