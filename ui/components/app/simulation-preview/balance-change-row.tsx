import React from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';
import { EtherDenomination } from '../../../../shared/constants/common';
import { AssetPill } from './asset-pill';
import { AmountPill } from './amount-pill';
import { BalanceChange } from './types';
import { FiatDisplay } from './fiat-display';

/**
 * Displays a single balance change, including the asset, amount, and fiat value.
 *
 * @param props
 * @param props.label
 * @param props.balanceChange
 * @returns
 */
export const BalanceChangeRow: React.FC<{
  label?: string;
  balanceChange: BalanceChange;
}> = ({ label, balanceChange }) => {
  const { assetInfo, isDecrease, absChange } = balanceChange;
  const absChangeDisplay = assetInfo.isNative
    ? absChange.toDenomination(EtherDenomination.ETH)
    : absChange;
  return (
    <Box
      data-testid="simulation-preview-balance-change-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.flexStart}
    >
      {label && <Text variant={TextVariant.bodyMd}>{label}</Text>}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        marginLeft={'auto'}
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={1}>
          <AmountPill isDecrease={isDecrease} absChange={absChangeDisplay} />
          <AssetPill assetInfo={assetInfo} />
        </Box>
        <FiatDisplay {...balanceChange} />
      </Box>
    </Box>
  );
};
