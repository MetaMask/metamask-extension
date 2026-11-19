import React, {
  useCallback,
  useId,
  useRef,
  useState,
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
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';
import { DottedTrigger } from '../modals/money-deposit-dialogs/dotted-trigger';

const POPOVER_STYLE = {
  zIndex: 3,
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

type InfoPopoverTooltipProps = {
  children: ReactNode;
  position?: PopoverPosition;
  offset?: [number, number];
  iconName?: IconName;
  iconSize?: ButtonIconSize;
  iconColor?: IconColor | string;
  iconMarginLeft?: number;
  /**
   * When true, renders a plain Icon instead of a ButtonIcon so the trigger
   * matches the visual weight of inline row icons (e.g. the fee-row
   * question mark). The icon is still clickable.
   */
  plainIcon?: boolean;
  /**
   * When set, renders a dotted-underline button trigger with hover, focus,
   * and click activation instead of an icon button.
   */
  dottedText?: string;
  textVariant?: TextVariant;
  textColor?: TextColor;
  /** Accessible name for the popover trigger (prefer context-specific copy). */
  ariaLabel?: string;
  'data-testid'?: string;
};

export function InfoPopoverTooltip({
  children,
  position = PopoverPosition.BottomEnd,
  offset,
  iconName = IconName.Info,
  iconSize = ButtonIconSize.Md,
  iconColor,
  iconMarginLeft,
  plainIcon = false,
  dottedText,
  textVariant,
  textColor,
  ariaLabel,
  'data-testid': dataTestId,
}: Readonly<InfoPopoverTooltipProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const popoverId = useId();
  const isHoveredRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isClickPinnedRef = useRef(false);

  const setTriggerRef = useCallback((node: HTMLElement | null) => {
    setReferenceElement(node);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    isHoveredRef.current = false;
    isFocusedRef.current = false;
    isClickPinnedRef.current = false;
    setIsOpen(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    if (!isFocusedRef.current && !isClickPinnedRef.current) {
      setIsOpen(false);
    }
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    isClickPinnedRef.current = false;
    if (!isHoveredRef.current) {
      setIsOpen(false);
    }
  }, []);

  const handleDottedClick = useCallback(() => {
    if (isClickPinnedRef.current) {
      isClickPinnedRef.current = false;
      setIsOpen(false);
    } else {
      isClickPinnedRef.current = true;
      setIsOpen(true);
    }
  }, []);

  const marginStyle = iconMarginLeft
    ? { marginLeft: `${iconMarginLeft * 4}px` }
    : undefined;

  const popover = (
    <Popover
      id={popoverId}
      isOpen={isOpen}
      position={position}
      referenceElement={referenceElement}
      hasArrow
      flip
      preventOverflow
      offset={offset}
      onPressEscKey={handleClose}
      onClickOutside={handleClose}
      isPortal
      style={POPOVER_STYLE}
      data-testid={dataTestId}
    >
      {children}
    </Popover>
  );

  if (dottedText !== undefined) {
    return (
      <>
        <DottedTrigger
          ref={setTriggerRef}
          text={dottedText}
          variant={textVariant}
          color={textColor}
          onClick={handleDottedClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-describedby={isOpen ? popoverId : undefined}
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        />
        {popover}
      </>
    );
  }

  return (
    <Box>
      {plainIcon ? (
        <button
          ref={setTriggerRef}
          type="button"
          aria-label={ariaLabel ?? 'info'}
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
            name={iconName}
            size={IconSize.Sm}
            color={iconColor as IconColor}
          />
        </button>
      ) : (
        <ButtonIcon
          ref={setTriggerRef}
          ariaLabel={ariaLabel ?? 'info'}
          iconName={iconName}
          size={iconSize}
          onClick={handleToggle}
          data-testid={dataTestId ? `${dataTestId}-button` : undefined}
          iconProps={iconColor ? { color: iconColor as IconColor } : undefined}
          style={marginStyle}
        />
      )}
      {popover}
    </Box>
  );
}
