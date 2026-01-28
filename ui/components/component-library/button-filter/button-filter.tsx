import React from 'react';
import {
  ButtonBase,
  ButtonBaseProps,
  ButtonSize,
  twMerge,
} from '@metamask/design-system-react';

export interface ButtonFilterProps extends ButtonBaseProps {
  isActive?: boolean;
}

export const ButtonFilter: React.FC<ButtonFilterProps> = ({
  children,
  isActive = false,
  className,
  ...props
}) => {
  return (
    <ButtonBase
      size={ButtonSize.Sm}
      className={twMerge(
        'px-2 rounded-lg whitespace-nowrap',
        isActive
          ? 'bg-icon-default text-primary-inverse hover:bg-icon-default-hover active:bg-icon-default-pressed'
          : 'bg-background-muted text-default hover:bg-hover',
        className,
      )}
      {...props}
    >
      {children}
    </ButtonBase>
  );
};
