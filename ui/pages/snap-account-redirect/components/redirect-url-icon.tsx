import React from 'react';
import { ButtonIcon } from '../../../components/component-library/button-icon/button-icon';
import { ButtonIconSize } from '../../../components/component-library/button-icon/button-icon.types';
import { IconName } from '../../../components/component-library/icon/icon.types';
import { IconColor } from '../../../helpers/constants/design-system';

type RedirectUrlIconProps = {
  url: string;
  onSubmit?: () => void;
};

const RedirectUrlIcon = ({ url, onSubmit }: RedirectUrlIconProps) => {
  return (
    <ButtonIcon
      data-testid="snap-account-redirect-url-icon"
      onClick={() => {
        global.platform.openTab({ url });
        onSubmit?.();
      }}
      iconName={IconName.Export}
      color={IconColor.primaryDefault}
      size={ButtonIconSize.Sm}
      ariaLabel=""
    />
  );
};

export default React.memo(RedirectUrlIcon);
