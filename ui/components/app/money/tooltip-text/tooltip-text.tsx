import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import classnames from 'clsx';
import {
  SensitiveTextLength,
  Text,
  type TextProps,
} from '@metamask/design-system-react';

const TOOLTIP_POPOVER_STYLE = {
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

const CLOSE_DELAY_MS = 150;

export type TooltipTextPosition = 'bottom' | 'bottom-start' | 'bottom-end';

const POSITION_CLASS: Record<TooltipTextPosition, string> = {
  bottom: '[position-area:bottom_span-all] [justify-self:anchor-center]',
  'bottom-start': '[position-area:bottom_span-right] [justify-self:start]',
  'bottom-end': '[position-area:bottom_span-left] [justify-self:end]',
};

const supportsInterestInvokers =
  typeof HTMLButtonElement !== 'undefined' &&
  'interestForElement' in HTMLButtonElement.prototype;

type PopoverElement = HTMLDivElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

export type TooltipTextProps = Omit<TextProps, 'children' | 'asChild'> & {
  /** The visible text that is underlined and acts as the tooltip trigger. */
  text: string;
  /** The tooltip body, shown while the trigger is hovered or focused. */
  children: ReactNode;
  /** Replaces the trigger text with bullet characters, like `SensitiveText`. */
  isHidden?: boolean;
  /** Number of bullet characters shown while hidden. */
  length?: SensitiveTextLength | string;
  position?: TooltipTextPosition;
  /** Called each time the tooltip opens. */
  onOpen?: () => void;
  /** Merged over the default popover panel styles (e.g. maxWidth, padding). */
  popoverStyle?: CSSProperties;
  'data-testid'?: string;
};

export function TooltipText({
  children,
  text,
  isHidden = false,
  length = SensitiveTextLength.Short,
  position = 'bottom',
  popoverStyle,
  onOpen,
  className,
  'data-testid': dataTestId,
  ...textProps
}: Readonly<TooltipTextProps>) {
  const id = useId();
  const popoverId = `money-tooltip-${id.replace(/:/gu, '')}`;
  const anchorName = `--${popoverId}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<PopoverElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !supportsInterestInvokers || !onOpen) {
      return undefined;
    }
    trigger.addEventListener('interest', onOpen);
    return () => trigger.removeEventListener('interest', onOpen);
  }, [onOpen]);

  useEffect(() => {
    if (supportsInterestInvokers) {
      return undefined;
    }
    const popover = popoverRef.current;
    if (!isOpen || !popover) {
      return undefined;
    }
    popover.showPopover?.();
    return () => popover.hidePopover?.();
  }, [isOpen]);

  useEffect(() => {
    if (supportsInterestInvokers || !isOpen) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) {
      return undefined;
    }
    const placeArrow = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'open') {
        return;
      }
      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      popover.dataset.placement =
        popoverRect.bottom <= triggerRect.top ? 'top' : 'bottom';
      popover.style.setProperty(
        '--tooltip-arrow-left',
        `${triggerRect.left + triggerRect.width / 2 - popoverRect.left}px`,
      );
    };
    popover.addEventListener('toggle', placeArrow);
    return () => popover.removeEventListener('toggle', placeArrow);
  }, []);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimerRef.current);
  }, []);

  const open = useCallback(() => {
    cancelClose();
    setIsOpen((wasOpen) => {
      if (!wasOpen) {
        onOpen?.();
      }
      return true;
    });
  }, [cancelClose, onOpen]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const fallbackTriggerHandlers = supportsInterestInvokers
    ? {}
    : {
        onMouseEnter: open,
        onMouseLeave: scheduleClose,
        onFocus: open,
        onBlur: scheduleClose,
      };

  const fallbackPopoverHandlers = supportsInterestInvokers
    ? {}
    : { onMouseEnter: cancelClose, onMouseLeave: scheduleClose };

  return (
    <>
      <Text
        {...textProps}
        asChild
        className={classnames(
          'cursor-default border-0 bg-transparent p-0 underline decoration-dotted underline-offset-4',
          className,
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          // @ts-expect-error We need to update React types
          interestfor={popoverId} // eslint-disable-line react/no-unknown-property
          style={{ anchorName } as CSSProperties}
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
          {...fallbackTriggerHandlers}
        >
          {isHidden ? '•'.repeat(Number(length)) : text}
        </button>
      </Text>
      <div
        ref={popoverRef}
        id={popoverId}
        // @ts-expect-error We need to update React types
        popover="hint"
        className={classnames(
          'money-tooltip-text m-0 inset-auto overflow-visible rounded-lg border border-border-muted bg-background-default text-start text-text-default shadow-md [position-try-fallbacks:flip-block]',
          POSITION_CLASS[position],
        )}
        style={
          {
            ...TOOLTIP_POPOVER_STYLE,
            ...popoverStyle,
            positionAnchor: anchorName,
          } as CSSProperties
        }
        data-testid={dataTestId}
        {...fallbackPopoverHandlers}
      >
        {children}
      </div>
    </>
  );
}
