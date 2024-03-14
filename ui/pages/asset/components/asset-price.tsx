import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { getPricePrecision, loadingOpacity, shortDateFormatter } from '../util';

const chartUp = (
  <svg
    className="chart-up"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.75 3.8125L6.25 7.4875L4.91667 5.3875L2.25 8.1875"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.08398 3.8125H9.75065V5.5625"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);
const chartDown = (
  <svg
    className="chart-down"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.75 8.1875L6.25 4.5125L4.91667 6.6125L2.25 3.8125"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.08398 8.1875H9.75065V6.4375"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

// A component that shows the price of an asset at a
// certain time, along with the delta from a previous price.
const AssetPrice = forwardRef(
  (
    props: {
      loading: boolean;
      currency: string;
      price?: number;
      date: number;
      comparePrice?: number;
    },
    ref,
  ) => {
    const [{ price, date }, setPrice] = useState({
      price: props.price,
      date: props.date,
    });
    useImperativeHandle(ref, () => ({ setPrice }));

    const { loading, currency, comparePrice } = props;
    const priceDelta =
      price !== undefined && comparePrice !== undefined
        ? price - comparePrice
        : undefined;

    return (
      <Box>
        <Text
          style={{ width: '100px' }}
          variant={TextVariant.headingLg}
          borderRadius={BorderRadius.LG}
          marginBottom={1}
          backgroundColor={
            loading && !price
              ? BackgroundColor.backgroundAlternative
              : BackgroundColor.transparent
          }
        >
          {price
            ? formatCurrency(`${price}`, currency, getPricePrecision(price))
            : '\u00A0'}
        </Text>
        <Box>
          {priceDelta !== undefined && comparePrice !== undefined ? (
            <Box style={{ opacity: loading ? loadingOpacity : 1 }}>
              {priceDelta >= 0 ? chartUp : chartDown}
              <Text
                display={Display.InlineBlock}
                variant={TextVariant.bodyMdMedium}
                marginLeft={1}
                marginRight={1}
                color={
                  priceDelta >= 0
                    ? TextColor.successDefault
                    : TextColor.errorDefault
                }
              >
                {formatCurrency(
                  `${Math.abs(priceDelta)}`,
                  currency,
                  getPricePrecision(priceDelta),
                )}{' '}
                ({priceDelta >= 0 ? '+' : ''}
                {(100 * (priceDelta / comparePrice)).toFixed(2)}%)
              </Text>
              <Text
                display={Display.InlineBlock}
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternative}
              >
                {shortDateFormatter.format(date)}
              </Text>
            </Box>
          ) : (
            <Text
              style={{ width: '200px' }}
              backgroundColor={
                loading
                  ? BackgroundColor.backgroundAlternative
                  : BackgroundColor.transparent
              }
              borderRadius={BorderRadius.LG}
              variant={TextVariant.bodyMdMedium}
            >
              {'\u00A0'}
            </Text>
          )}
        </Box>
      </Box>
    );
  },
);

export default AssetPrice;
