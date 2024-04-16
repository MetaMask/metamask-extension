import React, { useMemo } from 'react';
import { Box } from '../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { BalanceChangeRow } from './balance-change-row';
import { BalanceChange } from './types';
import { TotalFiatDisplay } from './fiat-display';
import { sortBalanceChanges } from './sortBalanceChanges';

/**
 * Displays a list of incoming or outgoing balance changes, along with a heading and a
 * total fiat amount.
 *
 * @param props
 * @param props.heading
 * @param props.balanceChanges
 * @param props.testId
 * @returns
 */
export const BalanceChangeList: React.FC<{
  heading: string;
  balanceChanges: BalanceChange[];
  testId?: string;
}> = ({ heading, balanceChanges, testId }) => {
  const sortedBalanceChanges = useMemo(() => {
    return sortBalanceChanges(balanceChanges);
  }, [balanceChanges]);

  const fiatAmounts = useMemo(() => {
    return sortedBalanceChanges.map((bc) => bc.fiatAmount);
  }, [sortedBalanceChanges]);

  if (sortedBalanceChanges.length === 0) {
    return null; // Hide this component.
  }
  const showFiatTotal = sortedBalanceChanges.length > 1;

  return (
    <Box>
      <Box
        data-testid={testId}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={3}
      >
        {sortedBalanceChanges.map((balanceChange, index) => (
          <BalanceChangeRow
            key={index}
            label={index === 0 ? heading : undefined}
            balanceChange={balanceChange}
            showFiat={!showFiatTotal}
          />
        ))}
      </Box>
      {showFiatTotal && (
        <Box display={Display.Flex} flexDirection={FlexDirection.RowReverse}>
          <TotalFiatDisplay fiatAmounts={fiatAmounts} />
        </Box>
      )}
    </Box>
  );
};
