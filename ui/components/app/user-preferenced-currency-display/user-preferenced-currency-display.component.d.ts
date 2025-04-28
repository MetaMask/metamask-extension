import { InternalAccount } from '@metamask/keyring-internal-api';
import type { CurrencyDisplayProps } from '../../ui/currency-display/currency-display.component';
import type { PRIMARY, SECONDARY } from '../../../helpers/constants/common';

export type UserPrefrencedCurrencyDisplayProps = OverridingUnion<
  CurrencyDisplayProps,
  {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31882
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    type?: PRIMARY | SECONDARY;
    account?: InternalAccount;
    currency?: string;
    showEthLogo?: boolean;
    ethNumberOfDecimals?: string | number;
    fiatNumberOfDecimals?: string | number;
    showFiat?: boolean;
    showNative?: boolean;
    showCurrencySuffix?: boolean;
    shouldCheckShowNativeToken?: boolean;
    isAggregatedFiatOverviewBalance?: boolean;
    privacyMode?: boolean;
  }
>;

declare const UserPrefrencedCurrencyDisplay: React.FC<UserPrefrencedCurrencyDisplayProps>;
export default UserPrefrencedCurrencyDisplay;
