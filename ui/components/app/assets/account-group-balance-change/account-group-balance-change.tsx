import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import React from 'react';
import { useSelector } from 'react-redux';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';

import { TextVariant } from '../../../../helpers/constants/design-system';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { SensitiveText } from '../../../component-library';
import { useAccountGroupBalanceDisplay } from './useAccountGroupBalanceDisplay';

export type AccountGroupBalanceChangeProps = {
  period: BalanceChangePeriod;
  trailingChild: () => JSX.Element | null;
};

const balanceAmountSpanStyle = { whiteSpace: 'pre' } as const;

const AccountGroupBalanceChangeComponent = ({
  period,
  trailingChild,
}: AccountGroupBalanceChangeProps) => {
  const { privacyMode, color, amountChange, percentChange, isLoading } =
    useAccountGroupBalanceDisplay(period);
  const { formatCurrency, formatPercentWithMinThreshold } = useFormatters();
  const currency = useSelector(getCurrentCurrency);

  return (
    <Skeleton hideChildren={isLoading}>
      <Box flexDirection={BoxFlexDirection.Row} gap={1} className="flex">
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
      {trailingChild()}
    </Skeleton>
  );
};

export const AccountGroupBalanceChange = (
  props: AccountGroupBalanceChangeProps,
) => <AccountGroupBalanceChangeComponent {...props} />;
