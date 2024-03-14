import type { ReactElement } from 'react';
import type { EtherDenomination } from '../../../../shared/constants/common';

export type CurrencyDisplayProps = OverridingUnion<
  React.HTMLAttributes<HTMLElement>,
  {
    currency: string;
    className?: string;
    'data-testid'?: string;
    denomination?: EtherDenomination.GWEI | EtherDenomination.ETH;
    displayValue?: string;
    hideLabel?: boolean;
    hideTitle?: boolean;
    numberOfDecimals?: string | number;
    prefix?: string;
    prefixComponent?: ReactElement;
    suffix?: string | boolean;
    value?: string;
    prefixComponentWrapperProps?: Record<string, any>;
    textProps?: Record<string, any>;
    suffixProps?: Record<string, any>;
  }
>;

declare const CurrencyDisplay: React.FC<CurrencyDisplayProps>;
export default CurrencyDisplay;
