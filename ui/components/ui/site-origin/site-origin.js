import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../chip';
import IconWithFallback from '../icon-with-fallback';
import { BorderColor } from '../../../helpers/constants/design-system';

/**
 * @deprecated The `<SiteOrigin />` component has been deprecated in favor of the new `<TagUrl>` component from the component-library.
 * Please update your code to use the new `<TagUrl>` component instead, which can be found at ui/components/component-library/tag-url/tag-url.js.
 * You can find documentation for the new `TagUrl` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-tagurl--docs}
 * If you would like to help with the replacement of the old `SiteOrigin` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20489}
 */

export default function SiteOrigin({
  siteOrigin,
  iconSrc,
  iconName,
  chip,
  className,
  title,
  leftIcon,
  rightIcon,
}) {
  return (
    <div className={classnames('site-origin', className)} title={title}>
      {chip ? (
        <Chip
          borderColor={BorderColor.borderMuted}
          label={siteOrigin}
          maxContent={false}
          leftIcon={
            leftIcon || (
              <IconWithFallback icon={iconSrc} name={iconName} size={24} />
            )
          }
          rightIcon={rightIcon}
        />
      ) : (
        <bdi dir="ltr">{siteOrigin}</bdi>
      )}
    </div>
  );
}

SiteOrigin.propTypes = {
  /**
   * The origin of the site generally the URL
   */
  siteOrigin: PropTypes.string.isRequired,
  /**
   * Icon name is used for the fallback icon and will display the first letter of the string
   * when iconSrc errors or is not provided.
   */
  iconName: PropTypes.string,
  /**
   * The image src of the icon
   */
  iconSrc: PropTypes.string,
  /**
   * Additional className added to the root html element
   */
  className: PropTypes.string,
  /**
   * title specifies extra information and is added to a title attribute added to the root html element
   * It is most often shown as a tooltip text when the mouse moves over the element.
   */
  title: PropTypes.string,
  /**
   * Whether the SiteOrigin is displayed as a chip or plain text.
   * if false iconSrc and iconName props will not be used.
   */
  chip: PropTypes.bool,
  /**
   * The icon to display on the left side of the chip. If not provided, the iconSrc and iconName will be used.
   */
  leftIcon: PropTypes.node,
  /**
   * The icon to display on the right side of the chip.
   */
  rightIcon: PropTypes.node,
};
