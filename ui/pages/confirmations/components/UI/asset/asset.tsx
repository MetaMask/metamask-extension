import React from 'react';
import { KeyringAccountType } from '@metamask/keyring-api';
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
import { useNftImageUrl } from '../../../hooks/useNftImageUrl';
import { accountTypeLabel } from '../../../constants/network';
import { useFormatters } from '../../../../../hooks/useFormatters';
import { AccountTypeLabel } from '../account-type-label';

type AssetProps = {
  asset: AssetType;
  onClick?: () => void;
  isSelected?: boolean;
};

const NftAsset = ({ asset, onClick, isSelected }: AssetProps) => {
  const nftData = asset;
  const { collection, name, tokenId, image, standard, balance } = nftData;

  const nftItemSrc = useNftImageUrl(image as string);

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
      <Box marginRight={4} style={{ minWidth: 32 }}>
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
              src={nftItemSrc || (collection?.imageUrl as string)}
              alt={name}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                objectFit: 'cover',
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
  const { chainId, image, name, balance, symbol = '', fiat } = tokenData;
  const { formatCurrencyWithMinThreshold, formatTokenQuantity } =
    useFormatters();

  const typeLabel = accountTypeLabel[asset.accountType as KeyringAccountType];

  return (
    <Box
      alignItems={AlignItems.center}
      backgroundColor={
        isSelected
          ? BackgroundColor.backgroundHover
          : BackgroundColor.transparent
      }
      className="send-asset"
      data-testid={`token-asset-${chainId}-${symbol}`}
      display={Display.Flex}
      onClick={onClick}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
    >
      <Box marginRight={4}>
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
            size={AvatarTokenSize.Md}
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
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
        >
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
            marginRight={1}
          >
            {name}
          </Text>
          <AccountTypeLabel label={typeLabel} />
        </Box>
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
          {formatCurrencyWithMinThreshold(
            fiat?.balance ?? 0,
            fiat?.currency || '',
          )}
        </Text>
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.textAlternative}
        >
          {formatTokenQuantity(Number(balance ?? 0), symbol)}
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
