import { InternalAccount } from '@metamask/keyring-api';
import type { CurrencyDisplayProps } from '../../ui/currency-display/currency-display.component';
import type { PRIMARY, SECONDARY } from '../../../helpers/constants/common';

export type UserPrefrencedCurrencyDisplayProps = OverridingUnion<
  CurrencyDisplayProps,
  {
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
