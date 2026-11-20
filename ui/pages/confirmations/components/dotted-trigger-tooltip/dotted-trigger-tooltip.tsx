import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Box, TextColor, TextVariant } from '@metamask/design-system-react';
import {
  Popover,
  PopoverPosition,
} from '../../../../components/component-library';
import { DottedTrigger } from '../dotted-trigger';

const POPOVER_CLOSE_DELAY_MS = 150;

const POPOVER_STYLE = {
  maxWidth: 250,
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '6px',
  zIndex: 3,
} as const;

export type DottedTriggerTooltipProps = {
  children: ReactNode;
  'data-testid'?: string;
  offset?: [number, number];
  position?: PopoverPosition;
  text: string;
  textColor?: TextColor;
  textVariant?: TextVariant;
};

/**
 * Dotted-underline trigger paired with an accessible hover/focus/click popover.
 */
export function DottedTriggerTooltip({
  children,
  'data-testid': dataTestId,
  offset,
  position = PopoverPosition.BottomEnd,
  text,
  textColor,
  textVariant,
}: Readonly<DottedTriggerTooltipProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverId = useId();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  const setTriggerRef = useCallback((node: HTMLButtonElement | null) => {
    setReferenceElement(node);
  }, []);

  const handleOpen = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
  }, [clearCloseTimer]);

  const handleClose = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
  }, [clearCloseTimer]);

  const handleScheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setIsOpen(false);
    }, POPOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  return (
    <Box>
      <DottedTrigger
        ref={setTriggerRef}
        aria-describedby={isOpen ? popoverId : undefined}
        color={textColor}
        data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        onBlur={handleClose}
        onClick={handleOpen}
        onFocus={handleOpen}
        onMouseEnter={handleOpen}
        onMouseLeave={handleScheduleClose}
        text={text}
        variant={textVariant}
      />
      <Popover
        data-testid={dataTestId}
        flip
        hasArrow
        id={popoverId}
        isOpen={isOpen}
        isPortal
        offset={offset}
        onClickOutside={handleClose}
        onMouseEnter={handleOpen}
        onMouseLeave={handleScheduleClose}
        onPressEscKey={handleClose}
        position={position}
        preventOverflow
        referenceElement={referenceElement}
        style={POPOVER_STYLE}
      >
        {children}
      </Popover>
    </Box>
  );
}
