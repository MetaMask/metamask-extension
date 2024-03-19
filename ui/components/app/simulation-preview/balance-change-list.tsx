import React from 'react';
import { Box } from '../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { BalanceChangeRow } from './balance-change-row';
import { BalanceChange } from './types';
import { TotalFiatDisplay } from './fiat-display';

// const UNAVAILABLE_FIAT = -1;

// function getFiatValue(bc: BalanceChange): number | typeof UNAVAILABLE_FIAT {
//   if (bc.asset === NATIVE_ASSET) {

//   }
// }

// function use

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
    return null; // Hide this component.
  }
  const showIndividualFiat = balanceChanges.length === 1;

  return (
    <Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
        {balanceChanges.map((balanceChange, index) => (
          <BalanceChangeRow
            key={index}
            label={index === 0 ? heading : undefined}
            balanceChange={balanceChange}
            showFiat={showIndividualFiat}
          />
        ))}
      </Box>
      {balanceChanges.length > 1 && (
        <Box display={Display.Flex} flexDirection={FlexDirection.RowReverse}>
          <TotalFiatDisplay balanceChanges={balanceChanges} />
        </Box>
      )}
    </Box>
  );
};
