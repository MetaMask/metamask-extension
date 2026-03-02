import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React from 'react';
import { TokenFiatDisplayInfo } from '../../types';
import { StakeableLink } from '../../../../multichain/token-list-item/stakeable-link';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { IconName, Tag } from '../../../../component-library';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRWAToken } from '../../../../../pages/bridge/hooks/useRWAToken';

type TokenCellTitleProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellTitle = React.memo(({ token }: TokenCellTitleProps) => {
  const t = useI18nContext();
  const { isStockToken, isTokenTradingOpen } = useRWAToken();
  const label = token.accountType
    ? ACCOUNT_TYPE_LABELS[token.accountType]
    : undefined;
  const tokenIsStock = isStockToken(token);
  const isMarketClosed = tokenIsStock && !isTokenTradingOpen(token);
  const stockBadgeLabel = isMarketClosed
    ? t('bridgeMarketClosedBadge')
    : t('tokenStock');

  return (
    <Box flexDirection={BoxFlexDirection.Row} className="min-w-0">
      <Box flexDirection={BoxFlexDirection.Row} gap={2} className="min-w-0">
        <AssetCellTitle title={token.title} />
        {tokenIsStock && (
          <Tag
            label={stockBadgeLabel}
            {...(isMarketClosed ? { startIconName: IconName.Clock } : {})}
          />
        )}
        {label && <Tag label={label} />}
      </Box>
      {token.isStakeable && (
        <StakeableLink chainId={token.chainId} symbol={token.symbol} />
      )}
    </Box>
  );
});
