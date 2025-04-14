// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
        // eslint-disable-next-line no-restricted-globals
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
