import React from 'react';
import { Point } from 'chart.js';
import {
  Box,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useFormatters } from '../../../../hooks/useFormatters';

// A label indicating the minimum or maximum price on the chart
const ChartTooltip = ({
  point,
  xMin,
  xMax,
  currency,
}: {
  point?: Point;
  xMin?: number;
  xMax?: number;
  currency: string;
}) => {
  const { formatCurrencyTokenPrice } = useFormatters();
  const xAxisPercent =
    point && xMin && xMax ? (point.x - xMin) / (xMax - xMin) : 0;

  return (
    <Box
      style={{
        ...(xAxisPercent < 0.5
          ? { paddingRight: `${100 - 2 * 100 * xAxisPercent}%` }
          : { paddingLeft: `${100 - 2 * (100 - 100 * xAxisPercent)}%` }),
        direction: xAxisPercent < 0.5 ? 'ltr' : 'rtl',
      }}
    >
      <Text
        className="mx-4 my-1"
        variant={TextVariant.BodyXs}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
        textAlign={TextAlign.Center}
      >
        {point?.y === undefined
          ? '\u00A0'
          : formatCurrencyTokenPrice(point?.y, currency)}
      </Text>
    </Box>
  );
};

export default ChartTooltip;
