import React from 'react';
import { Box } from '../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { BalanceChangeRow } from './balance-change-row';
import { BalanceChange } from './types';

/**
 * Displays a list of incoming or outgoing balance changes, along with a heading and a
 * total fiat amount.
 *
 * @param props
 * @param props.heading
 * @param props.balanceChanges
 * @returns
 */
export const BalanceChangeList: React.FC<{
  heading: string;
  balanceChanges: BalanceChange[];
}> = ({ heading, balanceChanges }) => {
  if (balanceChanges.length === 0) {
    return null;
  }
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={1}>
      <BalanceChangeRow
        key={0}
        balanceChange={balanceChanges[0]}
        label={heading}
      />
      {balanceChanges.slice(1).map((balanceChange, index) => (
        <BalanceChangeRow key={index + 1} balanceChange={balanceChange} />
      ))}
    </Box>
  );
};
