import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Jazzicon from '../jazzicon';
import BlockieIdenticon from './blockieIdenticon';

const getStyles = (diameter) => ({
  height: diameter,
  width: diameter,
  borderRadius: diameter / 2,
});

export default class Identicon extends PureComponent {
  static propTypes = {
    /**
     * Check if adding border
     */
    addBorder: PropTypes.bool,
    /**
     * Add address for identicon user
     */
    address: PropTypes.string,
    /**
     * Add custom css class
     */
    className: PropTypes.string,
    /**
     * Add custom diameter
     */
    diameter: PropTypes.number,
    /**
     * Add custom image from file path
     */
    image: PropTypes.string,
    /**
     * Check if use blockie
     */
    useBlockie: PropTypes.bool,
    /**
     * Show alt text content
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
    const { className, diameter, image, alt, imageBorder } = this.props;

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
    if (image) {
      return this.renderImage();
    }

    if (address) {
      // token from dynamic api list is fetched when useTokenDetection is true
      // And since the token.address from allTokens is checksumaddress
      // tokenAddress have to be changed to lowercase when we are using dynamic list
      const tokenAddress = useTokenDetection ? address.toLowerCase() : address;
      if (tokenAddress && tokenList[tokenAddress]?.iconUrl) {
        return this.renderJazzicon();
      }

      return (
        <div
          className={classnames({ 'identicon__address-wrapper': addBorder })}
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
