import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * @deprecated The `<IconBorder />` component has been deprecated in favor of the `<AvatarBase />` component from the component-library.
 * Please update your code to use the new `<AvatarBase>` component instead, which can be found at ./ui/components/component-library/avatar-base/avatar-base.js.
 * You can find documentation for the new AvatarBase component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-avatarbase--docs}
 * If you would like to help with the replacement of the old IconBorder component, please submit a pull request
 */

export default function IconBorder({ children, size, className }) {
  const borderStyle = { height: `${size}px`, width: `${size}px` };
  return (
    <div className={classnames('icon-border', className)} style={borderStyle}>
      {children}
    </div>
  );
}

IconBorder.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.number.isRequired,
};
