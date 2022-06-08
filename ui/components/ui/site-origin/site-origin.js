import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Chip from '../chip';
import IconWithFallback from '../icon-with-fallback';

export default function SiteOrigin({
  siteOrigin,
  iconSrc,
  iconName,
  chip,
  className,
  title,
}) {
  return (
    <div className={classnames('site-origin', className)} title={title}>
      {chip ? (
        <Chip
          label={siteOrigin}
          maxContent={false}
          leftIcon={
            <IconWithFallback icon={iconSrc} name={iconName} size={32} />
          }
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
};
