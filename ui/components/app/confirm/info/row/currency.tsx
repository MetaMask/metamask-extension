import React from 'react';

import { Box, BoxAlignItems, BoxFlexWrap } from '@metamask/design-system-react';
import UserPreferencedCurrencyDisplay from '../../../user-preferenced-currency-display/user-preferenced-currency-display.component';
import CurrencyDisplay from '../../../../ui/currency-display/currency-display.component';

export type ConfirmInfoRowCurrencyProps = {
  value: number | string;
  currency?: string;
  'data-testid'?: string;
  className?: string;
  chainId?: string;
};

// todo: the component currently takes care of displaying value in the currency passed
// it will default to using User's preferred currency.
// As we encounter different use cases in future we would need to extend this
// to support more configurations / formatting options.
export const ConfirmInfoRowCurrency = ({
  value,
  currency,
  'data-testid': dataTestId,
  className,
  chainId,
}: ConfirmInfoRowCurrencyProps) => (
  <Box
    className="flex"
    alignItems={BoxAlignItems.Center}
    flexWrap={BoxFlexWrap.Wrap}
    style={{
      columnGap: '8px',
      fontSize: 'var(--font-size-3)',
    }}
    data-testid={dataTestId}
  >
    {currency ? (
      <CurrencyDisplay
        currency={currency}
        value={`${value}`}
        className={className}
        chainId={chainId}
      />
    ) : (
      <UserPreferencedCurrencyDisplay
        showNative
        value={`${value}`}
        className={className}
        chainId={chainId}
      />
    )}
  </Box>
);
