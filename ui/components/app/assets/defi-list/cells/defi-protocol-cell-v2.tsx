import React from 'react';
import { useSelector } from 'react-redux';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import { SensitiveText } from '../../../../component-library';
import { AvatarType } from '../../../../multichain/avatar-group/avatar-group.types';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import { AvatarGroup } from '../../../../multichain/avatar-group/avatar-group';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import type { DeFiProtocolListItem } from '../types';
import { DeFiSymbolGroup } from './defi-grouped-symbol-cell';

type DeFiProtocolCellV2Props = {
  onClick: (chainId: string, protocolId: string) => void;
  position: DeFiProtocolListItem;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiProtocolCellV2({
  onClick,
  position,
}: DeFiProtocolCellV2Props) {
  const { privacyMode } = useSelector(getPreferences);
  const { trackEvent, createEventBuilder } = useAnalytics();

  const handleClick = () => {
    onClick(position.chainId, position.protocolId);

    trackEvent(
      createEventBuilder(MetaMetricsEventName.DeFiDetailsOpened)
        .addCategory(MetaMetricsEventCategory.DeFi)
        .addProperties({
          location: 'Home',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: position.chainId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          protocol_id: position.protocolId,
        })
        .build(),
    );
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
      headerLeftDisplay={<AssetCellTitle title={position.protocolId} />}
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
