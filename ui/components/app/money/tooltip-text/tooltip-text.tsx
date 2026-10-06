import React, {
  useCallback,
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
import { Popover } from '../../../component-library/popover/popover';
import { PopoverPosition } from '../../../component-library/popover/popover.types';

const TOOLTIP_POPOVER_STYLE = {
  zIndex: 1050,
  paddingTop: '6px',
  paddingBottom: '6px',
  paddingLeft: '16px',
  paddingRight: '16px',
  maxWidth: 250,
} as const;

export type TooltipTextProps = Omit<TextProps, 'children' | 'asChild'> & {
  /** The visible text that is underlined and acts as the tooltip trigger. */
  text: string;
  /** The tooltip body, shown while the text is hovered. */
  children: ReactNode;
  /** Replaces the trigger text with bullet characters, like `SensitiveText`. */
  isHidden?: boolean;
  /** Number of bullet characters shown while hidden. */
  length?: SensitiveTextLength | string;
  position?: PopoverPosition;
  /** Called the first time the tooltip opens after mounting. */
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
  position = PopoverPosition.BottomEnd,
  popoverStyle,
  onOpen,
  className,
  'data-testid': dataTestId,
  ...textProps
}: Readonly<TooltipTextProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const popoverId = useId();
  const hasOpenedRef = useRef(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (hasOpenedRef.current) {
      return;
    }
    hasOpenedRef.current = true;
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Text
        {...textProps}
        asChild
        className={classnames(
          'underline decoration-dotted underline-offset-[32%] decoration-[8%]',
          className,
        )}
      >
        <span
          ref={setReferenceElement}
          aria-describedby={isOpen ? popoverId : undefined}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        >
          {isHidden ? '•'.repeat(Number(length)) : text}
        </span>
      </Text>
      <Popover
        id={popoverId}
        isOpen={isOpen}
        position={position}
        referenceElement={referenceElement}
        hasArrow
        onPressEscKey={handleClose}
        isPortal
        style={{ ...TOOLTIP_POPOVER_STYLE, ...popoverStyle }}
        data-testid={dataTestId}
      >
        {children}
      </Popover>
    </>
  );
}
