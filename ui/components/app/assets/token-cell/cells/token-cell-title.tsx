import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React from 'react';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Tag } from '../../../../component-library';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import { useRWAToken } from '../../../../../pages/bridge/hooks/useRWAToken';
import { StockBadge } from '../../stock-badge/stock-badge';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = React.memo(
  ({ token }: TokenCellTitleProps) => {
    const label = token.accountType
      ? ACCOUNT_TYPE_LABELS[token.accountType]
      : undefined;
    const { isStockToken, isTokenTradingOpen } = useRWAToken();
    const tokenIsStock = isStockToken(token);

    return (
      <Box flexDirection={BoxFlexDirection.Row} className="min-w-0">
        <Box flexDirection={BoxFlexDirection.Row} gap={2} className="min-w-0">
          <AssetCellTitle title={token.title} />
          {tokenIsStock && (
            <StockBadge isMarketClosed={!isTokenTradingOpen(token)} />
          )}
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
      nextProps.token.rwaData?.instrumentType &&
    prevProps.token.rwaData?.market?.nextOpen ===
      nextProps.token.rwaData?.market?.nextOpen &&
    prevProps.token.rwaData?.market?.nextClose ===
      nextProps.token.rwaData?.market?.nextClose &&
    prevProps.token.rwaData?.nextPause?.start ===
      nextProps.token.rwaData?.nextPause?.start &&
    prevProps.token.rwaData?.nextPause?.end ===
      nextProps.token.rwaData?.nextPause?.end,
);
