import React, { FunctionComponent } from 'react';
import { ButtonVariant } from '@metamask/snaps-sdk';
import {
  Button,
  ButtonPrimaryProps,
  ButtonSecondaryProps,
  ButtonSize,
} from '../../../component-library';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
  IconColor,
} from '../../../../helpers/constants/design-system';

type SnapFooterButtonProps = {
  variant?: ButtonVariant;
} & (ButtonPrimaryProps<'button'> | ButtonSecondaryProps<'button'>);

export const SnapFooterButton: FunctionComponent<SnapFooterButtonProps> = ({
  variant = ButtonVariant.Primary,
  onClick,
  children,
  ...props
}) => {
  const isSecondary = variant === ButtonVariant.Secondary;
  return (
    <Button
      className="snap-footer-button"
      {...props}
      size={ButtonSize.Lg}
      block
      variant={variant}
      onClick={onClick}
      textProps={{
        display: Display.Flex,
        alignItems: AlignItems.center,
        flexDirection: FlexDirection.Row,
      }}
      borderColor={
        isSecondary
          ? (IconColor.iconDefault as unknown as BorderColor)
          : undefined
      }
    >
      {children}
    </Button>
  );
};
