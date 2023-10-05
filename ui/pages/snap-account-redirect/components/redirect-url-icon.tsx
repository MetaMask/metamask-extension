import React from 'react';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';

interface RedirectUrlIconProps {
  url: string;
}

const RedirectUrlIcon = ({ url }: RedirectUrlIconProps) => {
  return (
    <Icon
      onClick={() => {
        global.platform.openTab({ url });
      }}
      name={IconName.Share}
      color={IconColor.primaryDefault}
      size={IconSize.Sm}
    />
  );
};

export default React.memo(RedirectUrlIcon);
