import React from 'react';
import { useSelector } from 'react-redux';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import { SensitiveText } from '../../../../component-library';
import { AvatarType } from '../../../../multichain/avatar-group/avatar-group.types';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { AvatarGroup } from '../../../../multichain/avatar-group/avatar-group';
import type { DeFiProtocolListItem } from '../types';
import { DeFiSymbolGroup } from './defi-grouped-symbol-cell';

type DeFiProtocolCellV2Props = {
  position: DeFiProtocolListItem;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiProtocolCellV2({
  position,
}: DeFiProtocolCellV2Props) {
  const { privacyMode } = useSelector(getPreferences);

  const handleClick = () => {
    // DeFi details navigation will be wired up in a follow-up change.
  };

  return (
    <GenericAssetCellLayout
      key={`${position.chainId}-${position.protocolId}`}
      onClick={handleClick}
      badge={
        <AssetCellBadge
          chainId={position.chainId}
          data-testid="defi-list-protocol-badge"
          tokenImage={position.tokenImage}
          symbol={position.protocolId}
        />
      }
      headerLeftDisplay={<AssetCellTitle title={position.title} />}
      headerRightDisplay={
        <SensitiveText
          className="text-s-body-md @compact:text-s-body-sm"
          isHidden={privacyMode}
          data-testid="defi-list-market-value"
        >
          {position.marketValue}
        </SensitiveText>
      }
      footerLeftDisplay={
        <DeFiSymbolGroup
          privacyMode={privacyMode}
          symbols={position.underlyingSymbols}
        />
      }
      footerRightDisplay={
        <AvatarGroup
          avatarType={AvatarType.TOKEN}
          limit={4}
          members={position.iconGroup}
        />
      }
    />
  );
}
