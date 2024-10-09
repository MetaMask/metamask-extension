import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import NftDefaultImage from '../../app/assets/nfts/nft-default-image/nft-default-image';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
} from '../../component-library';
import {
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getIpfsGateway,
  getOpenSeaEnabled,
  getTestNetworkBackgroundColor,
} from '../../../selectors';
import useGetAssetImageUrl from '../../../hooks/useGetAssetImageUrl';
import { getNftImageAlt } from '../../../helpers/utils/nfts';

export const NftItem = ({ nft, onClick, clickable, badgeWrapperClassname }) => {
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const isIpfsEnabled = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);

  const { image, imageOriginal, name, tokenId } = nft;

  const ipfsGateway = useSelector(getIpfsGateway);
  const currentChain = useSelector(getCurrentNetwork);
  const nftImageURL = useGetAssetImageUrl(imageOriginal ?? image, ipfsGateway);

  const nftImageAlt = getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? image;
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const isImageHosted = image?.startsWith('https:');

  const src = isImageHosted ? image : nftImageURL;
  const alt = image ? nftImageAlt : '';
  const networkName = currentChain.nickname ?? '';
  const networkSrc = currentChain.rpcPrefs?.imageUrl;

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
        name={name}
        tokenId={tokenId}
        clickable={clickable && isIpfsURL}
      />
    );

  return (
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
            'nft-item__badge-wrapper__clickable': clickable,
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
            borderColor={BackgroundColor.backgroundDefault}
            /* We are using BackgroundColor.backgroundDefault here because
             * there is no equivalent BorderColor to get the "cutout" effect
             */
          />
        }
      >
        {nftImageComponentToRender}
      </BadgeWrapper>
    </Box>
  );
};

NftItem.propTypes = {
  /**
   * NFT media source
   */
  nft: PropTypes.object,
  /**
   * Executes when the NFT is clicked
   */
  onClick: PropTypes.func,
  /**
   * Represents if the NFT is clickable for larger image
   */
  clickable: PropTypes.bool,
  /**
   * Whether the src url resolve to ipfs
   */
  isIpfsURL: PropTypes.bool,
  badgeWrapperClassname: PropTypes.string,
};
