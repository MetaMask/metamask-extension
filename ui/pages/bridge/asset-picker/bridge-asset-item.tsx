import React from 'react';
import { Box, Text, AvatarToken, AvatarTokenSize, AvatarNetworkSize, AvatarNetwork } from '../../../components/component-library';
import { Column, Row } from '../layout';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant
} from '../../../helpers/constants/design-system';
import { Asset } from '../utils/assets-service';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import { CaipAssetId, CaipChainId, parseCaipAssetType, parseCaipChainId } from '@metamask/utils';
import { getImageForChainId } from '../../confirmations/utils/network';
import { getNetworkIcon } from '../../../../shared/modules/network.utils';

interface AssetItemProps {
  asset: Asset;
  onClick?: () => void;
}

export const AssetItem = ({ asset, onClick }: AssetItemProps) => {
  const tokenImage = getAssetImageUrl(asset.assetId, asset.chainId as CaipChainId);
  const networkImage = getImageForChainId(asset.chainId as CaipChainId);

  return (
    <Box
      paddingTop={2}
      paddingBottom={2}
      backgroundColor={BackgroundColor.transparent}
      borderRadius={BorderRadius.SM}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Row alignItems={AlignItems.center} justifyContent={JustifyContent.spaceBetween}>
        <Row alignItems={AlignItems.center} gap={3} style={{ display: 'flex', flexShrink: 0 }}>
          <Box style={{ position: 'relative', display: 'flex' }}>
            <AvatarToken
              src={tokenImage}
              name={asset.symbol}
              size={AvatarTokenSize.Md}
            />
            <Box
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-4px',
                borderRadius: '50%',
              }}
            >
              <AvatarNetwork
                src={networkImage}
                name={asset.chainId}
                size={AvatarNetworkSize.Xs}
              />
            </Box>
          </Box>
          <Column gap={1} style={{ display: 'flex', flexShrink: 0 }}>
            <Text
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.textDefault}
            >
              {asset.symbol}
            </Text>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {asset.name}
            </Text>
          </Column>
        </Row>

        <Column alignItems={AlignItems.flexEnd} gap={1}>
          <Text
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.textDefault}
          >
            {asset.balance || '0'}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          >
            ${asset.tokenFiatAmount?.toFixed(2) || '0.00'}
          </Text>
        </Column>
      </Row>
    </Box>
  );
};
