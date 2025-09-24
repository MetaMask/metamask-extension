import React from 'react';
import { Box, Text, AvatarToken, AvatarTokenSize } from '../../../components/component-library';
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
import { CaipAssetId, CaipChainId, parseCaipAssetType } from '@metamask/utils';

interface AssetItemProps {
  asset: Asset;
  onClick?: () => void;
}

export const AssetItem = ({ asset, onClick }: AssetItemProps) => {
  const chainId = asset.chainId ?? parseCaipAssetType(asset.assetId as CaipAssetId).chainId;
  const image = getAssetImageUrl(asset.assetId, chainId as CaipChainId);

  return (
    <Box
      padding={3}
      backgroundColor={BackgroundColor.transparent}
      borderRadius={BorderRadius.SM}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Row alignItems={AlignItems.center} justifyContent={JustifyContent.spaceBetween}>
        <Row alignItems={AlignItems.center} gap={3}>
          <AvatarToken
            src={image}
            name={asset.symbol}
            size={AvatarTokenSize.Md}
          />
          <Column gap={1}>
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
            {asset.balance || '0'} {asset.symbol}
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
