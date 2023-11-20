import React from 'react';
import type { PolymorphicRef } from '../box';
import { ButtonPrimary } from '../button-primary';
import { ButtonSecondary } from '../button-secondary';
import { ButtonLink } from '../button-link';
import type { ButtonPrimaryProps } from '../button-primary/button-primary.types';
import type { ButtonSecondaryProps } from '../button-secondary/button-secondary.types';
import type { ButtonLinkProps } from '../button-link/button-link.types';
import type { ButtonProps, ButtonComponent } from './button.types';

import { ButtonVariant } from './button.types';

export const Button: ButtonComponent = React.forwardRef(
  <C extends React.ElementType = 'button' | 'a'>(
    { variant, ...props }: ButtonProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    switch (variant) {
      case ButtonVariant.Primary:
        return (
          <ButtonPrimary ref={ref} {...(props as ButtonPrimaryProps<C>)} />
        );
      case ButtonVariant.Secondary:
        return (
          <ButtonSecondary ref={ref} {...(props as ButtonSecondaryProps<C>)} />
        );
      case ButtonVariant.Link:
        return <ButtonLink ref={ref} {...(props as ButtonLinkProps<C>)} />;
      default:
        return (
          <ButtonPrimary ref={ref} {...(props as ButtonPrimaryProps<C>)} />
        );
    }
  },
);
