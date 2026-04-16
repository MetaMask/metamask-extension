import React, {
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import {
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';

const POPOVER_STYLE = {
  /** Above extension chrome (see ui/css/design-system/_z-index.scss) */
  zIndex: 1050,
  backgroundColor: 'var(--color-text-default)',
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

type InfoPopoverTooltipProps = {
  children: ReactNode;
  position?: PopoverPosition;
  iconName?: IconName;
  iconSize?: ButtonIconSize;
  iconColor?: IconColor | string;
  iconMarginLeft?: number;
  /**
   * Pixel size for the inline `Icon` when `plainIcon` is true (ignored for
   * `ButtonIcon`).
   */
  iconVisualSize?: IconSize;
  /**
   * When true, renders a plain Icon instead of a ButtonIcon so the trigger
   * matches the visual weight of inline row icons (e.g. the fee-row
   * question mark). The icon is still clickable.
   */
  plainIcon?: boolean;
  /** Accessible name for the popover trigger (prefer context-specific copy). */
  ariaLabel?: string;
  /** Merged over default popover panel styles (e.g. maxWidth, padding). */
  popoverStyle?: CSSProperties;
  /**
   * Optional styles for the root wrapper around the anchor + popover (e.g.
   * `display: 'inline-flex'`, `alignItems: 'center'`, `alignSelf: 'center'`
   * next to heading text). Omit to keep existing layout unchanged.
   */
  wrapperStyle?: CSSProperties;
  'data-testid'?: string;
};

export function InfoPopoverTooltip({
  children,
  position = PopoverPosition.BottomEnd,
  iconName = IconName.Info,
  iconSize = ButtonIconSize.Md,
  iconColor,
  iconMarginLeft,
  iconVisualSize = IconSize.Sm,
  plainIcon = false,
  ariaLabel,
  popoverStyle,
  wrapperStyle,
  'data-testid': dataTestId,
}: Readonly<InfoPopoverTooltipProps>) {
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

  const marginStyle = iconMarginLeft
    ? { marginLeft: `${iconMarginLeft * 4}px` }
    : undefined;

  return (
    <Box style={wrapperStyle}>
      <span
        ref={setAnchorRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          ...marginStyle,
        }}
      >
        {plainIcon ? (
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
              size={iconVisualSize}
              color={iconColor as IconColor}
            />
          </button>
        ) : (
          <ButtonIcon
            ariaLabel={ariaLabel ?? 'info'}
            iconName={iconName}
            size={iconSize}
            onClick={handleToggle}
            data-testid={dataTestId ? `${dataTestId}-button` : undefined}
            iconProps={
              iconColor ? { color: iconColor as IconColor } : undefined
            }
          />
        )}
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
