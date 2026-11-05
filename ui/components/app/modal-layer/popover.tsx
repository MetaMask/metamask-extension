import React, { forwardRef } from 'react';
import {
  Popover as DesignSystemPopover,
  type PopoverProps,
} from '@metamask/design-system-react';
import { useModalActivity } from './modal-layer';

/** Suspend floating portals alongside their owning dialog. */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  ({ style, onClickOutside, onPressEscKey, ...props }, ref) => {
    const isActive = useModalActivity();
    return (
      <DesignSystemPopover
        {...props}
        ref={ref}
        hidden={!isActive || props.hidden}
        style={{ ...style, ...(!isActive && { display: 'none' }) }}
        onClickOutside={isActive ? onClickOutside : undefined}
        onPressEscKey={isActive ? onPressEscKey : undefined}
      />
    );
  },
);
Popover.displayName = 'Popover';
