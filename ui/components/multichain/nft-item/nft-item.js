import React from 'react';
import PropTypes from 'prop-types';
import NftDefaultImage from '../../app/nft-default-image/nft-default-image';
import {
  AvatarNetwork,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
} from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

export const NftItem = ({
  alt,
  backgroundColor,
  name,
  src,
  networkName,
  networkSrc,
  tokenId,
  onClick,
}) => {
  return (
    <Box data-testid="nft-item">
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={Size.SM}
            name={networkName}
            src={networkSrc}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
            data-testid="nft-network-badge"
          />
        }
        anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
        positionObj={{ top: -4, right: -4 }}
        display={Display.BLOCK}
      >
        {src ? (
          <Box
            as="button"
            className="nfts-items__item"
            borderRadius={BorderRadius.LG}
            backgroundColor={backgroundColor}
            onClick={onClick}
          >
            <img
              className="nfts-items__item-image"
              data-testid="nft-image"
              style={{ borderRadius: 8 }}
              src={src}
              alt={alt}
            />
          </Box>
        ) : (
          <NftDefaultImage
            name={name}
            tokenId={tokenId}
            handleImageClick={onClick}
            data-testid="nft-default-image"
          />
        )}
      </BadgeWrapper>
    </Box>
  );
};

NftItem.propTypes = {
  alt: PropTypes.string,
  backgroundColor: PropTypes.string,
  name: PropTypes.string,
  src: PropTypes.string,
  networkName: PropTypes.string,
  networkSrc: PropTypes.string,
  tokenId: PropTypes.string,
  onClick: PropTypes.func,
};
