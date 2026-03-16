import React, { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import {
  Icon,
  IconName as LegacyIconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';
import { IconColor as LegacyIconColor } from '../../../../helpers/constants/design-system';

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
  iconName?: IconName;
  iconSize?: ButtonIconSize;
  iconColor?: IconColor | LegacyIconColor | string;
  iconMarginLeft?: number;
  /**
   * When true, renders a plain Icon instead of a ButtonIcon so the trigger
   * matches the visual weight of inline row icons (e.g. the fee-row
   * question mark). The icon is still clickable.
   */
  plainIcon?: boolean;
  'data-testid'?: string;
};

export function InfoPopoverTooltip({
  children,
  position = PopoverPosition.BottomEnd,
  iconName = IconName.Info,
  iconSize = ButtonIconSize.Md,
  iconColor,
  iconMarginLeft,
  plainIcon = false,
  'data-testid': dataTestId,
}: Readonly<InfoPopoverTooltipProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement & HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const marginStyle = iconMarginLeft
    ? { marginLeft: `${iconMarginLeft * 4}px` }
    : undefined;

  return (
    <Box>
      {plainIcon ? (
        <button
          ref={triggerRef as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={handleToggle}
          data-testid={dataTestId ? `${dataTestId}-button` : undefined}
          style={{
            ...marginStyle,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <Icon
            name={iconName as unknown as LegacyIconName}
            size={IconSize.Sm}
            color={iconColor as LegacyIconColor}
          />
        </button>
      ) : (
        <ButtonIcon
          ref={triggerRef as React.Ref<HTMLButtonElement>}
          ariaLabel="info"
          iconName={iconName}
          size={iconSize}
          onClick={handleToggle}
          data-testid={dataTestId ? `${dataTestId}-button` : undefined}
          iconProps={iconColor ? { color: iconColor as IconColor } : undefined}
          style={marginStyle}
        />
      )}
      <Popover
        isOpen={isOpen}
        position={position}
        referenceElement={triggerRef.current}
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
