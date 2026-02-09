import React from 'react';
import classnames from 'classnames';
import { Text, Icon, IconSize, TextColor } from '@metamask/design-system-react';
import { Icon as IconLegacy, IconSize as IconSizeLegacy } from '../icon';
import { Text as TextLegacy } from '../text';
import { Box, type BoxProps, type PolymorphicRef } from '../box';

import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  TextColor as TextColorLegacy,
  TextVariant as TextVariantLegacy,
} from '../../../helpers/constants/design-system';
import type { TextColor as TextColorLegacyType } from '../../../helpers/constants/design-system';

import { TagComponent, TagProps } from './tag.types';

export const Tag: TagComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      label,
      className = '',
      labelProps,
      startIconName,
      iconNameLegacy,
      startIconProps,
      iconColorLegacy,
      textVariantLegacy,
      iconName,
      iconSize,
      textVariant,
      ...props
    }: TagProps<C>,
    ref: PolymorphicRef<C>,
  ) => {
    // Determine which icon and text system to use
    // iconNameLegacy is an alias for startIconName for consistency with MenuItem
    // Include startIconName to maintain backward compatibility
    const actualIconName = iconName || iconNameLegacy || startIconName;
    const actualIconSize = iconSize || IconSize.Xs;

    // Extract color from labelProps, ensuring it's TextColor type for legacy Text component
    // labelProps.color could be IconColor or TextColor from StyleUtilityProps
    const { color: labelColorProp, ...restLabelProps } = labelProps || {};
    const labelColor = labelColorProp as TextColorLegacyType | undefined;

    // Extract compatible props from startIconProps for new Icon component
    // New Icon only accepts SVG-compatible props (className, style), not Box props
    const {
      size: startIconSize,
      className: startIconClassName,
      style: startIconStyle,
      ...restStartIconProps
    } = startIconProps || {};

    // For new Icon, only pass className and style (SVG-compatible props)
    const newIconProps = {
      ...(startIconClassName && { className: startIconClassName }),
      ...(startIconStyle && { style: startIconStyle }),
    };

    return (
      <Box
        ref={ref}
        className={classnames('mm-tag', className)}
        backgroundColor={BackgroundColor.backgroundSection}
        alignItems={AlignItems.center}
        paddingLeft={2}
        paddingRight={2}
        gap={1}
        borderRadius={BorderRadius.SM}
        display={Display.Flex}
        {...(props as BoxProps<C>)}
      >
        {actualIconName && (
          <>
            {iconName && (
              <Icon name={iconName} size={actualIconSize} {...newIconProps} />
            )}
            {!iconName && startIconName && (
              <IconLegacy
                name={startIconName}
                size={startIconSize || IconSizeLegacy.Xs}
                color={iconColorLegacy || startIconProps?.color}
                {...restStartIconProps}
              />
            )}
            {!iconName && !startIconName && iconNameLegacy && (
              <IconLegacy
                name={iconNameLegacy}
                size={startIconSize || IconSizeLegacy.Xs}
                color={iconColorLegacy || startIconProps?.color}
                {...restStartIconProps}
              />
            )}
          </>
        )}
        {textVariant && (
          <Text
            variant={textVariant}
            color={
              (labelProps?.color as TextColor | undefined) ||
              TextColor.TextAlternative
            }
          >
            {label}
          </Text>
        )}
        {!textVariant && textVariantLegacy && (
          <TextLegacy
            variant={textVariantLegacy}
            color={labelColor || TextColorLegacy.textAlternative}
            {...restLabelProps}
          >
            {label}
          </TextLegacy>
        )}
        {!textVariant && !textVariantLegacy && (
          <TextLegacy
            variant={TextVariantLegacy.bodySm}
            color={labelColor || TextColorLegacy.textAlternative}
            {...restLabelProps}
          >
            {label}
          </TextLegacy>
        )}
      </Box>
    );
  },
);
