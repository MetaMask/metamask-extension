import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors';
import { Box, SensitiveText } from '../../../component-library';
import { useAccountGroupBalanceDisplay } from './useAccountGroupBalanceDisplay';

export type AccountGroupBalanceChangeProps = {
  period: BalanceChangePeriod;
};

const balanceAmountSpanStyle = { whiteSpace: 'pre' } as const;

const AccountGroupBalanceChangeComponent: React.FC<
  AccountGroupBalanceChangeProps
> = ({ period }) => {
  const { privacyMode, color, displayAmountChange, displayPercentChange } =
    useAccountGroupBalanceDisplay(period);

  return (
    <Box display={Display.Flex}>
      <SensitiveText
        variant={TextVariant.bodyMdMedium}
        color={color}
        style={balanceAmountSpanStyle}
        data-testid="account-group-balance-change-value"
        isHidden={privacyMode}
        ellipsis
        length="10"
      >
        {displayAmountChange}
      </SensitiveText>
      <SensitiveText
        variant={TextVariant.bodyMdMedium}
        color={color}
        data-testid="account-group-balance-change-percentage"
        isHidden={privacyMode}
        ellipsis
        length="10"
      >
        {' '}
        {displayPercentChange}
      </SensitiveText>
    </Box>
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
