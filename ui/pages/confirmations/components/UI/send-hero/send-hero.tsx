import React from 'react';
import {
  AvatarToken,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  Text,
} from '../../../../../components/component-library';

import { Asset, NFT_STANDARDS } from '../../../types/send';
import {
  TextColor,
  TextVariant,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../../../helpers/constants/design-system';

export const SendHero = ({ asset }: { asset: Asset }) => {
  if (asset?.standard && NFT_STANDARDS.includes(asset.standard)) {
    return <NFTHero asset={asset} />;
  }
  return <TokenHero asset={asset} />;
};

const NFTHero = ({ asset }: { asset: Asset }) => {
  const nftData = asset;
  const { collection, name, image } = nftData;

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
            src={image || (collection?.imageUrl as string)}
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
  const tokenData = asset;
  const { chainId, image, symbol } = tokenData;

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
              size={AvatarNetworkSize.Xs}
              name={tokenData.networkName ?? ''}
              src={tokenData.networkImage}
            />
          ) : null
        }
      >
        <AvatarToken
          size={AvatarTokenSize.Xl}
          src={image}
          name={symbol}
          showHalo={false}
        />
      </BadgeWrapper>
      <Text
        variant={TextVariant.bodyLgMedium}
        color={TextColor.textDefault}
        marginLeft={2}
      >
        {asset.symbol}
      </Text>
    </Box>
  );
};
