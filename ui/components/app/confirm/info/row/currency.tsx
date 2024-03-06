import React from 'react';

import {
  AlignItems,
  Display,
  FlexWrap,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';
import UserPreferencedCurrencyDisplay from '../../../user-preferenced-currency-display/user-preferenced-currency-display.component';
import CurrencyDisplay from '../../../../ui/currency-display/currency-display.component';

export type ConfirmInfoRowCurrencyProps = {
  value: number | string;
  currency?: string;
};

// todo: the component currently takes care of displaying value in the currency passed
// it will default to using User's preferred currency.
// As we encounter different use cases in future we would need to extend this
// to support more configurations / formatting options.
export const ConfirmInfoRowCurrency = ({
  value,
  currency,
}: ConfirmInfoRowCurrencyProps) => (
  <Box
    display={Display.Flex}
    alignItems={AlignItems.center}
    flexWrap={FlexWrap.Wrap}
    style={{
      columnGap: '8px',
      fontSize: 'var(--font-size-3)',
    }}
  >
    {currency ? (
      <CurrencyDisplay currency={currency} value={`${value}`} />
    ) : (
      <UserPreferencedCurrencyDisplay value={`${value}`} />
    )}
  </Box>
);
