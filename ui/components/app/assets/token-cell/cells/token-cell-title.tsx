import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { BtcAccountType, type KeyringAccountType } from '@metamask/keyring-api';
import React from 'react';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Tag } from '../../../../component-library';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

const accountTypeLabel: Partial<Record<KeyringAccountType, string>> = {
  [BtcAccountType.P2pkh]: 'Legacy',
  [BtcAccountType.P2sh]: 'Nested SegWit',
  [BtcAccountType.P2wpkh]: 'Native SegWit',
  [BtcAccountType.P2tr]: 'Taproot',
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    const label = token.accountType
      ? accountTypeLabel[token.accountType]
      : undefined;
    return (
      <Box flexDirection={BoxFlexDirection.Row}>
        <Box flexDirection={BoxFlexDirection.Row} gap={2}>
          <AssetCellTitle title={token.title} />
          {label && <Tag label={label} />}
        </Box>
        {token.isStakeable && (
          <StakeableLink chainId={token.chainId} symbol={token.symbol} />
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => prevProps.token.title === nextProps.token.title, // Only rerender if the title changes
);
