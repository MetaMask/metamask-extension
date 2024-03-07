import React from 'react';
import {
  Point,
  // @ts-expect-error suppress CommonJS vs ECMAScript error
} from 'chart.js';
import {
  Box,
  Text,
  TextDirection,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getPricePrecision } from '../util';

// A label indicating the minimum or maximum price on the chart
const ChartTooltip = ({
  point,
  xMin,
  xMax,
  currency,
}: {
  point?: Point;
  xMin?: Point;
  xMax?: Point;
  currency: string;
}) => {
  const xAxisPercent =
    point && xMin && xMax ? (point.x - xMin.x) / (xMax.x - xMin.x) : 0;

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
        variant={TextVariant.bodySmMedium}
        color={TextColor.textAlternative}
        textAlign={TextAlign.Center}
      >
        {point?.y === undefined
          ? '\u00A0'
          : formatCurrency(
              `${point?.y}`,
              currency,
              getPricePrecision(point?.y),
            )}
      </Text>
    </Box>
  );
};

export default ChartTooltip;
