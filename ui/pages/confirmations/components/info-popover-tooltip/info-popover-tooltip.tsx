import React, { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import {
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';

const POPOVER_STYLE = {
  zIndex: 3,
  backgroundColor: 'var(--color-text-default)',
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 240,
} as const;

type InfoPopoverTooltipProps = {
  children: ReactNode;
  position?: PopoverPosition;
  iconSize?: ButtonIconSize;
  iconColor?: IconColor;
  iconMarginLeft?: number;
  'data-testid'?: string;
};

export function InfoPopoverTooltip({
  children,
  position = PopoverPosition.BottomEnd,
  iconSize = ButtonIconSize.Md,
  iconColor,
  iconMarginLeft,
  'data-testid': dataTestId,
}: Readonly<InfoPopoverTooltipProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Box>
      <ButtonIcon
        ref={buttonRef}
        ariaLabel="info"
        iconName={IconName.Info}
        size={iconSize}
        onClick={handleToggle}
        data-testid={dataTestId ? `${dataTestId}-button` : undefined}
        iconProps={iconColor ? { color: iconColor } : undefined}
        style={
          iconMarginLeft ? { marginLeft: `${iconMarginLeft * 4}px` } : undefined
        }
      />
      <Popover
        isOpen={isOpen}
        position={position}
        referenceElement={buttonRef.current}
        hasArrow
        onPressEscKey={handleClose}
        onClickOutside={handleClose}
        isPortal
        style={POPOVER_STYLE}
        data-testid={dataTestId}
      >
        {children}
      </Popover>
    </Box>
  );
}
