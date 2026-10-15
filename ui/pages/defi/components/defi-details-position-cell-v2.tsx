import React, { useMemo } from 'react';
import { Box, BoxFlexDirection, Tag } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import type { DeFiUnderlyingPosition } from '@metamask/assets-controllers';
import GenericAssetCellLayout from '../../../components/app/assets/asset-list/cells/generic-asset-cell-layout';
import { AssetCellBadge } from '../../../components/app/assets/asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../../components/app/assets/asset-list/cells/asset-title';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { useTokenDisplayInfo } from '../../../components/app/assets/hooks/useTokenDisplayInfo';
import {
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
} from '../../../components/app/assets/token-cell/cells';
import { mapDefiProtocolDetailsPositionV2ToToken } from './utils/map-defi-protocol-details-position-v2';

type DefiDetailsPositionCellV2Props = {
  position: DeFiUnderlyingPosition;
};

export default function DefiDetailsPositionCellV2({
  position,
}: Readonly<DefiDetailsPositionCellV2Props>) {
  const { privacyMode } = useSelector(getPreferences);

  const token = useMemo(
    () => mapDefiProtocolDetailsPositionV2ToToken(position),
    [position],
  );

  const tokenDisplayInfo = useTokenDisplayInfo({
    token,
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
          <AssetCellTitle title={position.name} />
          <Tag data-testid="defi-details-position-type-tag">
            {position.positionType}
          </Tag>
        </Box>
      }
      headerRightDisplay={
        <TokenCellSecondaryDisplay
          token={displayToken}
          handleScamWarningModal={() => undefined}
          privacyMode={privacyMode}
        />
      }
      // Empty spacer keeps a second flex child so `space-between` still
      // end-aligns the primary balance under the fiat value.
      footerLeftDisplay={
        <span data-testid="defi-details-position-footer-spacer" />
      }
      footerRightDisplay={
        <TokenCellPrimaryDisplay
          token={displayToken}
          privacyMode={privacyMode}
        />
      }
    />
  );
}
