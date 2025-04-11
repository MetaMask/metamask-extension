// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import type { IconColor } from '../../../../helpers/constants/design-system';
import type { IconName, IconSize } from '../../../component-library/icon';
import { Icon } from '../../../component-library/icon';

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
