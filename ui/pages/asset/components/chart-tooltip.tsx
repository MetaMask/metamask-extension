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
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getPricePrecision } from './util';

const ChartTooltip = forwardRef((_, ref) => {
  const currency = useSelector(getCurrentCurrency);

  const [{ xAxisPercent, price }, setTooltip] = useState<{
    xAxisPercent: number;
    price?: number;
  }>({ xAxisPercent: 0 });

  useImperativeHandle(ref, () => ({ setTooltip }));

  return (
    <Box
      style={{
        ...(xAxisPercent < 0.5
          ? { marginRight: `${100 - 2 * 100 * xAxisPercent}%` }
          : { marginLeft: `${100 - 2 * (100 - 100 * xAxisPercent)}%` }),
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
});

export default ChartTooltip;
