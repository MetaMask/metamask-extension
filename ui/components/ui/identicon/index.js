import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import Jazzicon from '../jazzicon';

import { getAssetImageURL } from '../../../helpers/utils/util';
import FoxIcon from '../fox-icon/FoxIcon';
import {
  getMetaMaskAccountsOrdered,
  getSelectedAddress,
  getTokenList,
} from '../../../selectors';
import BlockieIdenticon from './blockieIdenticon';

const getStyles = (diameter) => ({
  height: diameter,
  width: diameter,
  borderRadius: diameter / 2,
});

export default function Identicon({
  className,
  diameter,
  alt,
  imageBorder,
  image,
  address,
  addBorder,
}) {
  const size = diameter + 8;

  const appState = useSelector((state) => state);
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  const {
    metamask: { useBlockie, ipfsGateway, identities },
  } = appState;

  const [colorSchema, setColorSchema] = useState(undefined);

  console.log({ colorSchema, address, accounts, identities });

  useEffect(() => {
    const currentIndex = accounts.findIndex(
      (account) => account.address === address?.toLowerCase(),
    );
    setColorSchema(accounts[currentIndex]?.colorSchema);
  }, [accounts, address]);

  useEffect(() => {
    // lock page
    if (address && accounts.length === 0) {
      setColorSchema(identities[address?.toLowerCase()]?.colorSchema);
    }
  }, [address, accounts, identities]);

  const tokenList = getTokenList(appState);
  const [imageLoadingError, setImageLoadingError] = useState(false);

  const renderImage = () => {
    if (Array.isArray(image) && image.length) {
      image = image[0];
    }

    if (
      typeof image === 'string' &&
      image.toLowerCase().startsWith('ipfs://')
    ) {
      image = getAssetImageURL(image, ipfsGateway);
    }

    return (
      <img
        className={classnames('identicon', className, {
          'identicon__image-border': imageBorder,
        })}
        src={image}
        style={getStyles(diameter)}
        alt={alt}
        onError={() => {
          setImageLoadingError(true);
        }}
      />
    );
  };

  const renderJazzicon = () => {
    return (
      <Jazzicon
        address={address}
        diameter={diameter}
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
        alt={alt}
        tokenList={tokenList}
      />
    );
  };

  const renderBlockie = () => {
    return (
      <div
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
      >
        <BlockieIdenticon address={address} diameter={diameter} alt={alt} />
      </div>
    );
  };

  const renderCustomizedFox = () => {
    return (
      <FoxIcon size={size} settledColorSchema={colorSchema} address={address} />
    );
  };

  const renderBlockieOrJazzIcon = () => {
    return useBlockie ? renderBlockie() : renderJazzicon();
  };

  if (imageLoadingError) {
    return renderBlockieOrJazzIcon();
  }

  if (image) {
    return renderImage();
  }

  if (address) {
    if (colorSchema) {
      return renderCustomizedFox();
    }

    if (tokenList[address.toLowerCase()]?.iconUrl) {
      return renderJazzicon();
    }

    return (
      <div
        className={classnames({ 'identicon__address-wrapper': addBorder })}
        style={addBorder ? getStyles(size) : null}
      >
        {renderBlockieOrJazzIcon()}
      </div>
    );
  }
  return (
    <div style={getStyles(diameter)} className="identicon__image-border" />
  );
}

Identicon.propTypes = {
  /**
   * Adds blue border around the Identicon used for selected account.
   * Increases the width and height of the Identicon by 8px
   */
  addBorder: PropTypes.bool,
  /**
   * Address used for generating random image
   */
  address: PropTypes.string,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
  /**
   * Sets the width and height of the inner img element
   * If addBorder is true will increase components height and width by 8px
   */
  diameter: PropTypes.number,
  /**
   * Used as the image source of the Identicon
   */
  image: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),

  /**
   * The alt text of the image
   */
  alt: PropTypes.string,
  /**
   * Check if show image border
   */
  imageBorder: PropTypes.bool,
};
