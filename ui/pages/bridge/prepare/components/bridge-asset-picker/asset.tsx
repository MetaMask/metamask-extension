import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxBackgroundColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { ContainerProps } from '../../../../../components/component-library';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../../shared/constants/bridge';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { Column, Row } from '../../../layout';
import { formatCurrencyAmount, formatTokenAmount } from '../../../utils/quote';

export const AssetListItem = ({
  asset,
  selected,
  ...buttonProps
}: {
  asset: BridgeToken;
  selected: boolean;
} & ContainerProps<'button'>) => {
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  return (
    <Row
      key={asset.assetId}
      {...buttonProps}
      padding={4}
      borderRadius={BorderRadius.none}
      gap={4}
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={`bridge-asset${selected ? '--selected' : ''}`}
      style={{ position: 'relative' }}
      height={BlockSize.Max}
      width={BlockSize.Full}
      data-testid="multichain-token-list-item"
    >
      {selected && (
        <Box
          className="multichain-network-list-item__selected-indicator"
          style={{
            borderRadius: BorderRadius.pill,
            position: 'absolute',
          }}
          backgroundColor={BoxBackgroundColor.PrimaryDefault}
        />
      )}
      <BadgeWrapper
        style={{ alignSelf: 'center' }}
        badgeContainerProps={{
          color: BackgroundColor.backgroundDefault,
        }}
        badge={
          <AvatarNetwork
            name={
              NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                formatChainIdToCaip(asset.chainId)
              ]
            }
            src={
              BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[
                formatChainIdToCaip(asset.chainId)
              ]
            }
            style={{ width: 20, height: 20, borderWidth: 2, borderRadius: 4 }}
            hasBorder
          />
        }
      >
        <AvatarToken
          name={asset.symbol}
          src={asset.image}
          size={AvatarTokenSize.Md}
        />
      </BadgeWrapper>

      <Column width={BlockSize.Full} style={{ overflow: 'hidden' }}>
        <Row alignItems={AlignItems.flexStart} gap={4}>
          <Text ellipsis>{asset.symbol}</Text>
          <Text style={{ whiteSpace: 'nowrap' }}>
            {asset.tokenFiatAmount
              ? formatCurrencyAmount(
                  asset.tokenFiatAmount.toString(),
                  currency,
                  2,
                )
              : ''}
          </Text>
        </Row>

        <Row alignItems={AlignItems.flexEnd} gap={4}>
          <Text
            ellipsis
            color={TextColor.TextAlternative}
            variant={TextVariant.BodySm}
            style={{ whiteSpace: 'nowrap' }}
          >
            {asset.name ?? asset.symbol}
          </Text>
          <Text
            color={TextColor.TextAlternative}
            variant={TextVariant.BodySm}
            style={{ whiteSpace: 'nowrap' }}
          >
            {asset.balance && asset.balance !== '0'
              ? formatTokenAmount(locale, asset.balance, asset.symbol)
              : ''}
          </Text>
        </Row>
      </Column>
    </Row>
  );
};
