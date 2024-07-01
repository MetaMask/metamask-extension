import React from 'react';
import {
  BackgroundColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { AvatarIconSize, IconProps, Text } from '../../component-library';
import { DelineatorType } from './delineator.types';

const defaultIconProps = {
  size: AvatarIconSize.Xs,
};

/*
 * Get the icon props based on the type of delineator.
 */
export const getIconPropsByType = (type?: DelineatorType) => {
  let iconProps = {};
  const inverseIconColorProp = {
    color: IconColor.infoInverse,
  } as IconProps<'span'>;

  switch (type) {
    case DelineatorType.Error:
      iconProps = {
        iconProps: inverseIconColorProp,
        backgroundColor: BackgroundColor.errorDefault,
      };
      break;
    default:
      iconProps = {
        iconProps: inverseIconColorProp,
        backgroundColor: BackgroundColor.overlayAlternative,
      };
  }
  return { ...defaultIconProps, ...iconProps };
};

/*
 * Get the text color based on the type of delineator.
 */
const getTextColorByType = (type?: DelineatorType) => {
  switch (type) {
    case DelineatorType.Error:
      return TextColor.errorDefault;
    default:
      return TextColor.textAlternative;
  }
};

/*
 * Override the color of a Text component based on the type of delineator.
 */
export const overrideTextComponentColorByType = ({
  component,
  type,
}: {
  component: React.ReactElement<typeof Text>;
  type?: DelineatorType;
}) => {
  const color = getTextColorByType(type);

  return React.cloneElement(component, {
    color,
  } as React.ComponentProps<typeof Text>);
};
