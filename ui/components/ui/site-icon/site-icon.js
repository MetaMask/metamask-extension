import React from 'react';
import PropTypes from 'prop-types';
import IconBorder from '../icon-border';
import IconWithFallback from '../icon-with-fallback';

/**
 * @deprecated `<SiteIcon />` has been deprecated in favor of the new `<AvatarFavicon>` component from the component-library.
 * Please update your code to use the new <AvatarFavicon> component instead, which can be found at ./ui/components/component-library/avatar-favicon.js.
 * You can find documentation for the new AvatarFavicon component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/story/components-componentlibrary-avatarfavicon--default-story}
 * Help to replace `SiteIcon` with `AvatarFavicon` by submitting a PR
 */

export default function SiteIcon({ icon = null, name = '', size, className }) {
  const iconSize = Math.floor(size * 0.75);
  return (
    <IconBorder size={size} className={className}>
      <IconWithFallback icon={icon} name={name} size={iconSize} />
    </IconBorder>
  );
}

SiteIcon.propTypes = {
  /**
   * Additional className to add to the root element of SiteIcon.
   */
  className: PropTypes.string,
  /**
   * The img src of the icon.
   * Used in IconWithFallback
   */
  icon: PropTypes.string,
  /**
   * The name of the icon also used for the alt tag of the image and fallback letter.
   * Used in IconWithFallback
   */
  name: PropTypes.string,
  /**
   * The size of the icon.
   * Used in IconWithFallback
   */
  size: PropTypes.number.isRequired,
};
