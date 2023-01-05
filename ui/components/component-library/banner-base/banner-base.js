import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonIcon, ButtonLink, ICON_NAMES, Text } from '..';

import Box from '../../ui/box';

import {
  COLORS,
  DISPLAY,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';

export const BannerBase = ({
  className,
  title,
  titleProps,
  children,

  actionButtonLabel,
  actionButtonOnClick,
  actionButtonProps,
  startAccessory,
  onClose,
  closeButtonProps,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-banner-base', className)}
      display={DISPLAY.INLINE_FLEX}
      gap={2}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderRadius={SIZES.SM}
      padding={3}
      {...props}
    >
      {startAccessory && <>{startAccessory}</>}

      <div>
        {title && (
          <Text
            className="mm-banner-base__title"
            variant={TEXT.BODY_LG_MEDIUM}
            as="h5"
            {...titleProps}
          >
            {title}
          </Text>
        )}
        {children && typeof children === 'object' ? (
          children
        ) : (
          <Text>{children}</Text>
        )}
        {actionButtonLabel && (
          <ButtonLink
            // noPadding TODO: Use noPadding option when released
            size={SIZES.AUTO} // TODO: Remove when noPadding is added
            onClick={actionButtonOnClick}
            {...actionButtonProps}
          >
            {actionButtonLabel}
          </ButtonLink>
        )}
      </div>
      {onClose && (
        <ButtonIcon
          className="mm-banner-base__close-button"
          iconName={ICON_NAMES.CLOSE_OUTLINE}
          size={SIZES.SM}
          ariaLabel="Close" // TODO: i18n
          onClick={onClose}
          {...closeButtonProps}
        />
      )}
    </Box>
  );
};

BannerBase.propTypes = {
  /**
   * The title of the BannerBase
   */
  title: PropTypes.string,
  /**
   * Additional props to pass to the `Text` component used for the `title` text
   */
  titleProps: PropTypes.shape(Text.PropTypes),
  /**
   * The children is the description area of the BannerBase below the title
   */
  children: PropTypes.node,
  /**
   * The action of the BannerBase below the children
   */
  action: PropTypes.node,
  /**
   * Label for action button (ButtonLink) of the BannerBase below the children
   */
  actionButtonLabel: PropTypes.string,
  /**
   * Props for action button (ButtonLink) of the BannerBase below the children
   */
  actionButtonProps: PropTypes.shape(ButtonLink.PropTypes),
  /**
   * The onClick handler for the action button (ButtonLink)
   */
  actionButtonOnClick: PropTypes.func,
  /**
   * The start(defualt left) content area of BannerBase
   */
  startAccessory: PropTypes.node,
  /**
   * The onClick handler for the close button
   * When passed this will allow for the close button to show
   */
  onClose: PropTypes.func,
  /**
   * The props to pass to the close button
   */
  closeButtonProps: PropTypes.shape(ButtonIcon.PropTypes),
  /**
   * An additional className to apply to the BannerBase
   */
  className: PropTypes.string,
  /**
   * BannerBase accepts all the props from Box
   */
  ...Box.propTypes,
};
