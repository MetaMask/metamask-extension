import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { omit } from 'lodash';
import Typography from '../typography';
import UrlIcon from '../url-icon';
import {
  BackgroundColor,
  BorderColor,
  TextColor,
  TypographyVariant,
} from '../../../helpers/constants/design-system';

/**
 * @deprecated The `<Chip />` component has been deprecated in favor of the new `<Tag>` component from the component-library.
 * Please update your code to use the new `<Tag>` component instead, which can be found at ui/components/component-library/tag/tag.tsx.
 * You can find documentation for the new `Tag` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-tag--docs}
 * If you would like to help with the replacement of the old `Chip` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20487}
 */

export default function Chip({
  dataTestId,
  className,
  children,
  borderColor = BorderColor.borderDefault,
  backgroundColor,
  label,
  labelProps = {},
  leftIcon,
  leftIconUrl = '',
  rightIcon,
  onClick,
  maxContent = true,
  displayInlineBlock = false,
}) {
  const onKeyPress = (event) => {
    if (event.key === 'Enter' && onClick) {
      onClick(event);
    }
  };

  const isInteractive = typeof onClick === 'function';

  return (
    <div
      data-testid={dataTestId}
      onClick={onClick}
      onKeyPress={onKeyPress}
      className={classnames(className, 'chip', {
        'chip--with-left-icon': Boolean(leftIcon),
        'chip--with-right-icon': Boolean(rightIcon),
        [`chip--border-color-${borderColor}`]: true,
        [`chip--background-color-${backgroundColor}`]: true,
        'chip--max-content': maxContent,
        'chip--display-inline-block': displayInlineBlock,
      })}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {leftIcon && !leftIconUrl ? (
        <div className="chip__left-icon">{leftIcon}</div>
      ) : null}
      {leftIconUrl ? (
        <UrlIcon className="chip__left-url-icon" url={leftIconUrl} />
      ) : null}
      {children ?? (
        <Typography
          className="chip__label"
          variant={TypographyVariant.H6}
          as="span"
          color={TextColor.textAlternative}
          {...labelProps}
        >
          {label}
        </Typography>
      )}
      {rightIcon ? <div className="chip__right-icon">{rightIcon}</div> : null}
    </div>
  );
}

Chip.propTypes = {
  /**
   * Data test id used for testing of the Chip component
   */
  dataTestId: PropTypes.string,
  /**
   * The border color of the Chip
   */
  borderColor: PropTypes.oneOf(Object.values(BorderColor)),
  /**
   * The background color of the Chip component
   */
  backgroundColor: PropTypes.oneOf(Object.values(BackgroundColor)),
  /**
   * The label of the Chip component has a default typography variant of h6 and is a span html element
   */
  label: PropTypes.string,
  /**
   * The label props of the component. Most Typography props can be used
   */
  labelProps: PropTypes.shape({
    ...omit(TypographyVariant.propTypes, ['children', 'className']),
  }),
  /**
   * Children will replace the label of the Chip component.
   */
  children: PropTypes.node,
  /**
   * An icon component that can be passed to appear on the left of the label
   */
  leftIcon: PropTypes.node,
  /**
   * An icon component that can be passed to appear on the right of the label
   */
  rightIcon: PropTypes.node,
  /**
   * The className of the Chip
   */
  className: PropTypes.string,
  /**
   * The onClick handler to be passed to the Chip component
   */
  onClick: PropTypes.func,
  /**
   * If the width: max-content; is used in css.
   * max-content can overflow the parent's width and break designs
   */
  maxContent: PropTypes.bool,
  /**
   * Icon location
   */
  leftIconUrl: PropTypes.string,
  /**
   * Display or not the inline block
   */
  displayInlineBlock: PropTypes.bool,
};
