import React from 'react';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Box } from '../../../../component-library';
import { Display } from '../../../../../helpers/constants/design-system';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    return (
      <Box display={Display.Flex}>
        <AssetCellTitle title={token.title} />
        {token.isStakeable && (
          <StakeableLink chainId={token.chainId} symbol={token.symbol} />
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => prevProps.token.title === nextProps.token.title, // Only rerender if the title changes
);
