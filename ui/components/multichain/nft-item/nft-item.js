import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import NftDefaultImage from '../../app/nft-default-image/nft-default-image';
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
  getIpfsGateway,
  getTestNetworkBackgroundColor,
} from '../../../selectors';

export const NftItem = ({
  alt,
  name,
  src,
  networkName,
  networkSrc,
  tokenId,
  onClick,
  clickable,
  nftImageURL,
}) => {
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const isIpfsEnabled = useSelector(getIpfsGateway);
  const isIpfsURL = nftImageURL?.includes('ipfs:');
  const renderNftBasedonSrc = src ? (
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
        className={classnames('nft-item__badge-wrapper', {
          'nft-item__badge-wrapper__clickable': clickable,
        })}
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
        {isIpfsEnabled ? (
          <>{renderNftBasedonSrc}</>
        ) : (
          <>
            {isIpfsURL ? (
              <NftDefaultImage
                className="nft-item__default-image"
                data-testid="nft-default-image"
                name={name}
                tokenId={tokenId}
                clickable={clickable}
              />
            ) : (
              <>{renderNftBasedonSrc}</>
            )}
          </>
        )}
      </BadgeWrapper>
    </Box>
  );
};

NftItem.propTypes = {
  /**
   * NFT media source
   */
  src: PropTypes.string,
  /**
   * Alt text for the NFT
   */
  alt: PropTypes.string.isRequired,
  /**
   * The NFT's name
   */
  name: PropTypes.string.isRequired,
  /**
   * Name of the network the NFT lives on
   */
  networkName: PropTypes.string.isRequired,
  /**
   * Image that represents the network
   */
  networkSrc: PropTypes.string.isRequired,
  /**
   * Token ID of the NFT
   */
  tokenId: PropTypes.string.isRequired,
  /**
   * Executes when the NFT is clicked
   */
  onClick: PropTypes.func,
  /**
   * Represents if the NFT is clickable for larger image
   */
  clickable: PropTypes.bool,
  /**
   * The NFT image URL
   */
  nftImageURL: PropTypes.string,
};
