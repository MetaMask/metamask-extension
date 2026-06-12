import React, {
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../../component-library';

/**
 * Default panel styles — matches confirmations InfoPopoverTooltip for visual parity.
 * Z-index above extension chrome (see ui/css/design-system/_z-index.scss).
 */
const POPOVER_STYLE = {
  zIndex: 1050,
  backgroundColor: 'var(--color-text-default)',
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

export type InfoPopoverProps = {
  children: ReactNode;
  position?: PopoverPosition;
  iconName?: IconName;
  iconColor?: IconColor;
  iconSize?: IconSize;
  /** Accessible name for the popover trigger. */
  ariaLabel?: string;
  /** Merged over default popover panel styles (e.g. maxWidth, padding). */
  popoverStyle?: CSSProperties;
  /**
   * Optional styles for the root wrapper around the anchor + popover (e.g.
   * inline next to heading text).
   */
  wrapperStyle?: CSSProperties;
  'data-testid'?: string;
};

/**
 * Click-to-open anchored popover with an info icon trigger.
 * Used on the mUSD asset page; mirrors the confirmations `plainIcon` InfoPopoverTooltip path.
 * @param options0
 * @param options0.children
 * @param options0.position
 * @param options0.iconName
 * @param options0.iconColor
 * @param options0.iconSize
 * @param options0.ariaLabel
 * @param options0.popoverStyle
 * @param options0.wrapperStyle
 * @param options0.'data-testid'
 */
export function InfoPopover({
  children,
  position = PopoverPosition.BottomEnd,
  iconName = IconName.Info,
  iconColor,
  iconSize = IconSize.Sm,
  ariaLabel,
  popoverStyle,
  wrapperStyle,
  'data-testid': dataTestId,
}: Readonly<InfoPopoverProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setAnchorRef = useCallback((node: HTMLElement | null) => {
    setReferenceElement(node);
  }, []);

  return (
    <Box style={wrapperStyle}>
      <span
        ref={setAnchorRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          aria-label={ariaLabel ?? 'info'}
          onClick={handleToggle}
          data-testid={dataTestId ? `${dataTestId}-button` : undefined}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon
            name={iconName}
            size={iconSize}
            {...(iconColor === undefined ? {} : { color: iconColor })}
          />
        </button>
      </span>
      <Popover
        isOpen={isOpen}
        position={position}
        referenceElement={referenceElement}
        hasArrow
        onPressEscKey={handleClose}
        onClickOutside={handleClose}
        isPortal
        style={{ ...POPOVER_STYLE, ...popoverStyle }}
        data-testid={dataTestId}
      >
        {children}
      </Popover>
    </Box>
  );
}
