import React, { useContext } from 'react';
import { DeFiProtocolPosition } from '../defi-list';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { useSelector } from 'react-redux';
import { getPreferences } from '../../../../../selectors';

import {
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import {
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import { AvatarGroup } from '../../../../multichain';
import { AvatarType } from '../../../../multichain/avatar-group/avatar-group.types';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';

type DeFiProtocolCellProps = {
  onClick: (chainId: string, protocolId: string) => void;
  position: DeFiProtocolPosition;
};

export function DefiProtocolCell({ onClick, position }: DeFiProtocolCellProps) {
  const { privacyMode } = useSelector(getPreferences);
  const trackEvent = useContext(MetaMetricsContext);

  const handleTokenClick = (token: DeFiProtocolPosition) => () => {
    onClick(token.chainId, token.protocolId);

    trackEvent({
      category: MetaMetricsEventCategory.DeFi,
      event: MetaMetricsEventName.DeFiDetailsOpened,
      properties: {
        location: 'Home',
        chain_id: token.chainId,
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
          tokenImage={position.tokenImage}
          symbol={position.protocolId}
        />
      }
      priaryDisplayLeft={<AssetCellTitle title={position.title} />}
      secondaryDisplayRight={
        <AvatarGroup
          avatarType={AvatarType.TOKEN}
          limit={4}
          members={position.iconGroup}
          data-testid="defi-list-avatar-group"
        />
      }
      secondaryDisplayLeft={
        <SensitiveText
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.End}
          data-testid="defi-list-item-secondary-value"
          isHidden={privacyMode}
          length={SensitiveTextLength.Medium}
        >
          {position.symbolGroup}
        </SensitiveText>
      }
      primaryDisplayRight={
        <SensitiveText
          color={TextColor.textAlternativeSoft}
          variant={TextVariant.bodySmMedium}
          isHidden={privacyMode}
        >
          {position.marketValue}
        </SensitiveText>
      }
    />
  );
}
