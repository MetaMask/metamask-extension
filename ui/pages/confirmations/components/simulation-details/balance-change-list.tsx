import React, { useMemo } from 'react';
import { Box } from '../../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../context/confirm';
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
 * @param props.labelColor
 * @returns
 */
export const BalanceChangeList: React.FC<{
  heading: string;
  balanceChanges: BalanceChange[];
  testId?: string;
  labelColor?: TextColor;
}> = ({ heading, balanceChanges, testId, labelColor }) => {
  const { currentConfirmation } = useConfirmContext();
  const sortedBalanceChanges = useMemo(() => {
    return sortBalanceChanges(balanceChanges);
  }, [balanceChanges]);

  const fiatAmounts = useMemo(() => {
    return sortedBalanceChanges.map((bc) => bc.fiatAmount);
  }, [sortedBalanceChanges]);

  const hasIncomingTokens = useMemo(() => {
    return balanceChanges.some((bc) => bc.amount && !bc.amount.isNegative());
  }, [balanceChanges]);

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
        {sortedBalanceChanges.map((balanceChange, index) => (
          <BalanceChangeRow
            key={index}
            label={index === 0 ? heading : undefined}
            isFirstRow={index === 0}
            hasIncomingTokens={hasIncomingTokens}
            confirmationId={currentConfirmation?.id}
            balanceChange={balanceChange}
            showFiat={!showFiatTotal && !balanceChange.isUnlimitedApproval}
            labelColor={labelColor}
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
