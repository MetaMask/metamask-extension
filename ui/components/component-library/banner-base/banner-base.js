import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonIcon, Icon, ICON_NAMES, Text } from '..';
import Box from '../../ui/box';

import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';

export const BannerBase = ({
  className,
  title,
  description,
  action,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-banner', className)}
      display={DISPLAY.INLINE_FLEX}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      borderRadius={SIZES.SM}
      paddingLeft={2}
      paddingRight={3}
      {...props}
    >
      <div className="mm-banner__left-accessory">
        <Icon name={ICON_NAMES.ADD_SQUARE_FILLED} size={SIZES.LG} />
      </div>

      <div className="mm-banner__content">
        {title && (
          <Text className="mm-banner__content-title" variant={TEXT.BODY_LG}>
            {title}
          </Text>
        )}
        {description && (
          <Text className="mm-banner__content-description">{description}</Text>
        )}
        {action && <Text className="mm-banner__content-action">{action}</Text>}
      </div>
      <ButtonIcon
        className="mm-banner__close"
        iconName={ICON_NAMES.CLOSE}
        size={SIZES.SM}
        ariaLabel="close"
      />
    </Box>
  );
};

BannerBase.propTypes = {
  /**
   * The title of the BannerBase
   */
  title: PropTypes.string,
  /**
   * The description of the BannerBase below the title
   */
  description: PropTypes.node,
  /**
   * The action of the BannerBase below the description
   */
  action: PropTypes.node,
  /**
   * An additional className to apply to the BannerBase
   */
  className: PropTypes.string,
  /**
   * Addition style properties to apply to the button.
   */
  style: PropTypes.object,
  /**
   * BannerBase accepts all the props from Box
   */
  ...Box.propTypes,
};
