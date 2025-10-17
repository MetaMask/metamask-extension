import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { NameType } from '@metamask/name-controller';
import { BigNumber } from 'bignumber.js';
import React from 'react';

import { Hex } from '@metamask/utils';
import { ConfirmInfoRowTextTokenUnits } from '../../../../../../../components/app/confirm/info/row/text-token-units';
import { Skeleton } from '../../../../../../../components/component-library/skeleton';
import Name from '../../../../../../../components/app/name';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';

/**
 * Component for displaying a row with a token amount and its associated token metadata.
 *
 * @param props - The component props.
 * @param props.label - The label to display for the row.
 * @param props.value - The amount of the token. Can be a hex string or BigNumber.
 * @param props.tokenAddress - The contract address of the token.
 * @param props.chainId - The chain ID on which the token exists.
 * @param props.decimals - The number of decimals the token uses.
 * @param props.tooltip - (Optional) Tooltip text to display for additional information.
 * @returns JSX element showing the token amount and name.
 */
export const TokenAmountRow: React.FC<{
  label: string;
  value: Hex | BigNumber;
  tokenAddress: string;
  chainId: Hex;
  decimals: number | undefined;
  tooltip?: string;
}> = ({ label, value, tokenAddress, chainId, decimals, tooltip }) => {
  return (
    <ConfirmInfoRow label={label} tooltip={tooltip}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        {decimals === undefined ? (
          <Skeleton width="100%" height={20} />
        ) : (
          <ConfirmInfoRowTextTokenUnits value={value} decimals={decimals} />
        )}

        <Name
          value={tokenAddress}
          type={NameType.ETHEREUM_ADDRESS}
          preferContractSymbol
          variation={chainId}
        />
      </Box>
    </ConfirmInfoRow>
  );
};
