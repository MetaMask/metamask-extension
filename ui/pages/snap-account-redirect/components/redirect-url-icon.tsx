import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';

interface RedirectUrlIconProps {
  url: string;
}

const RedirectUrlIcon = ({ url }: RedirectUrlIconProps) => {
  return (
    <ButtonIcon
      onClick={() => {
        global.platform.openTab({ url });
      }}
      iconName={IconName.Export}
      color={IconColor.primaryDefault}
      size={ButtonIconSize.Sm}
      ariaLabel={''}
    />
  );
};

export default React.memo(RedirectUrlIcon);
