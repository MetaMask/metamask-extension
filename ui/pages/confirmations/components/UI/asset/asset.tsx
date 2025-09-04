import React from 'react';
import {
  AvatarToken,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  Text,
  AvatarTokenSize,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  type Asset as AssetType,
  AssetStandard,
  NFT_STANDARDS,
} from '../../../types/send';

type AssetProps = {
  asset: AssetType;
  onClick?: () => void;
  isSelected?: boolean;
};

const NftAsset = ({ asset, onClick, isSelected }: AssetProps) => {
  const nftData = asset;
  const { collection, name, tokenId, image, standard, balance } = nftData;

  // Calculate ERC1155 display text
  let erc1155Text = null;
  if (standard === AssetStandard.ERC1155) {
    erc1155Text = name
      ? `(${balance?.toString() as string}) ${name} - #${tokenId}`
      : `(${balance?.toString() as string}) #${tokenId}`;
  }

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={
        isSelected
          ? BackgroundColor.backgroundHover
          : BackgroundColor.transparent
      }
      className="send-asset"
      data-testid="nft-asset"
      display={Display.Flex}
      onClick={onClick}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
    >
      <Box marginRight={3} style={{ minWidth: 40 }}>
        <BadgeWrapper
          badge={
            nftData.chainId ? (
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
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
                width: 40,
                height: 40,
                borderRadius: 20,
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
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ flex: 1, overflow: 'hidden' }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          ellipsis
        >
          {collection?.name}
        </Text>
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
          ellipsis
        >
          {standard === AssetStandard.ERC721 && name}
          {standard === AssetStandard.ERC1155 && erc1155Text}
        </Text>
      </Box>
    </Box>
  );
};

const TokenAsset = ({ asset, onClick, isSelected }: AssetProps) => {
  const tokenData = asset;
  const {
    balanceInSelectedCurrency,
    chainId,
    image,
    name,
    shortenedBalance,
    symbol,
  } = tokenData;

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={
        isSelected
          ? BackgroundColor.backgroundHover
          : BackgroundColor.transparent
      }
      className="send-asset"
      data-testid="token-asset"
      display={Display.Flex}
      onClick={onClick}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
    >
      <Box marginRight={3}>
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
            size={AvatarTokenSize.Lg}
            src={image}
            name={symbol}
            showHalo={false}
          />
        </BadgeWrapper>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ flex: 1, overflow: 'hidden' }}
      >
        <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
          {name}
        </Text>
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
          ellipsis
        >
          {symbol}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexEnd}
        marginLeft={2}
      >
        <Text variant={TextVariant.bodyMdMedium}>
          {balanceInSelectedCurrency}
        </Text>
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
        >
          {shortenedBalance} {symbol}
        </Text>
      </Box>
    </Box>
  );
};

export const Asset = ({ asset, onClick, isSelected }: AssetProps) => {
  if (NFT_STANDARDS.includes(asset.standard as AssetStandard)) {
    return <NftAsset asset={asset} onClick={onClick} isSelected={isSelected} />;
  }
  return <TokenAsset asset={asset} onClick={onClick} isSelected={isSelected} />;
};
