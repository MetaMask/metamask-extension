import React, { useMemo } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { Tag } from '../../../../component-library';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import { useTokenDisplayInfo } from '../../hooks/useTokenDisplayInfo';
import {
  TokenCellPercentChange,
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
} from '../../token-cell/cells';
import type { DefiProtocolDetailsPosition } from '../utils/group-defi-protocol-details';
import { mapDefiProtocolDetailsPositionV2ToToken } from '../utils/map-defi-protocol-details-position-v2';

type DefiDetailsPositionCellV2Props = {
  position: DefiProtocolDetailsPosition;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DefiDetailsPositionCellV2({
  position,
}: DefiDetailsPositionCellV2Props) {
  const { privacyMode } = useSelector(getPreferences);

  const token = useMemo(
    () => mapDefiProtocolDetailsPositionV2ToToken(position),
    [position],
  );

  const tokenDisplayInfo = useTokenDisplayInfo({
    token,
    fixCurrencyToUSD: true,
  });

  const displayToken = useMemo(
    () => ({
      ...token,
      ...tokenDisplayInfo,
    }),
    [token, tokenDisplayInfo],
  );

  return (
    <GenericAssetCellLayout
      badge={
        <AssetCellBadge
          chainId={displayToken.chainId}
          tokenImage={displayToken.tokenImage}
          symbol={displayToken.symbol}
          assetId={displayToken.assetId}
        />
      }
      headerLeftDisplay={
        <Box flexDirection={BoxFlexDirection.Row} gap={2} className="min-w-0">
          <AssetCellTitle title={displayToken.title} />
          {position.positionType ? (
            <Tag
              label={position.positionType}
              data-testid="defi-details-position-type-tag"
            />
          ) : null}
        </Box>
      }
      headerRightDisplay={
        <TokenCellSecondaryDisplay
          token={displayToken}
          handleScamWarningModal={() => undefined}
          privacyMode={privacyMode}
        />
      }
      footerLeftDisplay={<TokenCellPercentChange token={displayToken} />}
      footerRightDisplay={
        <TokenCellPrimaryDisplay
          token={displayToken}
          privacyMode={privacyMode}
        />
      }
    />
  );
}
