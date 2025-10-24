import {
  Box,
  BoxFlexDirection,
  Text,
  AvatarToken,
  AvatarTokenSize,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { BigNumber } from 'bignumber.js';
import React from 'react';

import { Hex } from '@metamask/utils';
import { ConfirmInfoRowTextTokenUnits } from '../../../../../../../components/app/confirm/info/row/text-token-units';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';

/**
 * Component for displaying a row with a native token amount,
 * symbol, and (optionally) a network image avatar.
 *
 * @param props - The component props.
 * @param props.label - The label to display for the row.
 * @param props.value - The amount of the token. Can be a hex string or BigNumber.
 * @param props.symbol - The symbol for the native token (e.g., 'ETH').
 * @param props.decimals - The number of decimals the native token uses.
 * @param props.imageUrl - (Optional) The URL of the network or token image.
 * @param props.tooltip - (Optional) Tooltip text for additional information.
 * @returns JSX element showing the native token amount and metadata.
 */
export const NativeAmountRow: React.FC<{
  label: string;
  value: Hex | BigNumber;
  symbol: string;
  decimals: number;
  imageUrl?: string;
  tooltip?: string;
}> = ({ label, value, symbol, decimals, tooltip, imageUrl }) => {
  const avatar = imageUrl ? (
    <AvatarToken size={AvatarTokenSize.Xs} src={imageUrl} name={symbol} />
  ) : null;

  return (
    <ConfirmInfoRow label={label} tooltip={tooltip}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />
        {avatar}
        <Text>{symbol}</Text>
      </Box>
    </ConfirmInfoRow>
  );
};
