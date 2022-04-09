import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Jazzicon from '../jazzicon';
import { getAssetImageURL } from '../../../helpers/utils/util';
import BlockieIdenticon from './blockieIdenticon';

const getStyles = (diameter) => ({
  height: diameter,
  width: diameter,
  borderRadius: diameter / 2,
});

export default class Identicon extends PureComponent {
  static propTypes = {
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
     * Use the blockie type random image generator
     */
    useBlockie: PropTypes.bool,
    /**
     * The alt text of the image
     */
    alt: PropTypes.string,
    /**
     * Check if show image border
     */
    imageBorder: PropTypes.bool,
    /**
     * Check if use token detection
     */
    useTokenDetection: PropTypes.bool,
    /**
     * Add list of token in object
     */
    tokenList: PropTypes.object,
    /**
     * User preferred IPFS gateway
     */
    ipfsGateway: PropTypes.string,
  };

  static defaultProps = {
    addBorder: false,
    address: undefined,
    className: undefined,
    diameter: 46,
    image: undefined,
    useBlockie: false,
    alt: '',
    tokenList: {},
  };

  renderImage() {
    const { className, diameter, alt, imageBorder, ipfsGateway } = this.props;
    let { image } = this.props;

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
      />
    );
  }

  renderJazzicon() {
    const {
      address,
      className,
      diameter,
      alt,
      useTokenDetection,
      tokenList,
    } = this.props;
    return (
      <Jazzicon
        address={address}
        diameter={diameter}
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
        alt={alt}
        useTokenDetection={useTokenDetection}
        tokenList={tokenList}
      />
    );
  }

  renderBlockie() {
    const { address, className, diameter, alt } = this.props;

    return (
      <div
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
      >
        <BlockieIdenticon address={address} diameter={diameter} alt={alt} />
      </div>
    );
  }

  render() {
    const {
      address,
      image,
      useBlockie,
      addBorder,
      diameter,
      useTokenDetection,
      tokenList,
    } = this.props;
    const size = diameter + 8;

    if (image) {
      return this.renderImage();
    }

    if (address) {
      if (process.env.TOKEN_DETECTION_V2) {
        if (tokenList[address.toLowerCase()]?.iconUrl) {
          return this.renderJazzicon();
        }
      } else {
        /** TODO: Remove during TOKEN_DETECTION_V2 feature flag clean up */
        // token from dynamic api list is fetched when useTokenDetection is true
        // And since the token.address from allTokens is checksumaddress
        // tokenAddress have to be changed to lowercase when we are using dynamic list
        const tokenAddress = useTokenDetection
          ? address.toLowerCase()
          : address;
        if (tokenAddress && tokenList[tokenAddress]?.iconUrl) {
          return this.renderJazzicon();
        }
      }
      return (
        <div
          className={classnames({ 'identicon__address-wrapper': addBorder })}
          style={addBorder ? getStyles(size) : null}
        >
          {useBlockie ? this.renderBlockie() : this.renderJazzicon()}
        </div>
      );
    }

    return (
      <div
        style={getStyles(diameter)}
        className="identicon__image-border"
      ></div>
    );
  }
}
