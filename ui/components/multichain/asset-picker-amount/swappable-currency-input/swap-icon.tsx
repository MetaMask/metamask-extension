import React from 'react';
import {
  BackgroundColor,
  IconColor,
} from '../../../../helpers/constants/design-system';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';

export default function SwapIcon({
  onClick,
  ariaLabel,
}: {
  ariaLabel: string;
  onClick?: React.MouseEventHandler;
}) {
  return (
    <ButtonIcon
      backgroundColor={BackgroundColor.transparent}
      iconName={IconName.Refresh}
      size={ButtonIconSize.Sm}
      color={IconColor.primaryDefault}
      onClick={onClick}
      ariaLabel={ariaLabel}
    />
  );
}
