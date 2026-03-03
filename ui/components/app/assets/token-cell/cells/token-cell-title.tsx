import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React from 'react';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Tag } from '../../../../component-library';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import {
  isStockToken,
  useRWAToken,
} from '../../../../../pages/bridge/hooks/useRWAToken';
import { StockBadge } from '../../stock-badge/stock-badge';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

const TokenCellStockBadge = ({ token }: TokenCellTitleProps) => {
  const { isTokenTradingOpen } = useRWAToken();

  return <StockBadge isMarketClosed={!isTokenTradingOpen(token)} />;
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    const label = token.accountType
      ? ACCOUNT_TYPE_LABELS[token.accountType]
      : undefined;
    const tokenIsStock = isStockToken(token);

    return (
      <Box flexDirection={BoxFlexDirection.Row} className="min-w-0">
        <Box flexDirection={BoxFlexDirection.Row} gap={2} className="min-w-0">
          <AssetCellTitle title={token.title} />
          {tokenIsStock && <TokenCellStockBadge token={token} />}
          {label && <Tag label={label} />}
        </Box>
        {token.isStakeable && (
          <StakeableLink chainId={token.chainId} symbol={token.symbol} />
        )}
      </Box>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.title === nextProps.token.title &&
    prevProps.token.rwaData?.instrumentType ===
      nextProps.token.rwaData?.instrumentType,
);
