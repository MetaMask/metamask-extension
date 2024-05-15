import React, { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react';
import classnames from 'classnames';
import { ButtonType, UserInputEventType } from '@metamask/snaps-sdk';
import { ButtonLinkProps, Text } from '../../../component-library';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import {
  FontWeight,
  TextColor,
} from '../../../../helpers/constants/design-system';

export type SnapUIButtonProps = {
  name?: string;
};

const COLORS = {
  primary: TextColor.infoDefault,
  destructive: TextColor.errorDefault,
  disabled: TextColor.textMuted,
};

export const SnapUIButton: FunctionComponent<
  SnapUIButtonProps & ButtonLinkProps<'button'>
> = ({
  name,
  children,
  type,
  variant = 'primary',
  disabled,
  className,
  ...props
}) => {
  const { handleEvent } = useSnapInterfaceContext();

  const handleClick = (event: ReactMouseEvent<any>) => {
    if (type === ButtonType.Button) {
      event.preventDefault();
    }

    handleEvent({ event: UserInputEventType.ButtonClickEvent, name });
  };

  const overridenVariant = disabled ? 'disabled' : variant;

  const color = COLORS[overridenVariant];

  return (
    <Text
      className={classnames(className, 'snap-ui-button', {
        'snap-ui-button--variant-primary': variant === 'primary',
        'snap-ui-button--variant-destructive': variant === 'destructive',
        'snap-ui-button--disabled': disabled,
      })}
      as="button"
      id={name}
      type={type}
      fontWeight={FontWeight.Medium}
      onClick={handleClick}
      color={color}
      disabled={disabled}
      {...props}
    >
      {children}
    </Text>
  );
};
