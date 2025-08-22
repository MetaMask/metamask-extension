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
    suffix?: string | boolean;
    value?: string;

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    textProps?: Record<string, any>;

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suffixProps?: Record<string, any>;
  }
>;

declare const CurrencyDisplay: React.FC<CurrencyDisplayProps>;
export default CurrencyDisplay;
