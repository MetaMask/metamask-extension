import type { ReactElement } from 'react';
import type { EtherDenomination } from '../../../../shared/constants/common';

export type CurrencyDisplayProps = OverridingUnion<
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
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
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prefixComponentWrapperProps?: Record<string, any>;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    textProps?: Record<string, any>;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suffixProps?: Record<string, any>;
  }
>;

declare const CurrencyDisplay: React.FC<CurrencyDisplayProps>;
export default CurrencyDisplay;
