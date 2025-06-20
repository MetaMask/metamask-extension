import React from 'react';
import { Icon, IconName, IconSize } from '../../../component-library/icon';
import { IconColor } from '../../../../helpers/constants/design-system';

export type SnapUIIconProps = {
  name: IconName;
  color?: IconColor;
  size?: IconSize;
};

export const SnapUIIcon = ({ name, color, size }: SnapUIIconProps) => {
  return (
    <Icon
      className="snap-ui-renderer__icon"
      name={name}
      size={size}
      color={color}
    />
  );
};
