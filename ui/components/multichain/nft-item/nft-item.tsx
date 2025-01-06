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
  Text,
} from '../../component-library';
import {
  BackgroundColor,
  Display,
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
  clickable?: boolean;
  badgeWrapperClassname?: string;
};

export const NftItem = ({
  nft,
  alt,
  src,
  networkName,
  networkSrc,
  onClick,
  clickable,
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
        className="nft-item__item nft-item__item-image"
        data-testid="nft-image"
        as="img"
        src={src}
        alt={alt}
        display={Display.Block}
        justifyContent={JustifyContent.center}
      />
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
        # {nft?.tokenId}
      </Text>
    </Box>
  );
};
