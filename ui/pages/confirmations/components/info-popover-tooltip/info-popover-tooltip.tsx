import React, {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';
import { IconColor } from '../../../../helpers/constants/design-system';

const POPOVER_STYLE = {
  zIndex: 3,
  backgroundColor: 'var(--color-text-default)',
  paddingInline: '6px',
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
        color={iconColor}
        marginLeft={iconMarginLeft}
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
