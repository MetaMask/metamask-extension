import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  selectBalanceBySelectedAccountGroup,
  selectedAccountNativeBalance,
} from '../../../../selectors/assets';

import {
  AlignItems,
  Display,
  FlexWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, SensitiveText } from '../../../component-library';
import {
  getPreferences,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Skeleton } from '../../../component-library/skeleton';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';

type AccountGroupBalanceProps = {
  classPrefix: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
};

type BalanceDisplayData = {
  totalToDisplay: string | null;
  isLoading: boolean;
};

export const AccountGroupBalance: React.FC<AccountGroupBalanceProps> = ({
  classPrefix,
  balanceIsCached,
  handleSensitiveToggle,
}) => {
  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const { formatCurrency } = useFormatters();

  const selectedGroupBalance = useSelector(selectBalanceBySelectedAccountGroup);
  const selectedAccountNativeBalanceValue = useSelector(
    selectedAccountNativeBalance,
  );
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  const balanceDisplayData = useMemo((): BalanceDisplayData => {
    const total = selectedGroupBalance?.totalBalanceInUserCurrency;
    const currency = selectedGroupBalance?.userCurrency ?? fallbackCurrency;

    let totalToDisplay: string | null = null;

    if (showNativeTokenAsMainBalance && selectedAccountNativeBalanceValue) {
      // Handle null case when multiple chains are enabled
      totalToDisplay = selectedAccountNativeBalanceValue;
    } else if (total !== undefined && currency) {
      totalToDisplay = formatCurrency(total, currency);
    }

    const isLoading =
      !anyEnabledNetworksAreAvailable &&
      (isZeroAmount(total) || currency === undefined);

    return {
      totalToDisplay,
      isLoading,
    };
  }, [
    selectedGroupBalance,
    selectedAccountNativeBalanceValue,
    showNativeTokenAsMainBalance,
    fallbackCurrency,
    anyEnabledNetworksAreAvailable,
    formatCurrency,
  ]);

  return (
    <Skeleton isLoading={balanceDisplayData.isLoading} marginBottom={1}>
      <Box
        className={classnames(`${classPrefix}-overview__primary-balance`, {
          [`${classPrefix}-overview__cached-balance`]: balanceIsCached,
        })}
        data-testid={`${classPrefix}-overview__primary-currency`}
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexWrap={FlexWrap.Wrap}
      >
        <SensitiveText
          ellipsis
          variant={TextVariant.inherit}
          isHidden={privacyMode}
          data-testid="account-value-and-suffix"
          onClick={handleSensitiveToggle}
          className="cursor-pointer transition-colors duration-200 hover:text-text-alternative"
        >
          {balanceDisplayData.totalToDisplay}
        </SensitiveText>
      </Box>
    </Skeleton>
  );
};

export default AccountGroupBalance;
