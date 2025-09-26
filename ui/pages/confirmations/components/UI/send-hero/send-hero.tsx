import React from 'react';
import { Hex } from '@metamask/utils';

import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../../../shared/constants/network';
import {
  AvatarToken,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  Text,
} from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../../../helpers/constants/design-system';
import { Asset, NFT_STANDARDS } from '../../../types/send';
import { useNftImageUrl } from '../../../hooks/useNftImageUrl';
import { useChainNetworkNameAndImageMap } from '../../../hooks/useChainNetworkNameAndImage';

const NFTHero = ({ asset }: { asset: Asset }) => {
  const nftData = asset;
  const { collection, name, image } = nftData;
  const nftItemSrc = useNftImageUrl(image as string);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      marginTop={6}
      marginBottom={6}
    >
      <BadgeWrapper
        style={{
          alignSelf: 'center',
        }}
        badge={
          nftData.chainId ? (
            <AvatarNetwork
              size={AvatarNetworkSize.Sm}
              name={nftData.networkName ?? ''}
              src={nftData.networkImage}
            />
          ) : null
        }
      >
        {image || collection?.imageUrl ? (
          <Box
            as="img"
            src={nftItemSrc || (collection?.imageUrl as string)}
            alt={name}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              objectFit: 'cover',
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
      </BadgeWrapper>
      <Text
        variant={TextVariant.bodyLgMedium}
        color={TextColor.textDefault}
        marginTop={2}
      >
        {asset.name || asset.collection?.name}
      </Text>
    </Box>
  );
};

const TokenHero = ({ asset }: { asset: Asset }) => {
  const chainNetworkNameAndImageMap = useChainNetworkNameAndImageMap();

  const { chainId, image, symbol, isNative, networkImage, networkName } =
    asset ?? {};

  const nativeTokenImage = isNative
    ? (CHAIN_ID_TOKEN_IMAGE_MAP[
        chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ] ?? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId as Hex])
    : undefined;

  const chainNetworkNameAndImage = chainNetworkNameAndImageMap.get(
    chainId as Hex,
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      marginTop={6}
      marginBottom={6}
    >
      <BadgeWrapper
        badge={
          chainId ? (
            <AvatarNetwork
              size={AvatarNetworkSize.Sm}
              name={networkName || chainNetworkNameAndImage?.networkName || ''}
              src={networkImage || chainNetworkNameAndImage?.networkImage}
            />
          ) : null
        }
      >
        <AvatarToken
          size={AvatarTokenSize.Xl}
          src={image || nativeTokenImage}
          name={symbol}
          showHalo={false}
        />
      </BadgeWrapper>
      <Text
        variant={TextVariant.bodyLgMedium}
        color={TextColor.textDefault}
        marginLeft={2}
      >
        {symbol}
      </Text>
    </Box>
  );
};

export const SendHero = ({ asset }: { asset: Asset }) => {
  if (asset?.standard && NFT_STANDARDS.includes(asset.standard)) {
    return <NFTHero asset={asset} />;
  }
  return <TokenHero asset={asset} />;
};
