import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import NftDefaultImage from '../../app/assets/nfts/nft-default-image/nft-default-image';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
  Icon,
  IconName,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  getIpfsGateway,
  getOpenSeaEnabled,
  getTestNetworkBackgroundColor,
} from '../../../selectors';
import { NFT } from '../asset-picker-amount/asset-picker-modal/types';

type NftItemProps = {
  nft?: NFT;
  alt: string;
  src: string | undefined;
  name?: string;
  tokenId?: string;
  networkName: string;
  networkSrc?: string;
  onClick?: () => void;
  isIpfsURL?: boolean;
  detailView?: boolean;
  clickable?: boolean;
  privacyMode?: boolean;
  badgeWrapperClassname?: string;
};

export const NftItem = ({
  nft,
  alt,
  src,
  networkName,
  networkSrc,
  onClick,
  detailView,
  clickable,
  privacyMode,
  isIpfsURL,
  badgeWrapperClassname = '',
}: NftItemProps) => {
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const isIpfsEnabled = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);

  const ipfsImageIsRenderable = isIpfsEnabled && isIpfsURL && src;
  const openseaImageIsRenderable = openSeaEnabled && src && !isIpfsURL;

  const nftImageComponentToRender =
    ipfsImageIsRenderable || openseaImageIsRenderable ? (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        style={{
          position: 'relative',
        }}
      >
        <Box
          className={
            detailView
              ? 'nft-item__item nft-item__item-detail'
              : `nft-item__item nft-item__item-image${
                  privacyMode ? '--hidden' : ''
                }`
          }
          data-testid="nft-image"
          as="img"
          src={src}
          alt={alt}
          display={Display.Block}
          justifyContent={JustifyContent.center}
        ></Box>
        {privacyMode && (
          <Icon
            style={{ position: 'absolute' }}
            name={IconName.EyeSlash}
            color={IconColor.iconAlternative}
          />
        )}
      </Box>
    ) : (
      <NftDefaultImage
        className="nft-item__default-image"
        data-testid="nft-default-image"
        clickable={clickable && isIpfsURL}
      />
    );

  return (
    <Box className="nft-item__card">
      <Box
        className="nft-item__container"
        data-testid="nft-item"
        as="button"
        onClick={onClick}
      >
        <BadgeWrapper
          className={classnames(
            'nft-item__badge-wrapper',
            badgeWrapperClassname,
            {
              'nft-item__badge-wrapper__clickable': Boolean(clickable),
            },
          )}
          anchorElementShape={BadgeWrapperAnchorElementShape.circular}
          positionObj={{ top: -4, right: -4 }}
          display={Display.Block}
          badge={
            <AvatarNetwork
              className="nft-item__network-badge"
              backgroundColor={testNetworkBackgroundColor}
              data-testid="nft-network-badge"
              size={AvatarNetworkSize.Sm}
              name={networkName}
              src={networkSrc}
              borderWidth={2}
              // @ts-expect-error: We are using BackgroundColor.backgroundDefault here because there is no equivalent BorderColor to get the "cutout" effect
              borderColor={BackgroundColor.backgroundDefault}
            />
          }
        >
          {nftImageComponentToRender}
        </BadgeWrapper>
      </Box>
      <Text variant={TextVariant.bodySm} color={TextColor.textDefault} ellipsis>
        {nft?.name}
      </Text>
      <Text
        variant={TextVariant.bodySm}
        color={TextColor.textAlternative}
        ellipsis
      >
        {nft?.collection?.name}
      </Text>
    </Box>
  );
};
