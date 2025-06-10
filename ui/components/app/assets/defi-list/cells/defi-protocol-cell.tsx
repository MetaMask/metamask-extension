import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { getPreferences } from '../../../../../selectors';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { SensitiveText } from '../../../../component-library';
import { AvatarType } from '../../../../multichain/avatar-group/avatar-group.types';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { DeFiProtocolPosition } from '../../types';
import { AvatarGroup } from '../../../../multichain/avatar-group/avatar-group';
import { DeFiSymbolGroup } from './defi-grouped-symbol-cell';

type DeFiProtocolCellProps = {
  onClick: (chainId: string, protocolId: string) => void;
  position: DeFiProtocolPosition;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DefiProtocolCell({
  onClick,
  position,
}: DeFiProtocolCellProps) {
  const { privacyMode } = useSelector(getPreferences);
  const trackEvent = useContext(MetaMetricsContext);

  const handleTokenClick = (token: DeFiProtocolPosition) => () => {
    onClick(token.chainId, token.protocolId);

    trackEvent({
      category: MetaMetricsEventCategory.DeFi,
      event: MetaMetricsEventName.DeFiDetailsOpened,
      properties: {
        location: 'Home',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: token.chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        protocol_id: token.protocolId,
      },
    });
  };

  return (
    <GenericAssetCellLayout
      key={`${position.chainId}-${position.protocolId}`}
      onClick={handleTokenClick(position)}
      disableHover={false}
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
          variant={TextVariant.bodyMdMedium}
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
