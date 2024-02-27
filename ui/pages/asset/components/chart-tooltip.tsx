import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  TextDirection,
} from '../../../components/component-library';
import { getCurrentCurrency } from '../../../selectors';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import {
  BackgroundColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getPricePrecision } from './util';

// A label indicating the minimum or maximum price on the chart
const ChartTooltip = forwardRef(
  ({ backgroundColor }: { backgroundColor: BackgroundColor }, ref) => {
    const currency = useSelector(getCurrentCurrency);

    const [{ xAxisPercent, price }, setTooltip] = useState<{
      xAxisPercent: number;
      price?: number;
    }>({ xAxisPercent: 0 });

    useImperativeHandle(ref, () => ({ setTooltip }));

    return (
      <Box
        backgroundColor={backgroundColor}
        style={{
          ...(xAxisPercent < 0.5
            ? { paddingRight: `${100 - 2 * 100 * xAxisPercent}%` }
            : { paddingLeft: `${100 - 2 * (100 - 100 * xAxisPercent)}%` }),
        }}
      >
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
          textDirection={
            xAxisPercent < 0.5
              ? TextDirection.LeftToRight
              : TextDirection.RightToLeft
          }
        >
          {price === undefined
            ? '\u00A0'
            : formatCurrency(`${price}`, currency, getPricePrecision(price))}
        </Text>
      </Box>
    );
  },
);

export default ChartTooltip;
