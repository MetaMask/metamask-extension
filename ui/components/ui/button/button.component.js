import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const CLASSNAME_DEFAULT = 'btn-default';
const CLASSNAME_PRIMARY = 'btn-primary';
const CLASSNAME_SECONDARY = 'btn-secondary';
const CLASSNAME_RAISED = 'btn-raised';
const CLASSNAME_LARGE = 'btn--large';
const CLASSNAME_ROUNDED = 'btn--rounded';
const CLASSNAME_INLINE = 'btn--inline';

const typeHash = {
  default: CLASSNAME_DEFAULT,
  primary: CLASSNAME_PRIMARY,
  secondary: CLASSNAME_SECONDARY,
  warning: 'btn-warning',
  danger: 'btn-danger',
  'danger-primary': 'btn-danger-primary',
  link: 'btn-link',
  inline: CLASSNAME_INLINE,
  raised: CLASSNAME_RAISED,
};

/**
 * @deprecated The <Button /> component has been deprecated in favor of the new <Button> component from the component-library.
 * Please update your code to use the new <Button> component instead, which can be found at ./ui/components/component-library/button/button.js.
 * You can find documentation for the new Button component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-button--default-story#button}
 * If you would like to help with the replacement of the old Button component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/18896}
 * @see {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-button--default-story#button}
 */

const Button = ({
  type,
  submit = false,
  large,
  children,
  icon,
  className,
  rounded = true,
  ...buttonProps
}) => {
  const doRounding = rounded && type !== 'link' && type !== 'inline';
  // To support using the Button component to render styled links that are semantic html
  // we swap the html tag we use to render this component and delete any buttonProps that
  // we know to be erroneous attributes for a link. We will likely want to extract Link
  // to its own component in the future.
  let Tag = 'button';
  if (type === 'link') {
    Tag = 'a';
  } else if (submit) {
    buttonProps.type = 'submit';
  }
  if (type === 'link' && typeof buttonProps.onClick === 'function') {
    buttonProps.onKeyUp ??= (event) => {
      if (event.key === 'Enter') {
        buttonProps.onClick();
      }
    };
    buttonProps.role ??= 'button';
    buttonProps.tabIndex ??= 0;
  }
  return (
    <Tag
      className={classnames(
        'button',
        doRounding && CLASSNAME_ROUNDED,
        typeHash[type] || CLASSNAME_DEFAULT,
        large && CLASSNAME_LARGE,
        className,
      )}
      {...buttonProps}
    >
      {icon ? <span className="button__icon">{icon}</span> : null}
      {children}
    </Tag>
  );
};

Button.propTypes = {
  /**
   * The type of variation a button can be.
   * Can be one of 'default','primary','secondary','warning','danger','danger-primary' or 'link'
   */
  type: PropTypes.string,
  /**
   * If true sets the html 'type' attribute to type="submit"
   */
  submit: PropTypes.bool,
  /**
   * Increase the height of the button to 54px
   */
  large: PropTypes.bool,
  /**
   * Additional className to provide on the root element of the button
   */
  className: PropTypes.string,
  /**
   * The children of the button component
   */
  children: PropTypes.node,
  /**
   * Provide an icon component for an icon to appear on the left side of the button
   */
  icon: PropTypes.node,
  /**
   * Buttons are rounded by default.
   */
  rounded: PropTypes.bool,
};

export default Button;
