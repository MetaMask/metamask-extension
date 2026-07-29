import React from 'react';
import { useSelector } from 'react-redux';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import {
  AvatarGroup,
  AvatarGroupSize,
  AvatarGroupVariant,
  SensitiveText,
} from '@metamask/design-system-react';
import GenericAssetCellLayout from '../../asset-list/cells/generic-asset-cell-layout';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import { AssetCellBadge } from '../../asset-list/cells/asset-cell-badge';
import { AssetCellTitle } from '../../asset-list/cells/asset-title';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import { DeFiSymbolGroup } from './defi-grouped-symbol-cell';

/**
 * Extension UI row for the DeFi tab list: core protocol-group fields plus
 * presentation-only values this cell needs.
 */
export type DeFiProtocolListItem = Pick<
  DeFiProtocolPositionGroup,
  'chainId' | 'protocolId' | 'iconGroup'
> & {
  tokenImage: DeFiProtocolPositionGroup['protocolIconUrl'];
  underlyingSymbols: DeFiProtocolPositionGroup['iconGroup'][number]['symbol'][];
  /** Numeric fiat amount used for sorting. */
  tokenFiatAmount: DeFiProtocolPositionGroup['marketValue'];
  /** Formatted fiat amount shown in the list cell. */
  marketValue: string;
};

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
          variant={AvatarGroupVariant.Token}
          size={AvatarGroupSize.Xs}
          max={4}
          avatarPropsArr={position.iconGroup.map((icon) => ({
            src: icon.avatarValue,
            name: icon.symbol,
          }))}
        />
      }
    />
  );
}
