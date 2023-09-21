import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * @deprecated The `<IconWithFallback />` component has been deprecated in favor of the new `<AvatarNetwork />` or `<AvatarFavicon />` component from the component-library.
 * Please update your code to use the new `<AvatarNetwork />` or `<AvatarFavicon />` component instead, which can be found at ui/components/component-library.
 * You can find documentation for the new `AvatarNetwork` or `AvatarFavicon` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-avatarnetwork--docs}
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-avatarfavicon--docs}
 * If you would like to help with the replacement of the old `IconWithFallback` component, please submit a pull request
 */

const IconWithFallback = ({
  name = '',
  icon = null,
  size,
  className,
  fallbackClassName,
  wrapperClassName,
  ...props
}) => {
  const [iconError, setIconError] = useState(false);
  const style = size ? { height: `${size}px`, width: `${size}px` } : {};

  const handleOnError = () => {
    setIconError(true);
  };

  return (
    <div className={classnames(wrapperClassName)}>
      {!iconError && icon ? (
        <img
          onError={handleOnError}
          src={icon}
          style={style}
          className={className}
          alt={name || 'icon'}
          {...props}
        />
      ) : (
        <span
          className={classnames(
            'icon-with-fallback__fallback',
            fallbackClassName,
          )}
        >
          {name?.charAt(0).toUpperCase() || ''}
        </span>
      )}
    </div>
  );
};

IconWithFallback.propTypes = {
  /**
   * The img src of the icon
   */
  icon: PropTypes.string,
  /**
   * The name of the icon also used for the alt attribute of the image
   */
  name: PropTypes.string,
  /**
   * The size of the icon. Recommended sizes adhere to 8px grid: 16, 24, 32, 40
   */
  size: PropTypes.number,
  /**
   * className to apply to the image tag
   */
  className: PropTypes.string,
  /**
   * className to apply to the div that wraps the icon
   */
  wrapperClassName: PropTypes.string,
  /**
   * Additional className to apply to the fallback span tag
   */
  fallbackClassName: PropTypes.string,
};

export default IconWithFallback;
