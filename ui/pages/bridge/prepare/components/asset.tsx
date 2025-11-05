import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxBackgroundColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ContainerProps } from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import { Column, Row } from '../../layout';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../shared/constants/bridge';
import { formatCurrencyAmount, formatTokenAmount } from '../../utils/quote';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { type BridgeToken } from '../../../../ducks/bridge/types';

export const BridgeAsset = ({
  asset,
  selected,
  ...buttonProps
}: {
  asset: BridgeToken;
  selected: boolean;
} & ContainerProps<'button'>) => {
  // TODO onClick: onAssetChange, onNetworkChange
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  return (
    <Row
      key={asset.assetId}
      as={'button'}
      {...buttonProps}
      paddingInline={4}
      paddingTop={4}
      borderRadius={BorderRadius.none}
      paddingBottom={4}
      gap={4}
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={`bridge-asset${selected ? '--selected' : ''}`}
      style={{ position: 'relative' }}
      height={BlockSize.Max}
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
            name={NETWORK_TO_SHORT_NETWORK_NAME_MAP[asset.chainId]}
            src={BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[asset.chainId]}
            size={AvatarNetworkSize.Xs}
            style={{ borderWidth: 2, borderRadius: 6 }}
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

      <Column alignItems={AlignItems.flexStart}>
        <Text>{asset.symbol}</Text>
        <Text
          color={TextColor.TextAlternative}
          variant={TextVariant.BodySm}
          style={{ whiteSpace: 'nowrap' }}
        >
          {asset.name ?? asset.symbol}
        </Text>
      </Column>

      <Column alignItems={AlignItems.flexEnd}>
        <Text style={{ whiteSpace: 'nowrap' }}>
          {asset.tokenFiatAmount
            ? formatCurrencyAmount(
                asset.tokenFiatAmount.toFixed(4),
                currency,
                2,
              )
            : ''}
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
      </Column>
    </Row>
  );
};
