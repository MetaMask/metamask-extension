import type { PolymorphicComponentPropWithRef } from '../box';
import type { ButtonPrimaryStyleUtilityProps } from '../button-primary/button-primary.types';
import type { ButtonSecondaryStyleUtilityProps } from '../button-secondary/button-secondary.types';
import type { ButtonLinkStyleUtilityProps } from '../button-link/button-link.types';

export enum ButtonSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Inherit = 'inherit',
  Auto = 'auto',
}

export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Link = 'link',
}

type ValidButtonSize = ButtonSize.Sm | ButtonSize.Md | ButtonSize.Lg;

type ButtonPropsByVariant = {
  [ButtonVariant.Primary]: {
    variant?: ButtonVariant.Primary;
    size?: ValidButtonSize; // Allows for only ButtonSize.Sm, ButtonSize.Md, ButtonSize.Lg
  } & Omit<ButtonPrimaryStyleUtilityProps, 'size' | 'variant'>;
  [ButtonVariant.Secondary]: {
    variant?: ButtonVariant.Secondary;
    size?: ValidButtonSize; // Allows for only ButtonSize.Sm, ButtonSize.Md, ButtonSize.Lg
  } & Omit<ButtonSecondaryStyleUtilityProps, 'size' | 'variant'>;
  [ButtonVariant.Link]: {
    variant?: ButtonVariant.Link;
    size?: ButtonSize;
  } & Omit<ButtonLinkStyleUtilityProps, 'size' | 'variant'>;
};

type ButtonPropsMap = {
  [variant in ButtonVariant]: ButtonPropsByVariant[variant];
};

export type ButtonProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ButtonPropsMap[ButtonVariant]>;

export type ButtonComponent = <C extends React.ElementType = 'button' | 'a'>(
  props: ButtonProps<C>,
) => React.ReactElement | null;
