import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * @deprecated The `<Dialog />` component has been deprecated in favor of the new `<BannerAlert>` component from the component-library.
 * Please update your code to use the new `<BannerAlert>` component instead, which can be found at ui/components/component-library/banner-alert/banner-alert.js.
 * You can find documentation for the new `BannerAlert` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-banneralert--docs}
 * If you would like to help with the replacement of the old `Dialog` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20463}
 */

export default function Dialog(props) {
  const { children, type, className, onClick } = props;
  return (
    <div
      className={classnames('dialog', className, {
        'dialog--message': type === 'message',
        'dialog--error': type === 'error',
        'dialog--warning': type === 'warning',
      })}
      data-testid="dialog-message"
      onClick={onClick}
    >
      {children}
    </div>
  );
}

Dialog.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.oneOf(['message', 'error', 'warning']),
  onClick: PropTypes.func,
};
