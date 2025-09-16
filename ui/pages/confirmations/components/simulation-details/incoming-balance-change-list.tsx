import React, { useMemo } from 'react';
import { Box } from '../../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { AlertBalanceChangeRow } from './alert-balance-change-row';
import { BalanceChangeRow } from './balance-change-row';
import { BalanceChange } from './types';
import { TotalFiatDisplay } from './fiat-display';
import { sortBalanceChanges } from './sortBalanceChanges';

/**
 * Special version of BalanceChangeList for incoming tokens that supports alerts
 * on the "You receive" label.
 */
export const IncomingBalanceChangeList: React.FC<{
  heading: string;
  balanceChanges: BalanceChange[];
  testId?: string;
  labelColor?: TextColor;
  transactionId: string;
}> = ({ heading, balanceChanges, testId, labelColor, transactionId }) => {
  const sortedBalanceChanges = useMemo(() => {
    return sortBalanceChanges(balanceChanges);
  }, [balanceChanges]);

  const fiatAmounts = useMemo(() => {
    return sortedBalanceChanges.map((bc) => bc.fiatAmount);
  }, [sortedBalanceChanges]);

  if (sortedBalanceChanges.length === 0) {
    return null; // Hide this component.
  }

  const hasMultipleBalanceChanges = sortedBalanceChanges.length > 1;
  const hasUnlimitedApproval = balanceChanges.some(
    (bc) => bc.isUnlimitedApproval,
  );

  const showFiatTotal = hasMultipleBalanceChanges && !hasUnlimitedApproval;

  return (
    <Box>
      <Box
        data-testid={testId}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={3}
      >
        {sortedBalanceChanges.map((balanceChange, index) => {
          // Use AlertBalanceChangeRow for the first item (which shows the heading)
          if (index === 0) {
            return (
              <AlertBalanceChangeRow
                key={index}
                label={heading}
                balanceChange={balanceChange}
                showFiat={!showFiatTotal && !balanceChange.isUnlimitedApproval}
                labelColor={labelColor}
                transactionId={transactionId}
              />
            );
          }

          // Use regular BalanceChangeRow for subsequent items
          return (
            <BalanceChangeRow
              key={index}
              balanceChange={balanceChange}
              showFiat={!showFiatTotal && !balanceChange.isUnlimitedApproval}
              labelColor={labelColor}
            />
          );
        })}
      </Box>
      {showFiatTotal && (
        <Box display={Display.Flex} flexDirection={FlexDirection.RowReverse}>
          <TotalFiatDisplay fiatAmounts={fiatAmounts} />
        </Box>
      )}
    </Box>
  );
};
