import React, { type ComponentPropsWithoutRef } from 'react';
import {
  ButtonBase,
  ButtonSize,
  twMerge,
} from '@metamask/design-system-react';

export type ButtonFilterProps = {
  isActive?: boolean;
} & Omit<ComponentPropsWithoutRef<typeof ButtonBase>, 'size'>;

export function ButtonFilter({
  children,
  isActive = false,
  className,
  ...props
}: ButtonFilterProps) {
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
}
