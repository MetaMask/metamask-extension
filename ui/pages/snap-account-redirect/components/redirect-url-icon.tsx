import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';

interface RedirectUrlIconProps {
  url: string;
  onSubmit?: () => void;
}

const RedirectUrlIcon = ({ url, onSubmit }: RedirectUrlIconProps) => {
  return (
    <ButtonIcon
      onClick={() => {
        global.platform.openTab({ url });
        onSubmit?.();
      }}
      iconName={IconName.Export}
      color={IconColor.primaryDefault}
      size={ButtonIconSize.Sm}
      ariaLabel={''}
    />
  );
};

export default React.memo(RedirectUrlIcon);
