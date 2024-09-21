import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import IconWithFallback from '../icon-with-fallback';

/**
 * @deprecated `<UrlIcon />` has been deprecated in favor of one of the avatar components `<AvatarNetwork />`, `<AvatarToken/>` or `<AvatarFavicon/>`
 * component in ./ui/components/component-library/avatar-token/
 * See storybook documentation for BannerAlert here:
 * {@see {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-avatartoken--docs}}
 *
 * Help to replace `UrlIcon` with `AvatarToken` by submitting a PR
 */

export default function UrlIcon({ url, className, name, fallbackClassName }) {
  return (
    <IconWithFallback
      className={classnames('url-icon', className)}
      icon={url}
      name={name}
      fallbackClassName={classnames('url-icon__fallback', fallbackClassName)}
    />
  );
}

UrlIcon.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string,
  fallbackClassName: PropTypes.string,
};
