import type { ReactElement } from 'react';
import type { EtherDenomination } from '../../../../shared/constants/common';
import type { CurrencyDisplayProps } from '../../ui/currency-display/currency-display.component';
import type { PRIMARY, SECONDARY } from '../../../helpers/constants/common';

export interface UserPrefrencedCurrencyDisplayProps
  extends CurrencyDisplayProps {
  type: PRIMARY | SECONDARY;
  currency?: string;
  showEthLogo?: boolean;
  ethLogoHeight?: number;
  ethNumberOfDecimals?: string | number;
  fiatNumberOfDecimals?: string | number;
  showFiat?: boolean;
  showNative?: boolean;
  showCurrencySuffix?: boolean;
}

declare const UserPrefrencedCurrencyDisplay: React.FC<UserPrefrencedCurrencyDisplayProps>;
export default UserPrefrencedCurrencyDisplay;
