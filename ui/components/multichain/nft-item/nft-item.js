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
  DISPLAY,
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
        display={DISPLAY.BLOCK}
      >
        {src ? (
          <button
            className="nfts-items__item"
            style={{
              backgroundColor,
              borderRadius: 8,
            }}
            onClick={onClick}
          >
            <img
              className="nfts-items__item-image"
              data-testid="nft-image"
              style={{ borderRadius: 8 }}
              src={src}
              alt={alt}
            />
          </button>
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
