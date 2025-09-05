import React from 'react';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Point } from 'chart.js';
import {
  Box,
  Text,
  TextDirection,
} from '../../../../components/component-library';
import {
  threeSignificantDigits,
  useFormatters,
} from '../../../../helpers/formatters';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

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
        direction:
          xAxisPercent < 0.5
            ? TextDirection.LeftToRight
            : TextDirection.RightToLeft,
      }}
    >
      <Text
        marginLeft={4}
        marginRight={4}
        marginBottom={1}
        marginTop={1}
        variant={TextVariant.bodyXsMedium}
        color={TextColor.textAlternative}
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
