import { InternalAccount } from '@metamask/keyring-internal-api';
import type { CurrencyDisplayProps } from '../../ui/currency-display/currency-display.component';
import type { PRIMARY, SECONDARY } from '../../../helpers/constants/common';

export type UserPrefrencedCurrencyDisplayProps = OverridingUnion<
  CurrencyDisplayProps,
  {
    type?: PRIMARY | SECONDARY;
    account?: InternalAccount;
    currency?: string;
    ethNumberOfDecimals?: string | number;
    showFiat?: boolean;
    showNative?: boolean;
    shouldCheckShowNativeToken?: boolean;
    isAggregatedFiatOverviewBalance?: boolean;
    privacyMode?: boolean;
  }
>;

declare const UserPrefrencedCurrencyDisplay: React.FC<UserPrefrencedCurrencyDisplayProps>;
export default UserPrefrencedCurrencyDisplay;
