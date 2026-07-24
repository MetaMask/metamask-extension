import React from 'react';
import { useSelector } from 'react-redux';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import { SensitiveText } from '../../../../component-library';
import { AvatarType } from '../../../../multichain/avatar-group/avatar-group.types';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import { DeFiProtocolPosition } from '../../types';
import { AvatarGroup } from '../../../../multichain/avatar-group/avatar-group';
import { DeFiSymbolGroup } from './defi-grouped-symbol-cell';

type DeFiProtocolCellProps = {
  onClick: (chainId: string, protocolId: string) => void;
  position: DeFiProtocolPosition;
};

export default function DefiProtocolCell({
  onClick,
  position,
}: DeFiProtocolCellProps) {
  const { privacyMode } = useSelector(getPreferences);
  const { trackEvent, createEventBuilder } = useAnalytics();

  const handleTokenClick = (token: DeFiProtocolPosition) => () => {
    onClick(token.chainId, token.protocolId);

    trackEvent(
      createEventBuilder(MetaMetricsEventName.DeFiDetailsOpened)
        .addCategory(MetaMetricsEventCategory.DeFi)
        .addProperties({
          location: 'Home',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          protocol_id: token.protocolId,
        })
        .build(),
    );
  };

  return (
    <GenericAssetCellLayout
      key={`${position.chainId}-${position.protocolId}`}
      onClick={handleTokenClick(position)}
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
