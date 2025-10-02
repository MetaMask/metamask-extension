import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getIsMultichainAccountsState2Enabled,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { Box, SensitiveText } from '../../../component-library';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';
import { Skeleton } from '../../../component-library/skeleton';
import { useAccountGroupBalanceDisplay } from './useAccountGroupBalanceDisplay';

export type AccountGroupBalanceChangeProps = {
  period: BalanceChangePeriod;
  portfolioButton: () => JSX.Element | null;
};

const balanceAmountSpanStyle = { whiteSpace: 'pre' } as const;

const AccountGroupBalanceChangeComponent: React.FC<
  AccountGroupBalanceChangeProps
> = ({ period, portfolioButton }) => {
  const { privacyMode, color, amountChange, percentChange } =
    useAccountGroupBalanceDisplay(period);
  const { formatCurrency, formatPercentWithMinThreshold } = useFormatters();
  const currency = useSelector(getCurrentCurrency);
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  return (
    <Skeleton
      isLoading={!anyEnabledNetworksAreAvailable && isZeroAmount(amountChange)}
    >
      <Box display={Display.Flex} gap={1}>
        <SensitiveText
          variant={TextVariant.bodyMdMedium}
          color={color}
          style={balanceAmountSpanStyle}
          data-testid="account-group-balance-change-value"
          isHidden={privacyMode}
          ellipsis
          length="10"
        >
          {formatCurrency(amountChange, currency, { signDisplay: 'always' })}
        </SensitiveText>
        <SensitiveText
          variant={TextVariant.bodyMdMedium}
          color={color}
          data-testid="account-group-balance-change-percentage"
          isHidden={privacyMode}
          ellipsis
          length="10"
        >
          {`(${formatPercentWithMinThreshold(percentChange, { signDisplay: 'always' })})`}
        </SensitiveText>
      </Box>
      {portfolioButton()}
    </Skeleton>
  );
};

export const AccountGroupBalanceChange: React.FC<
  AccountGroupBalanceChangeProps
> = (props) => {
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  if (!isMultichainAccountsState2Enabled) {
    return null;
  }

  return <AccountGroupBalanceChangeComponent {...props} />;
};
