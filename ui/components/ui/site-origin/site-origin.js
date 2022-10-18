import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../chip';
import IconWithFallback from '../icon-with-fallback';
import { COLORS } from '../../../helpers/constants/design-system';

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
          borderColor={COLORS.BORDER_MUTED}
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
        <span>{siteOrigin}</span>
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
