import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { Text } from '../text';
import { Icon, IconSize } from '../icon';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  DISPLAY,
  JustifyContent,
  TextVariant,
  Display,
} from '../../../helpers/constants/design-system';

export const Tag = ({
  label,
  className,
  labelProps,
  iconName,
  iconProps,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-tag', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingLeft={1}
      paddingRight={1}
      borderRadius={BorderRadius.pill}
      display={DISPLAY.INLINE_BLOCK}
      {...props}
    >
      {iconName ? (
        <Icon
          name={iconName}
          size={IconSize.Xs}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          {...iconProps}
        />
      ) : null}
      <Text variant={TextVariant.bodySm} {...labelProps}>
        {label}
      </Text>
    </Box>
  );
};

Tag.propTypes = {
  /**
   * The text content of the Tag component
   */
  label: PropTypes.string,
  /**
   * The label props of the component. Most Text component props can be used
   */
  labelProps: PropTypes.shape(Text.PropTypes),
  /**
   * Additional classNames to be added to the Tag component
   */
  className: PropTypes.string,
  /**
   * The icon name to be used in the Tag component.
   */
  iconName: PropTypes.string,
  /**
   * The icon props of the component.
   */
  iconProps: PropTypes.shape(Icon.PropTypes),
  /**
   * Tag also accepts all props from Box
   */
  ...Box.propTypes,
};
