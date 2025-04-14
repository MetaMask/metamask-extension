// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import classnames from 'classnames';

import { ButtonBase, ButtonBaseProps } from '../button-base';
import { Color } from '../../../helpers/constants/design-system';
import { PolymorphicRef } from '../box';
import type { ButtonSecondaryProps } from './button-secondary.types';
import {
  ButtonSecondarySize,
  ButtonSecondaryComponent,
} from './button-secondary.types';

export const ButtonSecondary: ButtonSecondaryComponent = React.forwardRef(
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'button' | 'a'>(
    {
      className = '',
      danger = false,
      disabled = false,
      size = ButtonSecondarySize.Md,
      ...props
    }: ButtonSecondaryProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const buttonColor = danger ? Color.errorDefault : Color.primaryDefault;
    return (
      <ButtonBase
        backgroundColor={Color.transparent}
        borderColor={buttonColor}
        color={buttonColor}
        className={classnames(className, 'mm-button-secondary', {
          'mm-button-secondary--type-danger': danger,
          'mm-button-secondary--disabled': disabled,
        })}
        size={size}
        ref={ref}
        {...{ disabled, ...(props as ButtonBaseProps<C>) }}
      />
    );
  },
);
